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

  q.series = function (arr, body) {
    return arr.reduce(function(promise, item) {
      return promise.then(function(result) {
        return body(item, result);
      });
    }, q());
  };

  /**
   * Allows body up to timeout ms to complete, and retries it if exceeds that time.
   * Body will not be retried if it fails for any other reason (e.g. exception or rejection).
   */
  q.timeoutRetry = function (timeout, body, options) {
    options = options || {};

    var timeoutIdentifier = 'timeout-dc1836808a';
    var maxAttempts = options.maxAttempts || 5;
    var attempts = 0;
    var success = false;

    return q.while(function () {
      return !success && attempts < maxAttempts;
    }, function () {
      attempts += 1;
      return q.fcall(body).timeout(timeout, timeoutIdentifier).tap(function () {
        success = true;
      }).catch(function (err) {
        if (err.message == timeoutIdentifier && attempts == maxAttempts)
          throw new Error('Timed out after ' + attempts + ' attempts');
        if (err.message != timeoutIdentifier)
          throw err;
      });
    });
  };
}

applyMethods(require('q'));

module.exports = applyMethods;
