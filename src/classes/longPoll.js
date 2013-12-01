/*
 * A function for polling your mother.
 */

var config = require('../config');
var commonUtil = require('../util');

function LongPoll(phantom, pages, setupPage) {
  // Record if the phantom process is dead yet
  this._dead = false;

  // TODO: Have this encapsulated somewhere in a function/class
  this.pages = pages;

  // Options to use to send requests to the bridge
  // TODO: This could/should be configurable
  this._httpOptions = {
    hostname: '127.0.0.1',
    port: config.port,
    path: '/',
    method: 'GET'
  };

  // Begin continuous polling
  this.repeatPoll();
}

LongPoll.repeatPoll = function() {
  /* Function to poll continuously. */
  var self = this;
  setTimeout(function() {
    self.poll(repeatPoll());
  }, this.pollInterval);
};

LongPoll.prototype.close = function() {
  /* To be called when the phantom process dies. */
  this._dead = true;
};

LongPoll.prototype._processResult = function(result) {
  /* Process a single result from the bridge. */

  // Do nothing if process is dead
  if (this._dead) return;

  // TODO: What is this situation?
  if (!result.pageId) {
    var cb = commonUtil.safeCallback(phantom[result.callback]);
    cb.apply(phantom, result.args);
    return;
  }

  // The page specified by the result
  var page = this.pages[result.pageId];
  if (!page) {
    console.warn('Invalid page ID received: %s', pageId);
    return;
  }

  if (result.callback === 'onPageCreated') {
    // We actually want to do something special for new pages
    result.args = [setupPage(result.args[0])];
  }

  // Call the specified callback with the specified arguments
  if (page[result.callback]) {
    page[result.callback].apply(page, result.args);
  }
};

LongPoll.prototype.poll = function(callback) {
  /* Poll the bridge for results. */
  if (this._dead) return;

  var self = this;

  var req = http.get(httpOptions, commonUtil.useData(function(err, data) {
    // Process could have died while waiting for the request
    if (self._dead) return;

    if (err) {
      console.warn('Error received from poll request: %s', err)
      return;
    }

    try {
      data = JSON.parse(data);
    }
    catch (e) {
      // This should never happen
      console.warn('Error parsing JSON from bridge: %s', e);
      console.warn('Data received was: %s', data);
      return;
    }

    // Process each result
    data.forEach(self._processResult.bind(self));

    // Done
    callback();
  }));

  // Some failure from the bridge
  req.on('error', function(err) {
    if (self._dead) return;
    console.warn('Poll request error: %s', err);
  });
};
