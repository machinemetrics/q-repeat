'use strict';
/* eslint-env mocha */

const expect = require('chai').expect;
const Q = require('q');

require('../lib/index');

describe('map', () => {
  it('maps', () => {
    return Q().then(() => {
      return Q.map([1, 2, 3], x => x * x * x);
    }).then(results => {
      expect(results).to.eql([1, 8, 27]);
    });
  });
});

describe('retry', () => {
  it('repeats until success', () => {
    let delay = 500;
    let invocations = 0;

    return Q.timeoutRetry(150, () => {
      delay -= 100;
      invocations += 1;
      return Q(`answer ${invocations}`).delay(delay);
    }).then((result) => {
      expect(delay).to.eq(100);
      expect(invocations).to.eq(4);
      expect(result).to.eq('answer 4');
    });
  });

  it('fails fast if actual error occurs', () => {
    return Q.timeoutRetry(500, () => {
      throw new Error('omg');
    }).catch((err) => {
      expect(err.message).to.eq('omg');
    });
  });

  it('hits outer timeout', () => {
    return Q.timeoutRetry(100, () => {
      return Q().delay(200);
    }).timeout(500, 'outer').catch((err) => {
      expect(err.message).to.eq('outer');
    });
  });

  it('does not exceed max attempts', () => {
    let invocations = 0;
    return Q.timeoutRetry(100, () => {
      invocations += 1;
      return Q().delay(200);
    }, { maxAttempts: 3 }).catch(() => {
      expect(invocations).to.eq(3);
    });
  });

  it('does not exceed 5 (default) attempts', () => {
    let invocations = 0;
    return Q.timeoutRetry(100, () => {
      invocations += 1;
      return Q().delay(200);
    }).catch(() => {
      expect(invocations).to.eq(5);
    });
  });
});
