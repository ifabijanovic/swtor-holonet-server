const express = require('express');
const firebaseAdmin = require('firebase-admin');
const RxFirebase = require('./Rx/Firebase.js');
const DulfyRss = require('./dulfyRss.js');

var app = express();
app.set('port', (process.env.PORT || 5000));

RxFirebase.init(firebaseAdmin);

app.get('/', (request, response) => {
  response.send('Hi!');
});
app.get('/run/dulfyRss', (request, response) => {
  response.sendStatus(DulfyRss.run());
});

app.listen(app.get('port'), () => {
  console.log('HoloNet server started on port', app.get('port'));
});
