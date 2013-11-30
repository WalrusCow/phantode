/* File for the queue worker. */

function queueWorker(params, next) {
  /* Worker for the queue. */
  var callback = params[1];
  params = params[0];

  // The page to work on
  var page = params[0];

  // The method to use
  var method = params[1];

  // Other arguments
  var args = params.slice(2);

  // Options for http polling
  var httpOptions = {
    hostname: '127.0.0.1',
    port: config.port,
    path: '/',
    method: 'POST'
  };

  // Send request to bridge
  var req = http.request(httpOptions, useData(function(err, data) {
    var cbErr = null;
    var cbData = data;

    if (!data) {
      // Don't send data to callback on error
      cbErr = 'No response data: ' + method + '()';
      cbData = undefined;
    }
    else if (err) {
      // Don't send data to callback on error
      cbErr = data;
      cbData = undefined;
    }
    else if (method === 'createPage') {
      // Creating the page is special
      var page = makeNewPage(data.pageId);
      cbData = page;
    }

    next();
    callback(cbErr, cbData);
  }));

  // Some error while sending to bridge
  req.on('error', function(err) {
    console.warn('Error evaluating %s() call: %s', method, err);
    next();
  });

  // JSON to send to bridge
  var json = JSON.stringify({
    page: page,
    method: method,
    args: args
  });

  // We need these headers
  req.setHeader('Content-Type', 'application/json');
  req.setHeader('Content-length', Buffer.byteLength(json));

  // Send JSON and end the request
  req.write(json);
  req.end();

}

module.exports = queueWorker;
