/*
 * Class to control a single phantom process.
 */

var commonUtil = require('../util');
var queueWorker = require('../worker');
var Queue = require('./queue');

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

function Phantom(phantom, pollFunc) {
  /* Class for a phantom process. */
  this.queue = new Queue(queueWorker);
  this.phantom = phantom;
  this.pollFunc = pollFunc;

  this.pages = {};
}

Phantom.prototype._makeNewPage = function(id) {
  var newPage = new Page(id, this.queue, this.pollFunc);
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
    var cb = args.slice(-1);

    // Push call into the queue
    this.queue.push([qArgs, commonUtil.safeCallback(cb, this.pollFunc)]);
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
