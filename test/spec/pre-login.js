var path = require('path');
var expect = require('chai').expect;

var pre-login = require(path.join(__dirname, '..', './pre-login.js'));

describe('pre-login()', function () {
  'use strict';

  it('exists', function () {
    expect(pre-login).to.be.a('function');

  });

  it('does something', function () {
    expect(true).to.equal(false);
  });

  it('does something else', function () {
    expect(true).to.equal(false);
  });

  // Add more assertions here
});
