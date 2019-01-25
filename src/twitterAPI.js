'use strict';

const Twit = require('twit')
const chalk = require('chalk')
const words = require('src/words')
module.exports = {
	search: async (query, type) => {
		return new Promise((resolve, reject) => {
			twitter.get('search/tweets', { count: 100, q: query, result_type: type, tweet_mode: 'extended'}, (err, data, response) => {
				if (err) { reject(err) }
				resolve(data)
			})
		})
	},

		/*
		fifo.push({a: "a", b:"aaa", c:["a", "a", "a"]})
		fifo.push({a: "b", b:"bbb", c:["b", "b", "b"]})
		console.log(fifo.length)
		fifo.shift()
		for (var node = fifo.node; node; node = fifo.next(node)) {
		  console.log('value is', node.value)
		}
		*/
	follow: async (id) => {
		return new Promise((resolve, reject) => {
			twitter.post('friendships/create', { user_id: id }, (err, data, response) => {
			  if (!err) {
			  	console.log("followed: ", id)
				//fifo.push({a: "a", b:"aaa", c:["a", "a", "a"]})
			  	resolve(data)
			  }
			  reject(err)
			})
		})
	},

	unfollow: async (id) => {
		return new Promise((resolve, reject) => {
			twitter.post('friendships/destroy', { user_id: id }, (err, data, response) => {
			  if (!err) {
			  	console.log("unfollowed: ", id)
			  	resolve(data)
			  }
			  reject(err)
			})			
		})		
	},

	comment: async (id) => {
		return new Promise((resolve, reject) => {
			twitter.get('statuses/show', { id: id }, (err, data, response) => {
				let msg = '@' + data.user.screen_name + ' ' + words.message[Math.floor(Math.random() * words.message.length)];
				twitter.post('statuses/update', { status: msg, in_reply_to_status_id: id }, (err, data, response) => {
					if (!err) {
						console.log("commented ", id)
						resolve(data)
					}
					reject(err) 
				})
			})		
		})
	},

	retweet: async (id) => {
		return new Promise((resolve, reject) => {
			console.log("start retweet");
			twitter.post('statuses/retweet/:id', { id: id }, (err, data, response) => {
			console.log("ended rt")  
			if (!err) {
			  	console.log("retweeted ", id)
			  	resolve(data)
			  }
			  reject(err)
			})
		})
	},

	favorite: async (id) => {
		return new Promise((resolve, reject) => {
			twitter.post('favorites/create', { id: id }, (err, data, response) => {
			  if (!err) {
			  	console.log("liked ", id)
			  	resolve(data)
			  }
			  reject(err)
			})
		})
	},

	stream: () => {
		this.stream = twitter.stream('statuses/filter', { track: words.contests })
		this.stream.on('tweet',(tweet) => {
			this.selectTweet(tweet)
		})
		this.stream.on('limit', function (limitMessage) {
			console.log("LIMIT", limitMessage)
		})

	},

	checkRateLimit: async () => {
		return new Promise((resolve, reject) => {
			module.exports.getRateLimit()
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
	},

	getRateLimit: async () => {
		return new Promise((resolve, reject) => {
			twitter.get('application/rate_limit_status', function(err, data, res) {
				if (err) { reject(err) }
				resolve(data)
			})
		})
	}
}
