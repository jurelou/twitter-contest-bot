'use strict';
const Twit = require('twit')
const bot = require('./worker.js')
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
		this.stream = this.twitter.stream('statuses/filter', { track: ['concours'] })
	}

	start() {
		this.checkRateLimit()
		.then(data => {
			this.stream.on('tweet', function (tweet) {
	  		//console.log(tweet)
			})
		})
		.catch(err => {
			console.log(err)
		})
	
	}
	
	async checkRateLimit() {
		return new Promise((resolve, reject) => {
			this.getRateLimit().then(items => {
				Object.entries(items.resources).forEach(item => {
					item.forEach(elem => {
						Object.entries(elem).forEach(check => {
							if (check[1].remaining){
								if (check[1].limit == check[1].remaining + 5) {
									reject(check)
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