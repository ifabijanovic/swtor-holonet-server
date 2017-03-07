const Rx = require('rxjs/Rx');
const RxRequest = require('./Rx/Request.js');
const RxFeedParser = require('./Rx/FeedParser.js');
const admin = require('firebase-admin');
const RxFirebase = require('./Rx/Firebase.js');
const url = require('url');

const firebasePath = 'v0/dulfy/rss';
const notificationTopic = '/topics/dulfy';

var DulfyRss = function () {};

DulfyRss.prototype.run = (done) => {
  var dulfyFeedUrl = process.env.dulfy_feed_url;
  if (!dulfyFeedUrl) {
    console.log('dulfyFeedUrl not configured.');
    return 500;
  }

  // 1. Fetch Dulfy RSS feed
  // 2. Take the first parsed item
  // 3. Convert it into a simpler model
  // 4. Check if that item already exists in Firebase database
  // 5. If it doesn't exist save it and send out a notification
  RxRequest(dulfyFeedUrl)
    .switchMap(RxFeedParser.first)
    .map((item) => {
      if (!item.guid) { return null; }
      var parsedUrl = url.parse(item.guid, true);
      if (!parsedUrl || !parsedUrl.query || !parsedUrl.query.p) { 
        console.log('Failed to parse feed item id', item.guid);
        return null;
      }

      return {
        id: parsedUrl.query.p,
        title: item.title,
        time: new Date(item.date).getTime() / 1000,
        url: item.guid,
        author: item.author
      }
      
    }).switchMap((item) => {
      if (!item) { return Rx.Observable.empty(); }

      var query = admin.database().ref(firebasePath).child(item.id);
      return RxFirebase
        .database
        .once('value', query)
        .map((firItem) => {
          if (firItem.val()) { 
            console.log('Item already exists in Firebase database', item.id);
            return null;
          }
          return item;
        });

    }).switchMap((item) => {
      if (!item) { return Rx.Observable.empty(); }

      admin.database().ref(firebasePath).child(item.id).set({
        title: item.title,
        time: item.time,
        url: item.url,
        author: item.author
      });

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
      (error) => { 
        console.log(error);
        if (done) { done(); }
      },
      () => {
        console.log('DulfyRss.run completed');
        if (done) { done(); }
      }
    );

  return 200;
};

module.exports = new DulfyRss();
