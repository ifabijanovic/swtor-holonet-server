const Rx = require('rxjs/Rx');
const RxRequest = require('./Rx/Request.js');
const RxFeedParser = require('./Rx/FeedParser.js');
const admin = require('firebase-admin');
const RxFirebase = require('./Rx/Firebase.js');
const url = require('url');

const firebasePath = 'v0/dulfy/rss';
const notificationTopic = '/topics/dulfy';

var DulfyRss = function () {};

DulfyRss.prototype.run = () => {
	var dulfyFeedUrl = process.env.dulfy_feed_url;
	if (!dulfyFeedUrl) {
		console.log('dulfyFeedUrl not configured.');
		return 500;
	}

	// Fetch newest item from Dulfy RSS feed
	var newestFeedItem = RxRequest(dulfyFeedUrl)
		.switchMap(RxFeedParser.first)
		.map((item) => {
			return {
				id: url.parse(item.guid, true).query.p,
				title: item.title,
				time: new Date(item.date).getTime() / 1000,
				url: item.guid,
				author: item.author
			}
		});

	// Fetch newest cached item from Firebase
	var firebaseQuery = admin
		.database()
		.ref(firebasePath)
		.orderByKey()
		.limitToLast(1);

	var newestFirebaseItem = RxFirebase
		.database
		.once('child_added', firebaseQuery)

	// Combine the two streams
	newestFeedItem
		.combineLatest(newestFirebaseItem, (feedItem, firebaseItem) => {
			// If id of two items differs, feed item is new - return it
			var firebaseValue = firebaseItem.val();
			if (feedItem && feedItem.id && feedItem.id !== firebaseValue.id) {
				return feedItem;
			}
			return null;
		}).switchMap((item) => {
			if (!item) {
				console.log('No new items in feed');
				return Rx.Observable.empty();
			}

			// Save item to Firebase
			RxFirebase
				.database
				.push(firebasePath, item);

			// Send notification
			var payload = {
				notification: {
					body: item.title,
					badge: '1',
					sound: 'default'
				},
				data: {
					type: 'dulfy',
					url: item.url
				}
			};
			
			return RxFirebase
				.notifications
				.sendToTopic(notificationTopic, payload);

		}).subscribe(
			() => { console.log('Successfully sent push'); }, 
			(error) => { console.log(error); }
		);

	return 200;
};

module.exports = new DulfyRss();
