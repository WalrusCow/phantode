/*
 * Common utilities.
 */

exports.safeCallback = function(callback, pollFunc) {
  /* TODO: Make a callback safe with pollFunc ? */

  if (!callback) return noop;

  if (pollFunc) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      pollFunc(function() {
        callback.apply(null, args);
      });
    };
  }

  else {
    return callback;
  }
};

exports.useData = function(func) {
  /* Return a function that is a callback to an http request. */
  return function(res) {
    res.setEncoding('utf8');
    var dataBuffer = [];

    // Build up data
    res.on('data', function(chunk) {
      console.log('Getting data ',chunk);
      dataBuffer.push(new Buffer(chunk));

    // Call function with no error and data
    }).on('end', function() {
      console.log('Request ending');
      func(null, Buffer.concat(dataBuffer).toString());

    // Call function with error when error
    }).on('error', func);
  };
};
