'use strict';

const chalk = require('chalk')
const fs = require('fs');
const Twit = require('twit')

const bot = require('src/worker')
const queue = require('core/kue')
const words = require('src/words')
const fifo = require('core/fifo')()
const Job = require('models/job')
const Tweet = require('models/tweet')
const twitterAPI = require('src/twitterAPI')
const constants = require('src/constants')

class ContestBot {

	constructor() {
		global.twitter = new Twit({
		  consumer_key:         process.env.TWITTER_API_KEY,
		  consumer_secret:      process.env.TWITTER_API_KEY_SECRET,
		  access_token:         process.env.TWITTER_ACCESS_TOKEN,
		  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
		  timeout_ms:           60*1000
		  //strictSSL:            true,     // optional - requires SSL certificates to be valid.
		})
		console.log(chalk.hex('#009688')(' [*] Twitter: Connected.'))

	}

	sleep(milliseconds) {
	  return new Promise(resolve => setTimeout(resolve, milliseconds))
	}

	async start() {
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
		
		var promise = Promise.resolve();			
		for (let cpt = 0; cpt  < 10000; cpt++) {
			for (let i = 0; i < words.contests.length; i ++) {
				let type = ""
				if (cpt % 2 == 0) {
					type = "mixed"
				} else {
					type = "popular"
				}
				await this.searchTweets(words.contests[i], type)
				console.log("--SEARCHED---", words.contests[i], "--type: ", type)
				await this.sleep(constants.searchDelay)
			}
			console.log("-------FINISHED LOOP ------ ", cpt)
			await this.sleep(2000000)
		}
		
	}


	updateJob(job) {
		return new Promise((resolve, reject) => {


			Job.findOne({tweet_id: job.tweet_id}, (err, doc) => {
			    if(err){ reject(err) }
			    doc.set({type: doc.type | job.type})
				doc.save((err, updateDoc) => {
					if (err) { reject(err) }
					resolve(err)
				})
			});
		})
	}

	searchTweets(query, type) {
		return new Promise((resolve, reject) => {
			twitterAPI.search(query, type)
			.then(async res => {
				let tweet = res.statuses
				console.log("(((((  GOT TWEET LIST  )))))", tweet.length)
				for (let i = 0; i < tweet.length; i++) {
					try {
						let selectedTweet = await this.checkTweet(tweet[i], query)
						if (selectedTweet) {
							let stat = await this.addStat(tweet[i], query)
							await this.addJobs(stat)
							console.log("JOB: ", tweet[i].id_str, " SELECTED")
						} else { console.log("JOB: ", tweet[i].id_str, " .....") }
					} catch (err) { reject(err) }
				}
				resolve()
			})
			.catch(err => { reject(err) })
		})
	}

	checkTweet(tweet, query) {
		return new Promise((resolve, reject) => {
			if (tweet.is_quote_status ||
				tweet.retweeted_status != undefined ||
				tweet.in_reply_to_status_id){
				return resolve(false)
			}
			
			if (this.wordIsPresent(words.banned_accounts, tweet.user.screen_name) ||
				this.wordIsPresent(words.banned_words, tweet.full_text)) {
				return resolve(false);
			}

			this.alreadyExists(tweet.id_str)
			.then(res => {
				if (res) { resolve(false) }
				return resolve(true)
			})
			.catch(err => { return reject(err) })
		})
	}

	async addJob(data) {
		return new Promise((resolve, reject) => {
			queue.create('tweet', data)
			.ttl(500000)
			.save((err) => {
				if (err) reject(err)
				resolve()
			})
			
		})
	}

	async addJobs(data) {		
		return new Promise((resolve, reject) => {
			if (this.wordIsPresent(words.retweet, data.tweet.text)) {
				this.addJob({
					title: 'retweet',
					type: constants.retweet,
					tweet_id: data.tweet_id
				}).catch(err => { reject(err) })
			}
			if (this.wordIsPresent(words.follow, data.tweet.text)) {
				data.tweet.mentions.forEach((user) => {
					this.addJob({
						title: 'follow',
						type: constants.follow,
						tweet_id: data.tweet_id,
						mention: user
					}).catch(err => { reject(err) })
				})				
			}
			if (this.wordIsPresent(words.favorite, data.tweet.text)) {
				this.addJob({
					title: 'fav',	
					type: constants.favorite,
					tweet_id: data.tweet_id
				}).catch(err => { reject(err) })
			}			
			if (this.wordIsPresent(words.tag, data.tweet.text)) {
				this.addJob({
					title: 'tag',					
					type: constants.tag,
					tweet_id: data.tweet_id
				}).catch(err => { reject(err) })
			}
			resolve()
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
			this.getAllMentions(tweet.user.id_str, tweet.entities.user_mentions).then(user_mentions => {
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
					job.save(err => {
						if (err) { reject(err) }
						console.log("job saved in DB:", job._id)
						resolve(job)
					})
				})
			})
		})
	}

	wordIsPresent(words_array, string) {
		let ret = false
		let l_case = string.toLowerCase();
		words_array.forEach(word => {
			if (l_case.indexOf(word) !== -1) { ret = true }
		})
		return ret
	}

	async getAllMentions(user, mentions) {
		return new Promise((resolve, reject) => {
			let res = []
			let cpt = false
			if (mentions) {
				for (let i = 0; i < mentions.length; i++) {
					if (mentions[i].id_str == user) { cpt = true }
					res.push(mentions[i].id_str)
				}
				if (!cpt) { res.push(user) }
			}
			resolve(res)
		})
	}
}

module.exports = ContestBot;
