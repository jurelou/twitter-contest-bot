'use strict';

const Twit = require('twit')
const chalk = require('chalk')
const fs = require('fs');

const kue = require('core/kue')
const fifo = require('core/fifo')
const search = require('src/search')
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
		console.log(search.contests)
		console.log(chalk.hex('#009688')(' [*] Twitter: Connected.'))

		//this.stream = this.twitter.stream('statuses/filter', { track: search.contests })
	}
	toto(){}

	start() {
		/*
		this.stream.on('tweet',(tweet) => {
			this.selectTweet(tweet)
		})
		this.stream.on('limit', function (limitMessage) {
			console.log("LIMIT", limitMessage)
		})
		*/

		this.twitter.get('search/tweets', { q: 'retweet and follow', count: 10 , result_type: 'popular', tweet_mode: 'extended'}, (err, data, response) => {
			data.statuses.forEach(tweet => {
				this.selectTweet(tweet)
			})
		})

		/*
		this.twitter.get('search/tweets', { q: 'concours', count: 100 , result_type: 'popular'}, function(err, data, response) {
			

			fs.writeFile("/tmp/tmp2.txt", JSON.stringify(data, null, 4), function(err) {
			    if(err) {
			        return console.log(err);
			    }
			    console.log("The file was saved!");
			}); 		  
		})
		*/


		/*this.checkRateLimit()
		.then(data => {
		})
		.catch(err => {
			console.log(err)
		})*/
	
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
			//if (count == 0) { return false }
			this.getAllMentions(text).then(data => {
							console.log("-->",text)
				console.log("metion---", data)

				console.log("rt-----", this.wordIsPresent(search.retweet, text))
				console.log("fw-----", this.wordIsPresent(search.follow, text))
				console.log("tag----", this.wordIsPresent(search.tag, text))


			})
			resolve(true)
		})
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

	wordIsPresent(words_array, string) {
		let ret = false
		words_array.forEach(word => {
			if (string.indexOf(word) !== -1) {
				ret = true
			}
		})
		return ret
	}

	createJob(tweet) {
		kue.create('toto', {  
		    title: 'Welcome to the site',
		    to: 'user@example.com',
		    template: 'welcome-email'
		}).save();
		console.log(tweet)
	}

	async checkRateLimit() {
		return new Promise((resolve, reject) => {
			this.getRateLimit().then(items => {
				Object.entries(items.resources).forEach(item => {
					item.forEach(elem => {
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