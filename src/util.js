/*
 * Common utilities.
 */

function noop() {}

exports.safeCallback = function(callback, pollFunc) {
  /* TODO: Make a callback safe with pollFunc ? */

  if (!callback) return noop;
  if (!pollFunc) return callback;

  return function() {
    var args = Array.prototype.slice.call(arguments);
    pollFunc(function() {
      callback.apply(null, args);
    });
  };

};

exports.useData = function(func) {
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
};

exports.throttle = function(func, throttleTime, context) {
  /* Call a function no more frequently than throttleTime ms */

  // Arguments to call with, and result to use
  var args, result, nextCall;
  // Variable to hold the timeout
  var nextCall;
  // Time of last function call (init to 0 for arithmetic)
  var lastCall = 0;

  // Function to call as a timeout, if func called in interim
  var later = function() {
    // Clear timeout var
    nextCall = null;

    // Record time of call, and call function
    lastCall = new Date();
    result = func.apply(context, args);
  };

  // Return wrapper for the function
  return function() {
    // Time when function was called
    var now = new Date();

    // Time elapsed since last function call
    var elapsed = (now - lastCall);
    args = Array.prototype.slice.call(arguments);

    // If more than `throttleTime` has elapsed
    if (elapsed >= throttleTime) {
      // Clear any timeout that somehow is there
      clearTimeout(nextCall);
      nextCall = null;

      // Record time of last call and call function
      lastCall = now;
      result = func.apply(context, args);
    }

    // If we don't already have a call lined up
    else if (!nextCall) {
      nextCall = setTimeout(later, throttleTime - elapsed);
    }

    return result;
  };
}
