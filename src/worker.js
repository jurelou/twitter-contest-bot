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
	} else if (data.title == 'retweet') {
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
		kue.job.failed().error("Nothing to do here")
		done()

	}
}
