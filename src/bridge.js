/*
 * Bridge file.  This is run under PhantomJS and communicates
 * with the outside world (main phantode driver) via http.
 */

// We include everything so that we can access everything
var fs = require('fs');
var webpage = require('webpage');
var system = require('system');
var child_process = require('child_process');
var webserver = require('webserver');

// Some configuration information (mostly what port to listen on)
var config = require('./config');

// Underscore is always useful
var _ = require('underscore');

// Stack of callbacks that happened
var callbackStack = [];

// Track the pages that we have created
var pages = {};

function overrideMethods() {
  /* Override existing methods for compatibility. */
  // This can be extended into a loop if necessary at a later date
  var oldCreate = webpage.create;
  webpage.create = function() {
    pageId += 1;
    pages[pageId] = oldCreate.apply(webpage, arguments);
    return pages[pageId];
  };

}

function callFunction(req, res) {
  /* Call function specified in request; write output to response. */

  // TODO: Wrap in try
  var data = JSON.parse(req.post);

  // Default to success
  res.statusCode = 200;

  // Convert request arguments into real arguments
  var args = _.map(req.args, function(arg) {
    return arg.eval ? eval(arg) : arg;
  });

  var context, func;
  // A global function
  if (data.ctx === 'global') {
    context = eval(data.func);
    func = context;
  }

  // We have a page-level function (context is a page ID)
  // TODO: Also context for webpage, webserver, etc
  else {
    context = pages[data.ctx];
    func = context[data.func];
  }

  // Run the function
  try {
    var output = func.apply(context, args);
  }
  catch (e) {
    // Error, update code accordingly
    res.statusCode = 500;
    output = e;
  }

  // We send JSON
  res.headers = {
    'Content-Type': 'application/json'
  };
  res.statusCode = statusCode;

  // Write output
  res.write(JSON.stringify(output));
  res.close();
}

function serve(req, res) {
  /* Web server driver. */
  if (req.method === 'POST') {
    // Calling a function
    callFunction(req, res);
  }

  else {
    // Polling for callbacks
    pollCallbacks(req, res);
  }
}

// Make the server listen
var server = require('webserver');
// TODO: Increment port so that we can spawn multiple processes
server.listen(config.port, serve);

// Override build in methods for use with us
overrideBuiltins();
