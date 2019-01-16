const mongoose = require('mongoose')
const chalk = require('chalk')

mongoose.Promise = global.Promise;


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, (err) => {
	if (err) { throw err }
	console.log(chalk.hex('#009688')(' [*] MongoDB: Connection Succeeded.'))
});

mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
    process.exit(-1);
});