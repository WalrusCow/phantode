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

var codify = require('../codify');

// Some configuration information (mostly what port to listen on)
var config = require('../config');

// Underscore is always useful
var _ = require('underscore');

// Stack of callbacks that happened
var callbackStack = [];

// Track the pages that we have created
var pages = {};
var pageId = 0;

// Functions that take callbacks
var callbackFuncs = {
  page : ['open', 'includeJs']
};

function patchBuiltins() {
  /* Override existing methods for compatibility. */
  // This can be extended into a loop if necessary at a later date
  var oldCreate = webpage.create;

  // TODO: Page setup (override callbacks, etc)
  // Also, use variable number of callbacks
  webpage.create = function() {
    pageId += 1;
    pages[pageId] = oldCreate.apply(webpage, arguments);
    return pages[pageId];
  };

}

function callFunction(req, res) {
  /* Call function specified in request; write output to response. */

  function respond(output) {
    /* Respond to HTTP request with output from function. */
    // Write output
    res.write(JSON.stringify(output));
    res.close();
  }

  // TODO: Wrap in try
  var data = JSON.parse(req.post);

  // Default to success
  res.statusCode = 200;
  // We send JSON
  res.headers = {
    'Content-Type': 'application/json'
  };

  // Convert request arguments into real arguments
  var args = _.map(data.args, codify.decodeArg);

  // Set to true if function takes a callback
  var hasCallback = false;
  var context, func;
  console.log('Calling function with data: ', JSON.stringify(data));
  // A global function
  if (data.ctx === 'global') {
    context = eval(data.func);
    func = context;
  }

  // We have a page-level function (context is a page ID)
  else if (_.isNumber(data.ctx)) {
    hasCallback = _.contains(callbackFuncs.page, data.func);
    context = pages[data.ctx];
    func = context[data.func];
  }

  // It's a function from a module
  else {
    context = eval(data.ctx);
    func = context[data.func];
  }

  console.log('Calling function with args: ', args);
  // Run the function
  if (hasCallback) {
    // Function takes a callback, so some things are different
    args.push(function() {
      /* Function to use as callback. */
      var output = Array.prototype.slice.call(arguments);
      respond(output);
    });


    func.apply(context, args);
  }

  // No callback - directly call
  else {
    try {
      var output = func.apply(context, args);
    }
    catch (e) {
      // Error, update code accordingly
      // TODO: we could send back an object which has two fields: err & output
      res.statusCode = 500;
      output = e;
    }

    respond(output);
  }
}

function getCallbacks(req, res) {
  console.log('getCallbacks');
  res.statusCode = 200;
  res.write('');
  res.end();
}

// Make the server listen
var server = webserver.create();
// TODO: Increment port so that we can spawn multiple processes
server.listen(config.port, function(req, res) {
  /* Web server driver. */
  if (req.method === 'POST') {
    console.log('Got POST');
    // Calling a function
    callFunction(req, res);
  }

  else {
    console.log('Got GET');
    // Polling for callbacks
    getCallbacks(req, res);
  }
});

// Override build in methods for use with us
patchBuiltins();

// TODO: Send port from `server.port` ?
system.stdout.write('Phantode Ready');
