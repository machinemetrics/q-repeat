var Q = require('q');

Q.forever = function(body) {
  return Q.while(function() {
    return true;
  }, body);
};

Q.while = function (condition, body) {
  var done = Q.defer();

  function delay (p) {
    return p.then(function (value) {
      var deferred = Q.defer();
      setImmediate(function () {
        deferred.resolve(value);
      });
      return deferred.promise;
    });
  }

  function loop () {
    if (!condition())
      return done.resolve();

    delay(Q.fcall(body)).then(loop, done.reject);
  }

  Q.nextTick(loop);

  return done.promise;
};