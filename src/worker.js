'use strict';

const chalk = require('chalk')
var kue = require('kue');

const queue = require('core/kue')

console.log(chalk.hex('#009688')(' [*] Worker connected.'))
queue.on( 'error', function( err ) {
  console.log( 'Oops... ', err );
});

queue.process('tweete', function(job, done) {
	let delay = Math.floor(Math.random() * 960000) + 600000
	setTimeout(exec, delay, job.data, done);
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
	console.log("finished job" + data)
	done()
}