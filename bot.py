#!/usr/bin/env python3
import os
import sys
import signal
import time
import json
import pickle
import requests
from config import *
from requests_oauthlib import OAuth1
from urllib.parse import urlparse, urlunparse, urlencode, quote_plus

class twitterError(Exception):
	@property
	def message(self):
		return self.args[0]

keywords = {
	'rt' : {
		'flag': 1 << 0,
		'words': [' rt ', ' retw', ' partage']
	},
	'fav' : {
		'flag': 1 << 1,
		'words': [' fav', ' aime', ' like']
	},
	'follow' : {
		'flag': 1 << 2,
		'words': [' follow', ' flw', ' suivez', ' suivre']
	},
	'comment' : {
		'flag': 1 << 3,
		'words': [' comment', ' tag', ' mention', ' identifie']
	},
}

class twitterAPI(object):
	def __init__(self, apiKey, apiSecret, token, tokenSecret):
		self._auth = OAuth1(apiKey, apiSecret, token, tokenSecret)
		self._session = requests.Session()
		self._timeout = None
		self._tweet_mode = 'extended'
		self._baseUrl = 'https://api.twitter.com/1.1/'
		self._usersBlacklist = ['bot spotting', 'botspotter', 'b0tspotter', 'botsp0tter', 'aek_bot']

	def customSearch(self, query, result_type='mixed', count=30):
		tweets = [t['retweeted_status'] if 'retweeted_status' in t else t for t in json.loads(self.search(query, result_type, count).text)['statuses'] if not (t['in_reply_to_status_id'] or t['in_reply_to_user_id'] or t['in_reply_to_screen_name'])]
		return [tweet for tweet in tweets if not(any(tweet['user']['name'].lower() in name for name in self._usersBlacklist) and any(tweet['user']['name'].lower() in name for name in self._usersBlacklist))]

	def search(self, query, result_type, count):
		data = { 'q': query,
 		'result_type': result_type, # mixed/recent/popular
		'count': count
		}
		return self._request(self._baseUrl + 'search/tweets.json', 'GET', data)

	def follow(self, tweet):
		u_list = [user['id_str'] for user in tweet['entities']['user_mentions']]
		u_list.append(tweet['user']['id_str'])
		with open('followers.txt', 'r+') as followers_archive:
			for user in u_list:
				if not any(user in line for line in followers_archive):
					self._request(self._baseUrl + 'friendships/create.json', 'POST', {'user_id': user})
					print("FOLLOWING NEW: ", user)
					followers_archive.seek(0,2)
					followers_archive.write(user + '\n')
				else:
					print("ALREADY:", user)

	def retweet(self, tweet):
		return self._request(self._baseUrl + 'statuses/retweet/' + tweet['id_str'] + '.json', 'POST')

	def like(self, tweet):
		return self._request(self._baseUrl + 'favorites/create.json', 'POST', {'id': tweet['id_str']})

	def comment(self, tweet):
		return self._request(self._baseUrl + 'statuses/update.json', 'POST', {'in_reply_to_status_id': tweet['id_str'], 'status': '@David68106367 I hope to win this !!', 'auto_populate_reply_metadata': 'true'})

	def getFriends(self, id):
		return self._request(self._baseUrl + 'friends/ids.json', 'GET', {'user_id': id, 'stringify_ids': 'true'})

	def _request(self, url, verb, data=None, json=None):
		if not self._auth:
			raise twitterError("No valid authentication provided.")
		if not data: data = {}
		resp = None
		if verb == 'POST':
			resp = self._post(url, data, json)
		elif verb == 'GET':
			resp = self._get(url, data)
		if url and resp:
			limit = resp.headers.get('x-rate-limit-limit', 0)
			remaining = resp.headers.get('x-rate-limit-remaining', 0)
			reset = resp.headers.get('x-rate-limit-reset', 0)
			print("RATE limit", limit, remaining, reset)
			return resp

	def _post(self, url, data=None, json=None):
		if data:
			resp = self._session.post(url, data=data, auth=self._auth, timeout=self._timeout)
		elif json:
			resp = self._session.post(url, json=json, auth=self._auth, timeout=self._timeout)
		else:
			resp = self._session.post(url,auth=self._auth, timeout=self._timeout)
		return resp

	def _get(self, url, data):
		data['tweet_mode'] = self._tweet_mode
		url = self._BuildUrl(url, extra_params=data)
		return self._session.get(url, auth=self._auth, timeout=self._timeout)

	def _BuildUrl(self, url, path_elements=None, extra_params=None):
		(scheme, netloc, path, params, query, fragment) = urlparse(url)
		if path_elements:
			filtered_elements = [i for i in path_elements if i]
			if not path.endswith('/'):
				path += '/'
			path += '/'.join(filtered_elements)
		if extra_params and len(extra_params) > 0:
			extra_query = self._EncodeParameters(extra_params)
			if query:
				query += '&' + extra_query
			else:
				query = extra_query
		return urlunparse((scheme, netloc, path, params, query, fragment))

	@staticmethod
	def _EncodeParameters(parameters):
		if parameters is None:
			return None
		if not isinstance(parameters, dict):
			raise twitterError("`parameters` must be a dict.")
		else:
			params = dict()
			for k, v in parameters.items():
				if v is not None:
					if getattr(v, 'encode', None):
						v = v.encode('utf8')
					params.update({k: v})
			return urlencode(params)

def calculateMask(tweet):
	mask = 0
	for _, kw in keywords.items():
		if any(word in tweet['full_text'].lower() for word in kw['words']):
			mask |= kw['flag']
	return mask

def exec(tweet, mask):
	functions = {'rt' : api.retweet,
				'fav': api.like,
				'follow': api.follow,
				'comment': api.comment}
	if any(mask & kw['flag'] for _, kw in keywords.items()):
		with open('tweets.txt', 'a') as file:
			file.write(tweet['id_str'] + '\n')
	for type, kw in keywords.items():
		if mask & kw['flag']:
			functions[type](tweet)
	time.sleep(2)

def loop():
	cpt = 0
	options = {0: 'mixed',
			1: 'recent',
			2: 'popular'}
	if not os.path.exists('tweets.txt'):
		with open('tweets.txt', 'w'): pass
	with open('tweets.txt', 'r') as tweets_archive:
		while True:
			cpt = (cpt + 1) % 3
			tweets = api.customSearch("rt 2 win", options[cpt])
			[exec(tweet, calculateMask(tweet)) for tweet in tweets if (not any(tweet['id_str'] in line for line in tweets_archive ))]
			time.sleep(60)

api = twitterAPI(api_key, api_key_secret, access_token, access_token_secret)

def signal_handler(signal, frame):
	print("\nprogram exiting gracefully")
	sys.exit(0)

if __name__ ==  '__main__':
	signal.signal(signal.SIGINT, signal_handler)
	loop()