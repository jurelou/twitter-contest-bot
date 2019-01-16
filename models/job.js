var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var job = new Schema({
	type: {type: Number, default: 0},
	tweet: { type: Schema.Types.ObjectId, ref: 'tweet' },
	date: { type: Date, default: Date.now },
	query: String

});

module.exports = mongoose.model('job', job)