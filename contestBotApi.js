'use strict';
const Twit = require('twit')

const API = {
	search: () => {
		return new Promise((resolve, reject) => {
			console.log("searchingapi")
			resolve()
		})
	}
}

module.exports = API;
