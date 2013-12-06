var http = require('http');
var child_process = require('child_process');

// Class to wrap a phantomJS process
var Phantom = require('./classes/phantom');

// Configuration
var config = require('./config');

// How often to poll
var POLL_INTERVAL = 500;

function spawnPhantom(opts, callback) {
  /*
   * Attempt to spawn a phantomJS process.
   * `callback` is called with (err, phantomProcess)
   *
   * TODO: Make this spawn a Phantom class, and simplify callback
   */

  opts = opts || {};
  opts.phantomPath = opts.phantomPath || 'phantomjs';
  opts.params = opts.params || {};
  opts.bridgeFile = opts.bridgeFile || __dirname + '/bridge.js';

  var args = [];
  // Build up command line arguments
  for (var param in opts.params) {
    args.push('--' + param + '=' + opts.params[param]);
  }

  args.push(opts.bridgeFile);

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
    if (!/Phantode Ready/.test(data)) {
      phantom.kill();
      return callback('Unexpected output from PhantomJS: ' + data);
    }

    callback(null, phantom);
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

function cleanup(phantom) {
  /* Make sure to clean up after a phantom. */

  function clean() {
    /* Try to exit phantom, but fail silently. */
    try {
      phantom.exit();
    }
    catch (e) {}
    process.exit(1);
  }

  // On process termination or uncaught exception
  ['SIGINT', 'uncaughtException'].forEach(function(sig) {
    process.on(sig, clean);
  });
}

function handlePhantom(callback) {
  /* Essentially just wrap callback. */

  return function(err, phantomProcess) {
    // Fail early on error
    if (err) return callback(err);

    // Create new wrapper for this process
    var phantom = new Phantom(phantomProcess);

    // Make sure to always kill child processes
    cleanup(phantom);
    callback(null, phantom);
  };
}

exports.create = function(callback, options) {
  options = options || {};
  options.phantomPath = options.phantomPath || 'phantomjs';
  options.params = options.params || {};

  // Path to bridge file
  options.bridgeFile = __dirname + '/bridge.js';

  spawnPhantom(options, handlePhantom(callback));
};
