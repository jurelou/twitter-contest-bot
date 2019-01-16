'use strict';

const Twit = require('twit')
const chalk = require('chalk')

class twitterAPI {

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


		/*
		fifo.push({a: "a", b:"aaa", c:["a", "a", "a"]})
		fifo.push({a: "b", b:"bbb", c:["b", "b", "b"]})
		console.log(fifo.length)
		fifo.shift()
		for (var node = fifo.node; node; node = fifo.next(node)) {
		  console.log('value is', node.value)
		}
		*/
	async search(query) {
		return new Promise((resolve, reject) => {
			this.twitter.get('search/tweets', { q: query, count: 15, result_type: 'popular', tweet_mode: 'extended'}, (err, data, response) => {
				if (err) { reject(err) }
				resolve(data)
			})
		})
	}

	async follow(id) {
		return new Promise((resolve, reject) => {
			this.twitter.post('friendships/create', { user_id: id }, (err, data, response) => {
			  if (!err) {
			  	console.log("followed: ", id)
				//fifo.push({a: "a", b:"aaa", c:["a", "a", "a"]})
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

module.exports = twitterAPI;