'use strict';

const kue = require('kue');
const chalk = require('chalk')

const queue = kue.createQueue({
  prefix: 'q',
  redis: {
    port: process.env.REDIS_PORT,
   	host: process.env.REDIS_HOST
  }
});

queue.on('error', (err) => {
  console.log('There was an error in the main queue!');
  console.log(err);
  console.log(err.stack);
});

kue.app.listen(process.env.KUE_UI_PORT);
console.log(chalk.hex('#009688')(' [*] Redis: Connection Succeeded.'))

process.once( 'SIGTERM', function ( sig ) {
  queue.shutdown( 5000, function(err) {
    console.log( 'Kue shutdown: ', err||'' );
    process.exit( 0 );
  });
});

module.exports = queue