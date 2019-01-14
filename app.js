'use strict';

const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const cors = require('cors')
const session = require('express-session')
const connectRedis = require('connect-redis')
const helmet = require('helmet')

const contestBot = require('./contestBot.js')
const routes = require('./routes/index')
//const client = require('./core/redis')

const app = express();
require('dotenv').load();

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



app.listen(process.env.PORT || 1337, () => console.log('webhook is listening on port ', process.env.PORT || 1337));

app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});
