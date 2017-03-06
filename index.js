const express = require('express');
const RxFirebase = require('./Rx/Firebase.js');
const dulfyRss = require('./dulfyRss.js');

var app = express();
app.set('port', (process.env.PORT || 5000));

RxFirebase.init();

app.get('/', (request, response) => {
	response.send('Hi!');
});
app.get('/run/dulfyRss', (request, response) => {
	response.sendStatus(dulfyRss.run());
});

app.listen(app.get('port'), () => {
	console.log('HoloNet server started on port', app.get('port'));
});
