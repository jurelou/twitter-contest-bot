'use strict';

const chalk = require('chalk')
var kue = require('kue');

const queue = require('core/kue')
const constants = require('src/constants')
const twitterAPI = require('src/twitterAPI')

console.log(chalk.hex('#009688')(' [*] Worker connected.'))
queue.on( 'error', function( err ) {
  console.log( 'Oops... ', err );
});

queue.process('tweet', function(job, done) {
	setTimeout(exec, 61637, job.data, done);
});

/*
					job.type = this.wordIsPresent(words.retweet, text) ? job.type | this.retweet : job.type
					job.type = this.wordIsPresent(words.follow, text) ? job.type | this.follow : job.type
					job.type = this.wordIsPresent(words.tag, text) ? job.type | this.tag : job.type
*/
			//onsole.log(mask & this.retweet, mask & this.follow, mask & this.tag)

			/*
			if ( mask & this.FLAG_B) {
				console.log("ok")
			}
			*/

function exec(data, done) {
	if (data.type & constants.follow) {
		twitterAPI.follow(data.mention)
		.then(res => {
			done()
		})
		.catch(err => {
			console.log("Worker error:", err)
			kue.job.failed().error(err)
			done(err)
		})
	} else if (data.type & constants.retweet) {
		twitterAPI.retweet(data.tweet_id)
		.then(res => {
			done()
		})
		.catch(err => {
			console.log("Worker error:", err)
			kue.job.failed().error(err)
			done(err)
		})
	} else if (data.type & constants.favorite) {
		twitterAPI.favorite(data.tweet_id)
		.then(res => {
			done()
		})
		.catch(err => {
			console.log("Worker error:", err)
			kue.job.failed().error(err)
			done(err)
		})
	} else if (data.type & constants.tag) {
		twitterAPI.comment(data.tweet_id)
		.then(res => {
			done()
		})
		.catch(err => {
			console.log("Worker error:", err)
			kue.job.failed().error(err)
			done(err)
		})		
	} else {
		done()
	}
}
