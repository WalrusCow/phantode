var http = require('http');
var child_process = require('child_process');

var Queue = require('./classes/queue');
var Page = require('./classes/page');
var Phantom = require('./classes/phantom');
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
   *  }
   *
   */
  opts = opts || {};
  opts.phantomPath = opts.phantomPath || 'phantomjs';
  opts.params = opts.params || {};
  opts.bridgeFile = opts.bridgeFile || __dirname + '/bridge.js';

  var args = [];
  // Build up command line arguments
  for (var param in opts.params) {
    args.push('--' + param + '=' + opts.params[param]);
  }

  args.push(opts.bridgeFile);

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
    if (!/Phantode Ready/.test(data)) {
      phantom.kill();
      return callback('Unexpected output from PhantomJS: ' + data);
    }

    var phantomInfo = {
      process: phantom,
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

function pageGenerator(queue, poll, pages) {
  /* Encapsulate queue, poll, pages. */
  return function(id) {
    var newPage = new Page(id, queue, poll);
    pages[id] = newPage;
    return newPage;
  };
}

function handlePhantom(callback) {
  /* Essentially just wrap callback. */

  return function(err, phantomInfo) {
    // Fail early on error
    if (err) return callback(err);

    var phantom = phantomInfo.process;

    // Object of the pages we are using
    var pages = {};

    function makeNewPage(id) {
      /* Create a new page with given id. */
      var newPage = new Page(id, requestQueue, pollFunction);
      pages[id] = newPage;
      return newPage;
    }

    // TODO: Why does this take makeNewPage ??
    var pollFunction = setupLongPoll(phantom, pages, makeNewPage);
    var poller = new LongPoll(pages, makeNewPage);

    // We don't want to poll after phantom process has closed
    phantom.once('exit', function() {
      poller.close();
    });

    // The queue of requests
    var requestQueue = new Queue(queueWorker);

    // Handler for the phantom process that we spawned
    var phantom = new Phantom(phantom, poller);

    callback(null, phantom);
  };
}

exports.create = function(callback, options) {
  options = options || {};
  options.phantomPath = options.phantomPath || 'phantomjs';
  options.params = options.params || {};

  // Path to bridge file
  options.bridgeFile = __dirname + '/bridge.js';

  // TODO: callback?
  spawnPhantom(options, handlePhantom(callback));

};
