/*
 * Class to control a single phantom process.
 */

var commonUtil = require('../util');
var Worker = require('./worker');
var Queue = require('./queue');
var LongPoll = require('./longPoll');
var Page = require('./page');

// Methods to build into the prototype
// They map our method names to the remote method names
var methods = {
  'injectJs' : 'injectJs',
  'createPage': 'createPage',
  'addCookie': 'addCookie',
  'clearCookies': 'clearCookies',
  'deleteCookie': 'deleteCookie',
  'set': 'setProperty',
  'get': 'getProperty'
};

function Phantom(process) {
  /* A wrapper object around the phantom process. */
  // Pages for this process
  this.pages = {};

  // TODO: How to extract pages and shit from longpoll?
  // maybe pass this?
  this.poller = new LongPoll(process, this);

  // Stop polling once process has died
  process.once('exit', this.poller.close);

  var queueWorker = new Worker(this);
  // A queue to use for processing requests
  this.requestQueue = new Queue(queueWorker);
}

Phantom.prototype._makeNewPage = function(id) {
  var newPage = new Page(id, this.requestQueue, this.poller);
  this.pages[id] = newPage;
  return newPage;
};

function makeMethod(name) {
  return function() {
    var args = Array.prototype.slice.call(arguments);

    // Arguments to pass into the queue
    var qArgs = [0, name];

    // Append everything but the last argument (which is the callback)
    qArgs = qArgs.concat(args.slice(0, -1));

    // The callback is the last argument
    var cb = args.slice(-1)[0];

    // Push call into the queue
    this.requestQueue.push([qArgs, commonUtil.safeCallback(cb, this.pollFunc)]);
  };
}

// Build prototype methods
for (var key in methods) {
  Phantom.prototype[key] = makeMethod(methods[key]);
}

Phantom.prototype.exit = function(cb) {
  /* Kill the phantom process. */
  this.phantom.kill('SIGTERM');
  commonUtil.safeCallback(cb)();
};

Phantom.prototype.on = function() {
  /* Pass down to phantom process. */
  this.phantom.on.apply(this.phantom, arguments);
};

module.exports = Phantom;
