'use strict';

const chalk = require('chalk')

const queue = require('./core/kue')

console.log(chalk.hex('#009688')(' [*] Worker connected.'))

queue.process('toto', function(job, done){
	toto(job.data, done);
});

function toto(data, done) {
	console.log("executing job" + data)
}