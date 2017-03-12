const Rx = require('rxjs/Rx');
const request = require('request');

module.exports = function(url) {
  return Rx.Observable.create((observer) => {
    var req = request(url);

    req.on('error', (error) => { observer.error(error); });
    req.on('response', (response) => {
      if (response.statusCode !== 200) {
        return observer.error(new Error(`statusCode=${response.statusCode}`));
      }
      observer.next(response);
      observer.complete();
    });
  });
};
