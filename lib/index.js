'use strict';

const verbose = +process.env.VERBOSE_Q_REPEAT;

function applyMethods(q) {
  q.forever = function (body) {
    return q.while(() => {
      return true;
    }, body);
  };

  q.while = function (condition, body) {
    const done = q.defer();

    function delay(p) {
      return p.then((value) => {
        const deferred = q.defer();
        setImmediate(() => {
          deferred.resolve(value);
        });
        return deferred.promise;
      });
    }

    function loop(value) {
      if (!condition()) {
        return done.resolve(value);
      }

      return delay(q.fcall(body)).then(loop, done.reject);
    }

    q.nextTick(loop);

    return done.promise;
  };

  q.map = function (arr, body) {
    if (Array.isArray(arr)) {
      return q.all(arr.map(body));
    }

    return q.all(Object.keys(arr).reduce((prev, curr) => {
      prev.push(body(arr[curr], curr));
      return prev;
    }, []));
  };

  q.mapSeries = function (arr, body) {
    const accum = [];
    return arr.reduce((promise, item) => {
      return promise.then(() => {
        return q(body(item)).then((result) => {
          accum.push(result);
        });
      });
    }, q()).then(() => {
      return accum;
    });
  };

  q.series = function (arr, body) {
    body = body || (promise => promise);
    return arr.reduce((promise, item) => {
      return promise.then((result) => {
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
   * @param {number} options.linearBackoff - Number of seconds to add to timeout on each failure.
   * @param {number} options.expBackoff - Amount to multiply timeout on each failure.
   * @param {Object} options.cancel - An object which will have a cancel method created on,
   * allowing the retry loop to be canceled early.
   */
  q.timeoutRetry = function (timeout, body, options) {
    options = options || {};

    const timeoutIdentifier = 'timeout-dc1836808a';
    const maxRetries = options.maxRetries || 5;
    const linearBackoff = options.linearBackoff || 0;
    const expBackoff = options.expBackoff || 1;

    let attempts = 0;
    let success = false;
    let canceled = false;
    let currentTimeout = timeout;

    if (options.cancel) {
      options.cancel.cancel = function () {
        canceled = true;
      };
    }

    return q.while(() => {
      return !success;
    }, () => {
      attempts += 1;
      currentTimeout = (currentTimeout * expBackoff) + linearBackoff;

      return q.fcall(body).timeout(currentTimeout, timeoutIdentifier).tap(() => {
        success = true;
      }).catch((err) => {
        if (canceled) {
          throw new Error('Canceled');
        }
        if (err.message === timeoutIdentifier && attempts >= maxRetries) {
          throw new Error(`Timed out after ${attempts} attempts`);
        }
        if (err.message !== timeoutIdentifier) {
          throw err;
        }
        console.error(`Error: q-repeat retrying after timeout: currentTimeout=${currentTimeout}; attempts=${attempts}`);
      });
    });
  };
}

applyMethods(require('q'));

module.exports = applyMethods;
