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
    }
  }

  else {
    return callback;
  }
}


