/*
 * Class for managing page-level functions.
 */

var _ = require('underscore')
var codify = require('../codify');

// Page callbacks
var callbacks = [
  'alert', 'callback', 'closing', 'confirm', 'consoleMessage',
  'error', 'filePicker', 'initialized', 'loadFinished', 'loadStarted',
  'navigationRequested', 'pageCreated', 'prompt', 'resourceRequested',
  'resourceReceived', 'resourceTimeout', 'resourceError', 'urlChanged'
];

// Page methods
var methods = [
  'addCookie', 'childFramesCount', 'childFramesName', 'clearCookies', 'close',
  'currentFrameName', 'deleteCookie', 'evaluateJavaScript', 'evaluate',
  'evaluateAsync', 'getPage', 'go', 'goBack', 'goForward', 'includeJs',
  'injectJs', 'open', 'openUrl', 'release', 'reload', 'render', 'renderBase64',
  'sendEvent', 'setContent', 'stop', 'switchToFocusedFrame', 'switchToFrame',
  'switchToChildFrame', 'switchToMainFrame', 'switchToParentFrame', 'uploadFile'
];

function Page(id, bridge) {
  /* A page. */
  this._id = id;
  this._bridge = bridge;
};

Page.prototype.set = function(prop, val) {
  /* Set a property for the page. */
  this[prop] = val;
  var args = [prop, val];
  var func = codify.encodeFunc(this._id, 'set', args);
  this._bridge.useFunction(func, callback);
};

Page.prototype.get = function(prop, callback) {
  /* Get a property. */
  var args = [prop];
  var func = codify.encodeFunc(this._id, 'get', args);
  this._bridge.useFunction(func, callback);
};

// TODO: callbacks
//function addCallback() {
//}
//callbacks.forEach(addCallback);

_.each(methods, function(method) {
  // Add to prototype
  Page.prototype[method] = function() {
    var args = Array.prototype.slice.call(arguments);
    // Extract the callback
    var cb = (typeof args[args.length - 1] === 'function') ? args.pop() : noop;
    // Encode function for use
    var func = codify.encodeFunc(this._id, method, args);
    // Send function over bridge
    this._bridge.useFunction(func, cb);
  };
});

module.exports = Page;
