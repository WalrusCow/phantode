/*
 * Control the set of pages for a given process
 */

var _ = require('underscore');
var Page = require('./page');
var codify = require('../codify');

function PageList(bridge) {
  // Object of all pages that we drive
  this.bridge = bridge;

  this.pages = {};
  this.nextID = 0;
}

PageList.prototype.create = function() {
  /* Create a new page. */
  this.nextID += 1;
  var page = new Page(this.nextID, this.bridge);
  this.pages[nextID] = page;
  return page;
};

PageList.prototype.route = function(data) {
  /* Route cb to correct page. */

  var page = this.pages[data.pageID];
  if (!page) {
    // Page doesn't exist
    console.error('Invalid page ID: %s', data.pageID);
    return;
  }

  // TODO: Array of page callbacks?
  var method = page[data.callback];
  if (!method) {
    // Callback wasn't set, so nothing to do
    return;
  }

  // Convert arguments appropriately
  var args = _.map(data.args, codify.decodeArg);

  // Call the actual method
  method.apply(page, args);
};
