'use strict';

module.exports = {
	banned_accounts : [
		'bot spotting',
		'alwayswinning',
		'anti bot',
		'fuckbot'
	],
	banned_words : [
		'follow this link',
		'click on the',
		'click to enter',
		
		'link instructions'
	],
	contests: [
		'retweet to win',
		'retweet 2 win',
		'rt to win',
		'rt 2 win',
		'giveaway',
		'retweet and win',
		'retweet and you could win', 
		'rt for your chance to win',
		'giveawayalert',
		'rttowin',
		'concours',
		'jeu concours',
		'tirage au sort',
		'rt+follow'
	],
	retweet: [
		' rt ',
		'partage',
		'retweet',
	],
	follow: [
		'follow',
		'flw',
		'fllw',
		'following',
		'follower',
		'suivre',
		'suivez'
	],
	favorite: [
		'fav',
		'favorite',
		'favourite',
		'aime',
		'like'
	],
	tag: [
		'tag',
		'your friend',
		'your friends',
		'identifie',
		'in the comments',
		'dans les commentaires'
	],	
	message: [
		process.env.FRIEND_ACCOUNT + ' Je participe !',
		process.env.FRIEND_ACCOUNT + ' On va croiser les doigts',
		process.env.FRIEND_ACCOUNT + ' Que la chance soit avec moi ..',
		process.env.FRIEND_ACCOUNT + ' I hope to win this :)',
		process.env.FRIEND_ACCOUNT + ' I\'m up all night to get lucky !',
		process.env.FRIEND_ACCOUNT + ' I want to enter this giveaway!'
	],
	message_tmp: {
		'fr' : [
			' Je participe !',
			' On va croiser les doigts',
			' Que la chance soit avec moi ..'
			],
		'en' : [
			' I hope to win this :)',
			' I\'m up all night to get lucky !',
			' I want to enter this giveaway!'
			]
	}
}
