const Rx = require('rxjs/Rx');
const FeedParser = require('feedparser');

var RxFeedParser = function () {};

RxFeedParser.prototype.first = (response) => {
	return Rx.Observable.create((observer) => {
		response
			.pipe(new FeedParser())
			.on('error', (error) => { observer.error(error); })
			.on('readable', function() {
				observer.next(this.read());
				observer.complete();
			});
	});
};

module.exports = new RxFeedParser();
