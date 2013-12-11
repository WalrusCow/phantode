/*
 * File to spawn a phantom process.
 */

var child_process = require('child_process');
var _ = require('underscore');

var Phantom = require('./phantom');

// TODO: May need to add something about checking what port
// the bridge is listening on
module.exports = function(callback, opt) {
  /*
   * Spawn a new phantom process. Call callback when ready.
   */
  opt = opt || {};
  opt.params = opt.params || {};
  var phantomPath = opt.phantomPath || 'phantomjs';
  var bridge = opt.bridge || __dirname + '/bridge.js';

  // Create string arguments for the process
  var args = _.map(opt.params, function(val, key) {
    return '--' + key + '=' + val;
  });

  // We also need to send the file to execute (our bridge)
  args.push(bridge);

  // The phantom process that we control
  var phantomProcess = child_process.spawn(phantomPath, args);

  // Call the callback if there are any errors
  phantomProcess.once('error', callback);
  phantomProcess.stderr.on('data', console.error);

  // Listen for our output from bridge
  phantomProcess.stdout.once('data', function(data) {
    phantomProcess.stdout.on('data', console.info);

    if (!/Phantode Ready/.test(data)) {
      phantomProcess.kill();
      return callback('Error: unexpected output from PhantomJS: ' + data);
    }

    // Callback with process handler
    callback(null, new Phantom(phantomProcess));
  });

  var exitCode = 0;
  phantomProcess.once('exit', function(code) {
    exitCode = code;
  });

  // Check for some immediate error
  setTimeout(function() {
    if (exitCode) {
      callback('PhantomJS exited immediately with code: ' + exitCode);
    }
  }, 60);
};
