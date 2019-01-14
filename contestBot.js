'use strict';
const api = require('./contestBotApi')

module.exports = class ContestBot {
	constructor() {
		//this.twitter = new Twit({})
	}

	start() {
		api.search()
	}
}