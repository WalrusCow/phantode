/*
 * Proxy class
 */

var commonUtil = require('../util');

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

function Proxy(queue, phantom, pollFunc) {
  this.queue = queue;
  this.phantom = phantom;
  this.pollFunc = pollFunc;
}

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
for (key in methods) {
  Proxy.prototype[key] = makeMethod(methods[key]);
}

Proxy.prototype.exit = function(cb) {
  /* Kill the phantom process. */
  this.phantom.kill('SIGTERM');
  commonUtil.safeCallback(cb)();
};

Proxy.prototype.on = function() {
  /* Pass down to phantom process. */
  this.phantom.on.apply(this.phantom, arguments);
};

module.exports = Proxy;
