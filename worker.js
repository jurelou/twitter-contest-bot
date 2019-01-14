'use strict';

const queue = require('./core/kue')

console.log('WORKER CONNECTED');

queue.process('mytype', (job, done) => {
  sleep(5);
  console.log('WORKER JOB COMPLETE');
  switch (job.data.letter) {
    case 'a':
      done(null, 'apple');
      break;
    default:
      done(null, 'unknown');
  }
});