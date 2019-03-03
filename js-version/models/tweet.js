const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tweet = new Schema({
	user_id: String,
	user_name: String,
	user_location: String,
	text: String,
	mentions: [String],
	date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('tweet', tweet)