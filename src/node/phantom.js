/*
 * Module for a single phantom process.
 */

// Who doesn't love underscore?
var _ = require('underscore');

// Configuration file
// TODO: Is this necessary, or can we use random port?
var config = require('../config');

// Bridge modules to communicate with PhantomJS
var Bridge = require('./bridge');

// PhantomJS modules
var WebPage = require('./webPage');
//var System = require('./system');
//var FS = require('./fs');
//var WebServer = require('./webServer');
//var ChildProcess = require('./childProcess');

function Phantom(process, port) {
  /* Wrap a PhantomJS process for use in node. */

  // Ensure the process closes
  ensureClose(process);
  this._process = process;

  // Create the bridge
  this._bridge = new Bridge(port);
  this._bridge.on('callback', this._routeCallback.bind(this));

  // The PhantomJS modules
  var modules = {
    webpage : WebPage,
    //system : System,
    //fs : FS,
    //webserver : WebServer,
    //child_process : ChildProcess
  };

  var self = this;
  // Set each module
  _.each(modules, function(module, moduleName) {
    self[moduleName] = new module(self._bridge);
  });
}

function ensureClose(child) {
  /* Ensure that the child process closes. */
  function close() {
    // Safely quit (or fail silently)
    try {
     child.kill();
    } catch (e) {}
    // Continue with main process exit
    process.exit(1);
  }

  // Close on certain signals
  var signals = ['SIGINT', 'SIGTERM'];
  _.each(signals, function(sig) {
    process.on(sig, close);
  });

  // Also close child process on exception
  process.on('uncaughtException', function(err) {
    // Print useful information
    console.error(err.stack);
    close();
  });
};

Phantom.prototype._routeCallback = function(data) {
  /* Route the callback to the appropriate place. */
  // TODO
};

Phantom.prototype.exit = function() {
  /* Kill process. */
  this._process.kill();
};
Phantom.prototype.kill = Phantom.prototype.exit;

Phantom.prototype.on = function() {
  /* Pass through to process. */
  this._process.on.apply(this._process, arguments);
};

module.exports = Phantom;
