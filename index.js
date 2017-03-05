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

RxRequest('http://www.dulfy.net/category/swtor/feed')
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