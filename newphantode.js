var http = require('http');
var util = require('util');
var child_process = require('child_process');

var Queue = require('./classes/queue');
var Page = require('./classes/page');
var Proxy = require('./classes/proxy');
var queueWorker = require('./worker');
var commonUtil = require('./util');

// Configuration
var config = require('./config');

// How often to poll
var POLL_INTERVAL = 500;

function noop(){}

function spawnPhantom(opts, callback) {
  /*
   * Attempt to spawn a phantomJS process.
   *
   * `callback` is called with (err, phantomInfo) where phantomInfo is:
   *  {
   *    process: node child_process handler for the phantomJS process
   *    port: port number that our child process is listening on
   *  }
   *
   */
  opts = opts || {};
  opts.phantomPath = opts.phantomPath || 'phantomjs';
  opts.params = opts.params || {};
  opts.bridgeFile = opts.bridgeFile || __dirname + '/bridge.js';

  var args = [];
  // Build up command line arguments
  for (var param in params) {
    args.push('--' + param + '=' + params[param]);
  }

  args.push(bridgeFile);

  var phantom = child_process.spawn(opts.phantomPath, args);

  // It failed - call callback with an error
  phantom.once('error', callback);
  phantom.stderr.on('data', function(data) {
    console.warn('PhantomJS stderr: %s', data);
  });

  // Wait for it to be ready (our bridge file will print when ready)
  phantom.stdout.once('data', function(data) {

    // Now that it is ready, we can print phantomJS stdout like normal
    phantom.stdout.on('data', function(data) {
      console.log('PhantomJS stdout: %s', data);
    });

    // Check that the message received is actually our message
    if (data !== 'Phantode Ready') {
      phantom.kill();
      return callback('Unexpected output from PhantomJS: ' + data);
    }

    var phantomInfo = {
      process: phantom,
      port: config.port
    };

    callback(null, phantomInfo);
  });

  var exitCode = 0;
  phantom.once('exit', function(code) {
    exitCode = code;
  });

  // Wait 100 ms to check if phantom exited with failure
  setTimeout(function() {
    if (exitCode) {
      callback('PhantomJS immediately exited with code: ' + exitCode);
    }
  }, 100);
}

function handlePhantom(callback) {
  /* Essentially just wrap callback. */

  return function(err, phantomInfo) {
    // Fail early on error
    if (err) return callback(err);

    var phantom = phantomInfo.process;
    var port = phantomInfo.port;

    // Object of the pages we are using
    var pages = {};

    function makeNewPage(id) {
      /* Create a new page with given id. */
      var newPage = new Page(id, requestQueue, pollFunction);
      pages[id] = newPage;
      return newPage;
    }

    // TODO
    var pollFunction = setupLongPoll(phantom, port, pages, makeNewPage);

    // The queue of requests
    var requestQueue = new Queue(queueWorker);

    // The proxy to use
    var proxy = new Proxy(requestQueue, phantom, pollFunction);

    callback(null, proxy);
  };
}

function setupLongPoll(phantom, port, pages, setupPage) {
  var httpOptions = {
    hostname: '127.0.0.1',
    port: port,
    path: '/',
    method: 'GET'
  };

  // Check if the process has been killed yet
  var dead = false;
  phantom.once('exit', function() {
    dead = true;
  });

  function pollFunction(cb) {
    // No-op if the process is dead
    if (dead) return;

    var req = http.get(httpOptions, useData(function(data) {
      // Process could have died while waiting for the request
      if (dead) return;

      try {
        var data = JSON.parse(data);
      }
      catch (e) {
        console.warn('Error parsing JSON from bridge: %s', err);
        console.warn('Data received was: %s', data);
        return;
      }

      results.forEach(function(result) {

        // TODO: What is this situation?
        if (!result.pageId) {
          var cb = commonUtil.safeCallback(phantom[result.callback]);
          cb.apply(phantom, result.args);
          return;
        }

        // The page specified by the result
        var page = pages[result.pageId];

        if (!page) {
          console.warn('Invalid page ID received: %s', pageId);
          return;
        }

        if (result.callback === 'onPageCreated') {
          // We actually want to do something special for new pages
          result.args = [makeNewPage(result.args[0])]
        }

        // Call the specified callback with the specified arguments
        if (page[result.callback]) {
          page[result.callback].apply(page, result.args);
        }

      });

      cb();

    }));

    req.on('error', function(err) {
      if (dead) return;
      console.warn('Poll request error: %s', err);
    });
  };

  function repeater() {
    setTimeout(function() {
      pollFunction(repeater);
    }, POLL_INTERVAL);
  }

  repeater();
  return pollFunction;

};

function useData(func) {
  /* Return a function that is a callback to an http request. */
  return function(res) {
    res.setEncoding('utf8');
    var dataBuffer = [];

    // Build up data
    res.on('data', function(chunk) {
      dataBuffer.push(new Buffer(chunk));

    // Call function with no error and data
    }).on('end', function() {
      func(null, Buffer.concat(dataBuffer).toString());

    // Call function with error when error
    }).on('error', func);
  };
}

exports.create = function(callback, options) {
  options = options || {};
  options.phantomPath = options.phantomPath || 'phantomjs';
  options.params = options.params || {};

  // Path to bridge file
  options.bridgeFile = __dirname + '/bridge.js';

  // TODO: callback?
  spawnPhantom(options, handlePhantom/*...*/);

};
