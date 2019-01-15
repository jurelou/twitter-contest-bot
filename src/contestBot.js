'use strict';

const Twit = require('twit')
const chalk = require('chalk')
const fs = require('fs');

const queue = require('core/kue')
const fifo = require('core/fifo')
const words = require('src/words')
const bot = require('src/worker')

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
	}

	start() {
		//this.retweet('1084964203683856384')
		var job = queue.create('tweet', {
		    title: 'welcome email for tj',
		    name:'lol'
		}).ttl(600000).save(function(err) { //10minutes
		   if( !err ) console.log( job.id );
		});		


	}

	async searchTweets() {
		return new Promise((resolve, reject) => {
			this.twitter.get('search/tweets', { q: 'retweet and follow', count: 10 , result_type: 'popular', tweet_mode: 'extended'}, (err, data, response) => {
				data.statuses.forEach(tweet => {
					this.selectTweet(tweet)
				})
			})			
		})
	}

	async selectTweet(tweet) {
		return new Promise((resolve, reject) => {
			if (tweet.is_quote_status || 
				tweet.retweeted_status != undefined){ 
				resolve(false) 
			}
			let text = tweet.full_text
			//let text = tweet.truncated == true ? tweet.extended_tweet.full_text : tweet.text
			text = text.toLowerCase()
			this.getAllMentions(text).then(data => {
				console.log("-------------", tweet)
				console.log("-->",text)
				console.log("metion---", data)
				console.log("rt-----", this.wordIsPresent(words.retweet, text))
				console.log("fw-----", this.wordIsPresent(words.follow, text))
				console.log("tag----", this.wordIsPresent(words.tag, text))

			})
			resolve(true)
		})
	}

	async createJob(tweet) {
		return new Promise((resolve, reject) => {
			kue.create('toto', {  
			    title: 'Welcome to the site',
			    to: 'user@example.com',
			    template: 'welcome-email'
			}).save();
			console.log(tweet)
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

	async getAllMentions(text) {
		return new Promise((resolve, reject) => {
			let text_array = text.trim().split(" ");
			let res = []
			text_array.forEach(word => {
				if (word[0] == '@'){ res.push(word) }
			})
			resolve(res)
		})
	}

	async checkRateLimit() {
		return new Promise((resolve, reject) => {
			this.getRateLimit().then(items => {
				Object.entries(items.resources).forEach(item => {
					item.forEach(elem => {
						console.log(elem)
						Object.entries(elem).forEach(check => {
							if (check[1].remaining){
								if (check[1].limit == check[1].remaining + 5) {
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