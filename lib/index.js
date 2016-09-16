function applyMethods(q) {
  q.forever = function(body) {
    return q.while(function() {
      return true;
    }, body);
  };

  q.while = function (condition, body) {
    var done = q.defer();

    function delay (p) {
      return p.then(function (value) {
        var deferred = q.defer();
        setImmediate(function () {
          deferred.resolve(value);
        });
        return deferred.promise;
      });
    }

    function loop () {
      if (!condition())
        return done.resolve();

      delay(q.fcall(body)).then(loop, done.reject);
    }

    q.nextTick(loop);

    return done.promise;
  };

  q.map = function (arr, body) {
    if (Array.isArray(arr))
      return Q.all(arr.map(body));

    return Q.all(Object.keys(arr).reduce(function (prev, curr) {
      prev.push(body(arr[curr], curr));
      return prev;
    }, []));
  };

  q.series = function(arr, body) {
    return arr.reduce(function(promise, item) {
      return promise.then(function(result) {
        return body(item, result);
      });
    }, q());
  };
}

applyMethods(require('q'));

module.exports = applyMethods;