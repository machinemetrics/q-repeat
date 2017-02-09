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
   *
   * @param {Object} options
   * @param {number} options.maxRetries - Max number of times to retry body.
   * @param {Object} options.cancel - An object which will have a cancel method created on, allowing the retry loop to be canceled early.
   */
  q.timeoutRetry = function (timeout, body, options) {
    options = options || {};

    var timeoutIdentifier = 'timeout-dc1836808a';
    var maxRetries = options.maxRetries || 5;
    var attempts = 0;
    var success = false;
    var canceled = false;

    if (options.cancel) {
      options.cancel.cancel = function () {
        canceled = true;
      };
    }

    return q.while(function () {
      return !success;
    }, function () {
      attempts += 1;
      return q.fcall(body).timeout(timeout, timeoutIdentifier).tap(function () {
        success = true;
      }).catch(function (err) {
        if (canceled)
          throw new Error('Canceled');
        if (err.message === timeoutIdentifier && attempts >= maxRetries)
          throw new Error('Timed out after ' + attempts + ' attempts');
        if (err.message !== timeoutIdentifier)
          throw err;
      });
    });
  };
}

applyMethods(require('q'));

module.exports = applyMethods;
