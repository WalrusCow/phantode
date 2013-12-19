/*
 * Emulate the PhantomJS `webpage` module.
 */
// Object to take care of page organization
var _ = require('underscore');
var Page = require('./page');
var codify = require('../codify');

function WebPage(bridge) {
  /* Module object. */
  this._bridge = bridge;
  this._pages = {};
  this._nextId = 0;
};

WebPage.prototype.create = function(callback) {
  /* Create a new page. */
  this._nextId += 1;

  // Also notify the bridge that we have created a new page
  var func = codify.encodeFunc('webpage', 'create');
  var self = this;
  this._bridge.useFunc(func, function(err) {
    if (err) return callback(err);

    var page = new Page(self._nextId, self._bridge);
    self._pages[self._nextId] = page;
    callback(null, page);
  });
};

WebPage.prototype._route = function(cbData) {
  /* Route callback to correct page. */

  var page = this._pages[cbData.pageID];
  if (!page) {
    // Page doesn't exist
    console.error('Invalid page ID: %s', cbData.pageID);
    return;
  }

  // TODO: Array of page callbacks?
  // Or even better... use `events` module and inherit from that?
  // ... but how can I separate PhantomJS-side callbacks from node-side cbs?
  var method = page[cbData.callback];
  if (!method) {
    // Callback wasn't set, so nothing to do
    return;
  }

  // Convert arguments appropriately
  var args = _.map(cbData.args, codify.decodeArg);

  // Call the actual method
  method.apply(page, args);
};

module.exports = WebPage;
