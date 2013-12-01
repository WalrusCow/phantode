var webpage = require('webpage');
var system = require('system');

// The server we will use to communicate with the node interface
var webServer = require('webserver').create();

// General configurations
var config = require('./config');

// Object of pages to lookup
var pages = {};
var pageId = 1;

var callbackStack = [];

// If there is an error, make sure to write it
phantom.onError = function(msg, trace) {
  // Create message as an array
  var message = ['PhantomJS Error: ' + msg];

  if (trace && trace.length) {
    message.push('TRACE:');

    trace.forEach(function(t) {
      // Only show function if necessary
      var fn = t.function ? ' (in function ' + t.function + ')' : '';
      message.push(' -> ' + t.file + ': ' + t.line + fn);
    });

    system.stderr.writeLine(message.join('\n'));
    phantom.exit(1);
  }
};

function pageOpen(res, page, args) {
  // TODO: Why are we concatting this fn?
  page.open.apply(page, args.concat(function(success) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(success));
    res.close();
  }));
}

function serverHandler(req, res) {
  /* Function that drives the web server. */

  // TODO: GET and POST are two different things
  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');

    // Send the callbacks to the node interface
    res.write(JSON.stringify(callbackStack));
    callbackStack = [];
    res.close();
  }

  // TODO: What is a POST instead of a GET?
  else if (req.method === 'POST') {
    var request = JSON.parse(req.post);
    var method = request.method;
    var output, error;

    // It's a method for a page
    if (request.page) {
      var page = pages[request.page];
      if (method === 'open') {
        return pageOpen(res, page, request.args);
      }

      try {
        output = page[method].apply(page, request.args);
      }
      catch (err) {
        error = err;
      }
    }

    // It's a global method
    else {
      try {
        output = globalMethods[method].apply(globalMethods, request.args);
      }
      catch (err) {
        error = err;
      }
    }

    // We always return JSON
    res.setHeader('Content-Type', 'application/json');

    // Give an indicative status code
    res.statusCode = error ? 500 : 200;

    // Write error or output, as appropriate
    res.write(JSON.stringify(error || output || null));
    res.close();
  }

  // This is bad, and should never happen
  else {
    throw 'Unknown request type: ' + req.method;
  }
}

var server = webServer.listen(config.port, serverHandler);

var callbacks = [
  'onAlert', 'onCallback', 'onClosing', 'onConfirm', 'onConsoleMessage',
  'onError', 'onFilePicker', 'onInitialized', 'onLoadFinished', 'onLoadStarted',
  'onNavigationRequested', 'onPrompt', 'onResourceRequested', 'onUrlChanged',
  'onResourceReceived', 'onResourceError'
];

function pushCallback(pageId, callback, args) {
  /* Push callback with the specified id and arguments. */

  // Force args to be an array
  args = args instanceof Array ? args : [args];

  // Push to the stack
  callbackStack.push({
    pageId: pageId,
    callback: callback,
    args: args
  });
}

function setupCallbacks(id, page) {
  /* Set up the callbacks for a given page. */

  callbacks.forEach(function(cb) {
    page[cb] = function(param) {
      var args = Array.prototype.slice.call(arguments);

      // TODO: Whyyyyyyyy
      // If it is a resource requested and image, then no-op
      if ((cb === 'onResourceRequested') && (param.url.indexOf('data:image') === 0)) return;

      // TODO: Whyyyyy
      if (cb === 'onClosing') args = [];

      pushCallback(pageId, cb, args);
    };
  });

  // Page created is a special case of course
  page.onPageCreated = function(page) {
    var newId = setupPage(page);
    // TODO: Avoid array here
    pushCallback(pageId, cb, newId);
  };

}

function setupPage(page) {
  /* Set up a new page for use. */
  var id = pageId;
  pageId += 1;

  page.getProperty = function(prop) {
    return page[prop];
  };
  page.setProperty = function(prop, val) {
    return page[prop] = val;
  };
  page.setFunction = function(name, fn) {
    // We are setting a function from the user
    page[name] = eval('(' + fn + ')');
    return true;
  };
  pages[id] = page;
  setupCallbacks(id, page);
  return id;
}

// TODO in a loop
var GLOB_METHODS = [
  'injectJs', 'exit', 'addCookie', 'clearCookies', 'deleteCookies'
];
var globalMethods = {
  createPage: function() {
    var page = webpage.create();
    var id = setupPage(page);
    return {
      pageId: id
    };
  },

  // TODO: Make this a generic with `this` and binding
  // Also TODO, why is this `getProperty` and not just get?
  // -> is `get` a phantomJS method already?
  getProperty: function(prop) {
    return phantom[prop];
  },
  setProperty: function(prop, value) {
    phantom[prop] = value;
    // TODO: Why are we returning true?
    return true;
  }
};

GLOB_METHODS.forEach(function(method) {
  globalMethods[method] = function() {
    return phantom[method].apply(phantom, arguments);
  };
});

// Signal that we are ready!
console.log('Phantode Ready');
