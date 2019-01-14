const redis = require('redis')
const chalk = require('chalk')

let client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

client.on('connect', () => console.log(chalk.hex('#009688')(' [*] Redis: Connection Succeeded.')));
client.on('error', err => console.error(err));

module.exports = client;