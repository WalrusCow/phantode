/*
 * Wrap a phantom process with useful things
 */

var _ = require('underscore');
var PageList = require('./pageList');

// TODO: Add all global functions for a phantom process
function Phantom(process) {
  this._process = process;
  // Make sure to exit the wrapped process
  this._ensureCleanup();

  // Set up all "modules"
  this._setupModules();
}

Phantom.prototype._setupModules = function() {
  /* Create new "modules" for this process to use. */
  var pageList = new PageList();
  this.webpage = {
    create : function() {
      return pageList.newPage();
    }
  };
};

Phantom.prototype._ensureCleanup = function() {
  /* Clean up after a process (when we are exiting). */
  var self = this;
  function clean() {
    // Safely quit the process (or fail silently if error)
    console.log('cleaning');
    try {
      self._process.kill();
    } catch (e) {}
    // Continue with main process exit
    process.exit(1);
  }

  // Shut down child process when the process exits
  _.each(['SIGINT', 'uncaughtException'], function(sig) {
    process.on(sig, clean);
  });
};

Phantom.prototype.exit = function() {
  /* Kill process. */
  this._process.kill();
};

Phantom.prototype.on = function() {
  /* Pass down to process. */
  this._process.on.apply(this._process, arguments);
};

module.exports = Phantom;
