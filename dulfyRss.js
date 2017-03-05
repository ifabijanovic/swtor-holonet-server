const Rx = require('rxjs/Rx');
const FeedParser = require('feedparser');
const request = require('request');

const RxRequest = (url) => {
	return Rx.Observable.create((observer) => {
		var req = request(url);
		req.on('error', (error) => {
			observer.error(error);
		});
		req.on('response', (response) => {
			if (response.statusCode !== 200) {
				return observer.error(new Error(`statusCode=${response.statusCode}`));
			}
			observer.next(response);
			observer.complete();
		});
	});
};

const RxFeedParser = (response) => {
	return Rx.Observable.create( (observer) => {
		var parser = new FeedParser();
		parser.on('error', (error) => {
			observer.error(error);
		});
		parser.on('readable', () => {
			observer.next(parser);
		});
		parser.on('end', () => {
			observer.complete();
		});
		response.pipe(parser);
	});
};

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
