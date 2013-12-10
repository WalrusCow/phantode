/*
 * File to spawn a phantom process.
 */

var child_process = require('child_process');
var _ = require('underscore');

function ensureCleanup(phantomProcess) {
  /* Clean up after a process (when we are exiting). */
  function clean() {
    // Safely quit the process (or fail silently if error)
    try {
      phantom.exit();
    } catch (e) {}
    // Continue with main process exit
    process.exit(1);
  }

  // Shut down child process when the process exits
  _.each(['SIGINT', 'uncaughtException'], function(sig) {
    process.on(sig, clean);
  });
}

module.exports = function(callback, opt) {
  /*
   * Spawn a new phantom process. Call callback when ready.
   */
  opt = opt || {};
  opt.params = opt.params || {};
  var phantomPath = opt.phantomPath || 'phantomjs';
  var bridge = opt.bridge || __dirname + '/bridge.js';

  // Create string arguments for the process
  var args = _.map(params, function(val, key) {
    return '--' + key + '=' + val;
  });

  // We also need to send the file to execute (our bridge)
  args.push(bridge);

  // The phantom process that we control
  var phantomProcess = child_process.spawn(phantomPath, args);

  // Make sure to shut down the child process when we exit
  ensureCleanup(phantomProcess);

  // Call the callback if there are any errors
  phantomProcess.once('error', callback);

  // Relay all output to our console
  phantomProcess.stderr.on('data', console.error);

  // Listen for our output from bridge
  phantomProcess.stdout.once('data', function(data) {
    // Now we can just print output
    phantomProcess.stdout.on('data', console.info);

    if (!/Phantode Ready/.test(data)) {
      // Unexpected data
      phantomProcess.kill();
      return callback('Error: unexpected output from PhantomJS: ' + data);
    }

    // TODO: Are we going to wrap the process?
    callback(null, phantomProcess);
  });

  var exitCode = 0;
  // Record exit code from phantom
  phantom.once('exit', function(code) {
    exitCode = code;
  });

  // Check for some immediate error
  setTimeout(function() {
    if (exitCode) {
      callback('PhantomJS exited immediately with code: ' + exitCode);
    }
  }, 60);
};
