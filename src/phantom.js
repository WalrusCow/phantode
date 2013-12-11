/*
 * Wrap a phantom process with useful things
 */

var _ = require('underscore');

// TODO: Add all global functions for a phantom process
function Phantom(process) {
  this._process = process;
  // Make sure to exit the wrapped process
  this._ensureCleanup();
}

Phantom.prototype._ensureCleanup = function() {
  /* Clean up after a process (when we are exiting). */
  function clean() {
    // Safely quit the process (or fail silently if error)
    try {
      this._process.exit();
    } catch (e) {}
    // Continue with main process exit
    process.exit(1);
  }

  // Shut down child process when the process exits
  _.each(['SIGINT', 'uncaughtException'], function(sig) {
    process.on(sig, clean);
  });
}


Phantom.prototype.exit = function() {
  /* Kill process. */
  this._process.kill();
};

Phantom.prototype.on = function() {
  /* Pass down to process. */
  this._process.on.apply(this._process, arguments);
};

module.exports = Phantom;
