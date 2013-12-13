/*
 * Functions for communicating with the bridge.
 */

var config = require('../config');
var useData = require('useData');

function useFunction(func, callback) {
  /* Use the encoded function. Call callback with (err, results). */

  var json = JSON.stringify(func);

  var httpOptions = {
    hostname: '127.0.0.1',
    // TODO: Variable port
    port: config.port,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(json)
    }
  };

  var req = http.request(httpOptions, commonUtil.useData(function(err, data) {
    try {
      data = JSON.parse(data);
    }
    catch (e) {
      callback(e);
      return;
    }
    callback(err, data);
  });

  req.write(json);
  req.on('error', callback);
  req.end();
}
