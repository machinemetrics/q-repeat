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
