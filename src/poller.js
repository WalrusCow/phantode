/*
 * Poller to get callbacks
 */

var http = require('http');
var _ = require('underscore');

// TODO: We need to account for incrementing port
var config = require('./config');

function Poller(router) {
  /* Poll the bridge for callbacks; use the router for them. */

  // How long between polls
  this.pollInterval = 500;

  // Has process died?
  this._dead = false;

  // Where to poll
  this._dest = '127.0.0.1:' + config.port + '/';

  // Router to use for requests
  this._router = router;

  // Function to repeatedly poll
  this.repeatPoll = _.throttle(this.poll, this.pollInterval);

  // Begin continuous polling
  this.poll();
}

Poller.prototype.close = function() {
  this._dead = true;
};

Poller.prototype.poll = function(callback) {
  /* Poll for callbacks. */
  if (this._dead) return;

  var self = this;
  var req = http.get(this._dest, commonUtil.useData(function(err, data) {
    if (self._dead) return;

    if (err) {
      // Some error in retrieving data
      console.error('Error from poll request: %s', err);
      return;
    }

    try {
      // We should always get JSON back
      data = JSON.parse(data);
    }
    catch (e) {
      console.error('Error parsing JSON from bridge: %s', e);
      return;
    }

    // Route each callback appropriately
    _.each(data, self.router.route);
  }));

  this.repeatPoll();
};
