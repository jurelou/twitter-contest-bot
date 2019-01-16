'use strict';

const Twit = require('twit')
const chalk = require('chalk')
const fs = require('fs');

const bot = require('src/worker')
const queue = require('core/kue')
const words = require('src/words')
const fifo = require('core/fifo')()
const Job = require('models/job')
const Tweet = require('models/tweet')

class ContestBot {

	constructor() {
		this.twitter = new Twit({
		  consumer_key:         process.env.TWITTER_API_KEY,
		  consumer_secret:      process.env.TWITTER_API_KEY_SECRET,
		  access_token:         process.env.TWITTER_ACCESS_TOKEN,
		  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
		  timeout_ms:           60*1000
		  //strictSSL:            true,     // optional - requires SSL certificates to be valid.
		})
		console.log(chalk.hex('#009688')(' [*] Twitter: Connected.'))
		this.retweet = 1; 		// 0001
		this.follow = 1 << 1; 	// 0010
		this.tag = 1 << 2; 		// 0100
	}

	sleep(x) { 
	  return new Promise(resolve => {
	    setTimeout(() => {
	      resolve();
	    }, x);
	  });
	}

	start() {
		/*
		Job.find()
		.populate('tweet')
		.exec((err, data) => {
			data.forEach(elem => {


				Job.find({tweet_id: elem.tweet_id})
				.populate('tweet')
				.exec((err, el) => {
					console.log(elem.tweet_id, " @@@ ", el.length)
				})
			})
		})

		*/
		
		let delay = Math.floor(Math.random() * 12000) + 6000
		delay = 20000000
		var promise = Promise.resolve();	
		for (let i = 0; i < words.contests.length; i ++) {
			this.searchTweets(words.contests[i])
			console.log("--END---", words.contests[i])
			this.sleep(delay)
	
		}
		
	}

	async searchTweets(query) {
		return new Promise((resolve, reject) => {
			this.twitter.get('search/tweets', { q: query, count: 15, result_type: 'popular', tweet_mode: 'extended'})
			.then(data => {


				if (err) { reject(err) }
				let tweet = data.statuses
				for (let i = 0; i < tweet.length; i++) {
					let selectedTweet = await this.selectTweet(tweet[i])
					if (selectedTweet) { 
						this.addStat(selectedTweet, query)
						.catch(err => { reject(err) })							
						this.addJob(selectedTweet)
						.catch(err => { reject(err) })
					}
				}


			})
			.catch(err => { reject(err) })
		})
	}


	async selectTweet(tweet) {
		return new Promise((resolve, reject) => {
			if (tweet.is_quote_status ||
				tweet.retweeted_status != undefined){
				resolve(false)
			}
			this.alreadyExists(tweet.id_str)
			.then(res => {
				if (res) { resolve(false) }
				resolve(true)
			})
			.catch(err => { reject(err) })
		})
	}

	async addJob(data) {
		return new Promise((resolve, reject) => {
			queue.create('tweet', {
				type: data.type,
				tweet_id: data.tweet_id,
				user_id: data.tweet.user_id,
				mentions: data.tweet.mentions
			}).save((err) => {
				if (!err) reject(err)
				console.log("saving job inQ:", data.tweet)
				resolve(data)
			})


		})
	}

	async alreadyExists(id) {
		return new Promise((resolve, reject) => {
			Job.find({tweet_id: id}, (err, data) => {
				if (data.length > 0) { resolve(true) }
				resolve(false)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	async addStat(tweet, query) {
		return new Promise((resolve, reject) => {
			let text = tweet.full_text
			text = text.toLowerCase()
			this.getAllMentions(tweet.entities.user_mentions).then(user_mentions => {
				let tweetDocument = new Tweet({
					text: text,
					mentions: user_mentions,
					user_id: tweet.user.id_str,
					user_name: tweet.user.name,
					user_location: tweet.user.location,
					data: tweet.created_at
				})
				tweetDocument.save(err => {
					if (err) { reject (err) }
					let job = new Job({
						tweet: tweetDocument,
						tweet_id: tweet.id_str,
						query: query,
						type: 0
					})
					job.type = this.wordIsPresent(words.retweet, text) ? job.type | this.retweet : job.type
					job.type = this.wordIsPresent(words.follow, text) ? job.type | this.follow : job.type
					job.type = this.wordIsPresent(words.tag, text) ? job.type | this.tag : job.type
					job.save(err => {
						if (err) { reject(err) }
						console.log("job saved in DB:", job._id)
						resolve(job)
					})
				})
			})
		})
	}

		/*
		fifo.push({a: "a", b:"aaa", c:["a", "a", "a"]})
		fifo.push({a: "b", b:"bbb", c:["b", "b", "b"]})
		console.log(fifo.length)
		fifo.shift()
		for (var node = fifo.node; node; node = fifo.next(node)) {
		  console.log('value is', node.value)
		}
		*/
	async follow(id) {
		return new Promise((resolve, reject) => {
			this.twitter.post('friendships/create', { user_id: id }, (err, data, response) => {
			  if (!err) {
			  	console.log("followed: ", id)
				fifo.push({a: "a", b:"aaa", c:["a", "a", "a"]})
			  	resolve(data)
			  }
			  reject(err)
			})
		})
	}

	async unfollow(id) {
		return new Promise((resolve, reject) => {
			this.twitter.post('friendships/destroy', { user_id: id }, (err, data, response) => {
			  if (!err) {
			  	console.log("unfollowed: ", id)
			  	resolve(data)
			  }
			  reject(err)
			})			
		})		
	}

	async comment(id) {
		return new Promise((resolve, reject) => {
			this.twitter.get('statuses/show', { id: id }, (err, data, response) => {
				let msg = '@' + data.user.name + ' ' + words.message[Math.floor(Math.random()*words.message.length)];
				this.twitter.post('statuses/update', { status: msg, in_reply_to_status_id: id }, (err, data, response) => {
					if (!err) {
						console.log("commented ", id)
						resolve(data)
					}
					reject(err) 
				})
			})		
		})
	}

	async retweet(id) {
		return new Promise((resolve, reject) => {
			this.twitter.post('statuses/retweet/:id', { id: id }, (err, data, response) => {
			  if (!err) {
			  	console.log("retweeted ", id)
			  	resolve(data)
			  }
			  reject(err)
			})
		})
	}

	async favorite(id) {
		return new Promise((resolve, reject) => {
			this.twitter.post('favorites/create', { id: id }, (err, data, response) => {
			  if (!err) {
			  	console.log("liked ", id)
			  	resolve(data)
			  }
			  reject(err)
			})
		})
	}

	stream() {
		this.stream = this.twitter.stream('statuses/filter', { track: words.contests })
		this.stream.on('tweet',(tweet) => {
			this.selectTweet(tweet)
		})
		this.stream.on('limit', function (limitMessage) {
			console.log("LIMIT", limitMessage)
		})

	}

	wordIsPresent(words_array, string) {
		let ret = false
		words_array.forEach(word => {
			if (string.indexOf(word) !== -1) {
				ret = true
			}
		})
		return ret
	}

	async getAllMentions(mentions) {
		return new Promise((resolve, reject) => {
			let res = []
			if (mentions) { mentions.forEach(data => { res.push(data.id_str) })}
			resolve(res)
		})
	}

	async checkRateLimit() {
		return new Promise((resolve, reject) => {
			this.getRateLimit()
			.then(items => {
				Object.entries(items.resources).forEach(item => {
					item.forEach(elem => {
						console.log(elem)
						Object.entries(elem).forEach(check => {
							if (check[1].remaining){
								if (check[1].limit != check[1].remaining) {
									reject("Rate limit exceeded" + check)
								}
							}
						})
					})
				})
				resolve()
			})
		})
	}

	async getRateLimit() {
		return new Promise((resolve, reject) => {
			this.twitter.get('application/rate_limit_status', function(err, data, res) {
				if (err) { reject(err) }
				resolve(data)
			})			
		})
	}
}

module.exports = ContestBot;