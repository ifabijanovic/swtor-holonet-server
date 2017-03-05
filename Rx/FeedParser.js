const Rx = require('rxjs/Rx');
const FeedParser = require('feedparser');

module.exports = function(response) {
	return Rx.Observable.create( (observer) => {
		var parser = new FeedParser();

		parser.on('error', (error) => { observer.error(error); });
		parser.on('readable', () => { observer.next(parser); });
		parser.on('end', () => { observer.complete(); });

		response.pipe(parser);
	});
};
