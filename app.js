'use strict';
require('dotenv').load();

const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const cors = require('cors')
const session = require('express-session')
const connectRedis = require('connect-redis')
const helmet = require('helmet')

const contestBot = require('src/contestBot.js')
const routes = require('routes/index')
//const client = require('./core/redis')
const kue = require('core/kue')
const app = express();

app.use(compression());
app.use(helmet());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/*app.use(session({
  store: new (connectRedis(session))({ client }),
  name: 'sid',
  resave: true,
  saveUninitialized: true,
  secret: process.env.SECRET,
}));*/
//app.use(passport.initialize());
//app.use(passport.session());

app.use('/__', routes);


new contestBot().start();

module.exports = app