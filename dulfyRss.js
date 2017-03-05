const Rx = require('rxjs/Rx');
const RxRequest = require('./Rx/Request.js');
const RxFeedParser = require('./Rx/FeedParser.js');

var DulfyRss = function () {};

DulfyRss.prototype.run = () => {
	var dulfyFeedUrl = process.env.dulfyFeedUrl;
	if (!dulfyFeedUrl) {
		console.log('dulfyFeedUrl not configured.');
		return 500;
	}

	RxRequest(dulfyFeedUrl)
		.switchMap(RxFeedParser)
		.subscribe((parser) => {
			var post = parser.read();
			if (post) {
				console.log(post);
			}
		}, (error) => {
			console.log(error);
		}, () => {
			console.log('complete');
		});

	return 200;
};

module.exports = new DulfyRss();
