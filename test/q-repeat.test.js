'use strict';

/* eslint-env mocha */

const expect = require('chai').expect; // eslint-disable-line import/no-extraneous-dependencies
const Q = require('q');

require('../lib/index');

describe('map', () => {
  it('maps', () => {
    return Q().then(() => {
      return Q.map([1, 2, 3], x => x * x * x);
    }).then((results) => {
      expect(results).to.eql([1, 8, 27]);
    });
  });
});

describe('mapSeries', () => {
  it('maps in strict sequential order', () => {
    let accum = 0;
    return Q.mapSeries([1, 2, 3, 4, 5, 6, 7, 8, 9], (item) => {
      accum += item;
      expect(accum).to.eql((item * (item + 1)) / 2);

      return item * item;
    }).then((results) => {
      expect(results).to.eql([1, 4, 9, 16, 25, 36, 49, 64, 81]);
    });
  });

  it('maps empty array', () => {
    return Q.mapSeries([], item => item * item).then((results) => {
      expect(results).to.eql([]);
    });
  });

  it('catches throw in map body', () => {
    let fail = false;
    return Q.mapSeries([1, 2, 3, null], item => item.toString()).catch(() => {
      fail = true;
    }).finally(() => {
      expect(fail).to.eql(true);
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
