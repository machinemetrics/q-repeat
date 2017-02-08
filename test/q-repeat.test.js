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

describe('timeoutRepeat', () => {
  it('repeats until success', () => {
    let delay = 500;
    let invocations = 0;

    return Q.timeoutRepeat(150, () => {
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
    return Q.timeoutRepeat(500, () => {
      throw new Error('omg');
    }).catch((err) => {
      expect(err.message).to.eq('omg');
    });
  });
});
