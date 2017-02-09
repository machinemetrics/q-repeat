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

describe('timeoutRetry', () => {
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
    return Q.timeoutRetry(150, () => {
      return Q().delay(200);
    }).timeout(500, 'outer').catch((err) => {
      expect(err.message).to.eq('outer');
    });
  });

  it('cancels further executions when requested', () => {
    let invocations = 0;
    const control = {};

    return Q.timeoutRetry(100, () => {
      invocations += 1;
      return Q().delay(200);
    }, { maxRetries: 100, cancel: control }).timeout(475).catch(() => {
      expect(invocations).to.eq(5);
      control.cancel();
      
      return Q().delay(500).then(() => {
        expect(invocations).to.eq(5);
      });
    });
  });

  it('does not exceed max attempts', () => {
    let invocations = 0;
    return Q.timeoutRetry(100, () => {
      invocations += 1;
      return Q().delay(200);
    }, { maxRetries: 3 }).catch(() => {
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
