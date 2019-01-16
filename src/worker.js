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

function exec(data, done) {
			//onsole.log(mask & this.retweet, mask & this.follow, mask & this.tag)
			/*
			if ( mask & this.FLAG_B) {
				console.log("ok")
			}
			*/
	console.log("finished job" + data)
	done()
}