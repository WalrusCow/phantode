/*
 * Class for managing page-level functions.
 */

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

function Page(id) {
  /* A page. */
};

Page.prototype.set = function(prop, val) {
  /* Set a property for the page. */

  // Poll bridge
  // Also set here
  this.prop = val;
};

Page.prototype.get = function(prop, callback) {
  /* Get a property. */

  // Poll bridge

};
