exports.init = (admin) => {
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

exports.extend = (admin, observable) => {
  admin.database.Reference.prototype.rx = function() {
    var ref = this;
    return {
      on: function(eventType) {
        return observable.create((observer) => {
          ref.on(eventType, (snapshot) => {
            observer.next(snapshot);
          }, (error) => {
            observer.error(error);
          });
          return () => { ref.off(eventType); };
        });
      },
      once: function(eventType) {
        return observable.create((observer) => {
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
  };

  admin.messaging.Messaging.prototype.rx = function() {
    var messaging = this;

    return {
      sendToTopic: function(topic, payload) {
        return observable.create((observer) => {
          messaging.sendToTopic(topic, payload)
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
  };
};
