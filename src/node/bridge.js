/*
 * Functions for communicating with the bridge.
 */

var requestData = require('requestData');
var events = require('events');
var http = require('http');

var _ = require('underscore');

function Bridge(port) {
  /* Bridge class to communicate with PhantomJS. */
  console.log('THE PORT IS: ',port);
  this.port = port;
  this.pollInterval = 500;
  this._dead = false;
  // Function for repeated polling, but not too often
  this.repeatPoll = _.throttle(this.poll, this.pollInterval);
  // Begin polling
  //this.poll();
}

Bridge.prototype.useFunc = function(func, callback) {
  /* Use the encoded function. Call callback with (err, results). */

  console.log('using func');
  var json = JSON.stringify(func);

  var httpOptions = {
    hostname: '127.0.0.1',
    // TODO: Variable port
    port: this.port,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(json)
    }
  };

  var req = http.request(httpOptions, requestData.useData(function(err, data) {
    console.log('WE GOT RESAPONSSE');
    console.log('the err', err);
    console.log('the data',data);
    try {
      data = JSON.parse(data);
    }
    catch (e) {
      callback(e);
      return;
    }
    callback(err, data);
  }));

  req.write(json);
  req.on('error', callback);
  req.end();
};

Bridge.prototype.close = function() {
  /* Kill polling. */
  this._dead = true;
};

Bridge.prototype.poll = function() {
  /* Poll for callbacks. */
  if (this._dead) return;

  console.log('polling');
  var self = this;
  var dest = 'http://127.0.0.1:' + this.port;
  var req = http.get(dest, requestData.useData(function(err, data) {
    console.log('polled');
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

    // TODO: Emit callbacks
    _.each(data, function(foo) {
      self.emit('callback', foo);
    });

  }));

  // Poll continuously
  this.repeatPoll();
};

// We want to emit events
_.extend(Bridge.prototype, events.EventEmitter.prototype);

module.exports = Bridge;
