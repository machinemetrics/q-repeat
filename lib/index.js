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

    function loop (value) {
      if (!condition())
        return done.resolve(value);

      delay(q.fcall(body)).then(loop, done.reject);
    }

    q.nextTick(loop);

    return done.promise;
  };

  q.map = function (arr, body) {
    if (Array.isArray(arr))
      return q.all(arr.map(body));

    return q.all(Object.keys(arr).reduce(function (prev, curr) {
      prev.push(body(arr[curr], curr));
      return prev;
    }, []));
  };

  q.mapSeries = function (arr, body) {
    var accum = [];
    return arr.reduce(function (promise, item) {
      return promise.then(function () {
        return q(body(item)).then(function (result) {
          accum.push(result);
        });
      });
    }, q()).then(function () {
      return accum;
    });
  };

  q.series = function(arr, body) {
    return arr.reduce(function(promise, item) {
      return promise.then(function(result) {
        return body(item, result);
      });
    }, q());
  };
  
  q.timeoutRepeat = function (timeout, body) {
    var success = false;
    return q.while(function () {
      return !success;
    }, function () {
      return body().timeout(timeout, 'timeout-dc1836808a').tap(function () {
        success = true;
      }).catch(function (err) {
        if (err.message != 'timeout-dc1836808a')
          throw err;
      });
    });
  };
}

applyMethods(require('q'));

module.exports = applyMethods;
