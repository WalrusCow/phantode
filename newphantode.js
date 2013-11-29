var http = require('http');
var util = require('util');
var child_process = require('child_process');

var Queue = require('./queue');
var Page = require('./page');
var config = require('./config');

// How often to poll
var POLL_INTERVAL = 500;

function noop(){}

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
  /*
   * Attempt to spawn a phantomJS process.
   *
   * `callback` is called with (err, phantomInfo) where phantomInfo is:
   *  {
   *    process: node child_process handler for the phantomJS process
   *    port: port number that our child process is listening on
   *  }
   *
   */
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

  // It failed - call callback with an error
  phantom.once('error', callback);
  phantom.stderr.on('data', function(data) {
    console.warn('PhantomJS stderr: %s', data);
  });

  // Wait for it to be ready (our bridge file will print when ready)
  phantom.stdout.once('data', function(data) {

    // Now that it is ready, we can print phantomJS stdout like normal
    phantom.stdout.on('data', function(data) {
      console.log('PhantomJS stdout: %s', data);
    });

    // Check that the message received is actually our message
    if (data !== 'Phantode Ready') {
      phantom.kill();
      return callback('Unexpected output from PhantomJS: ' + data);
    }

    var phantomInfo = {
      process: phantom,
      port: config.port
    };

    callback(null, phantomInfo);
  });

  var exitCode = 0;
  phantom.once('exit', function(code) {
    exitCode = code;
  });

  // Wait 100 ms to check if phantom exited with failure
  setTimeout(function() {
    if (exitCode) {
      callback('PhantomJS immediately exited with code: ' + exitCode);
    }
  }, 100);
}

function handlePhantom(callback) {

  return function(err, phantomInfo) {
    // Fail early on error
    if (err) return callback(err);

    // Object of the pages we are using
    var pages = {};

    function makeNewPage(id) {
      /* Create a new page with given id. */




  };
}

exports.create = function(callback, options) {
  options = options || {};
  options.phantomPath = options.phantomPath || 'phantomjs';
  options.params = options.params || {};

  // Path to bridge file
  options.bridgeFile = __dirname + '/bridge.js';

  // TODO: callback?
  spawnPhantom(options, ___);

};
