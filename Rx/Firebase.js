const Rx = require('rxjs/Rx');
const admin = require('firebase-admin');

var RxFirebase = function () {};

RxFirebase.prototype.init = () => {
  admin.initializeApp({
    credential: admin.credential.cert({
      "project_id": process.env.firebase_project_id,
      "private_key": process.env.firebase_private_key.replace(/\\n/g, '\n'),
      "client_email": process.env.firebase_client_email,
    }),
    databaseURL: process.env.firebase_database_url,
    databaseAuthVariableOverride: {
      uid: process.env.firebase_uid
    }
  });
};

RxFirebase.prototype.database = {
  on: (eventType, ref) => {
    return Rx.Observable.create((observer) => {
      ref.on(eventType, (snapshot) => {
        observer.next(snapshot);
      }, (error) => {
        observer.error(error);
      });
      return () => { ref.off(eventType); };
    });
  },
  once: (eventType, ref) => {
    return Rx.Observable.create((observer) => {
      ref.once(eventType, (snapshot) => {
        observer.next(snapshot);
        observer.complete();
      }, (error) => {
        observer.error(error);
      });
      return () => { ref.off(eventType); };
    });
  }
};

RxFirebase.prototype.notifications = {
  sendToTopic: (topic, payload) => {
    return Rx.Observable.create((observer) => {
      admin.messaging().sendToTopic(topic, payload)
        .then((response) => {
          observer.next(response);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }
};

module.exports = new RxFirebase();
