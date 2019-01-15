'use strict';

const chalk = require('chalk')
const queue = require('core/kue')
var kue = require('kue');

console.log(chalk.hex('#009688')(' [*] Worker connected.'))

kue.Job.rangeByType( 'toto', 'inactive', 0, 200, 'asc', function( err, jobs ) {
	jobs.forEach(job => {
		job.remove()
	})
});


queue.process('tweet', function(job, done){
	setTimeout(toto, 6000, job.data, done);
});

queue.on( 'error', function( err ) {
  console.log( 'Oops... ', err );
});
function toto(data, done) {
	console.log("finished job" + data)
	done()
}