var http = require('http');
var util = require('util');
var child_process = require('child_process');

// It's fun to use our own stuff
var async = require('./async');

// How often to poll
var POLL_INTERVAL = 500;

function noop(){}

function Queue(worker) {
  /*
   * A queue to process tasks in asynchronous sequence.  Worker should
   * take in (task, callback), where callback is node-style.
   */
  this._queue = [];
  this.worker = worker;
  this._processing = false;
}

Queue.prototype.push = function(obj) {
  /* Push a task to the queue. */

  // Push a function to the queue
  this._queue.push(task);

  // Try to process the queue immediately
  this.process();
};

Queue.prototype.process = function() {
  /* Process the queue. */
  var self = this;

  // Make sure not to process multiple times
  if (this._processing || this._queue.length) return;

  // Number of workers completed and finished
  var done = 0;
  var todo = this._queue.length;

  function cb() {
    if (++done === todo) this._processing = false;
  }

  // Process each element
  for (var i = 0; i < todo; ++i) {
    this.worker(this._queue.shift(), cb);
  }
};

function makeSafeCallback(callback, pollFunc) {
  /* TODO: Make a callback safe with pollFunc ? */

  if (!callback) return noop;

  if (pollFunc) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      pollFunc(function() {
        callback.apply(null, args);
      });
    }
  }

  else {
    return callback;
  }
}

function unwrapArray(arr) {
  /* Unwrap an array if it is of length 1. */
  return arr && arr.length === 1 ? arr[0] : arr;
}

function spawnPhantom(opts, callback) {
  /* Spawn a phantomJS process. */
  opts = opts || {};
  opts.phantomPath = opts.phantomPath || 'phantomjs';
  opts.params = opts.params || {};
  opts.bridgeFile = opts.bridgeFile || __dirname + '/bridge.js';

  var args = [];
  // Build up command line arguments
  for (var param in params) {
    args.push('--' + param + '=' + params[param]);
  }

  args.push(bridgeFile);

  var phantom = child_process.spawn(opts.phantomPath, args);

}

exports.create = function(callback, options) {
  options = options || {};
  options.phantomPath = options.phantomPath || 'phantomjs';
  options.params = options.params || {};

  // Path to bridge file
  options.bridgeFile = __dirname + '/bridge.js';

  // TODO: callback?
  spawnPhantom(options.params, bridgeFile);

};
