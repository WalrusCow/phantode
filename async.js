/* Generic utilities. */

exports.parallelProcess = function(arr, callback) {
  /* Process everything in arr in parallel. Execute cb when done. */

  var done = 0;
  var errors = null;
  var results = [];

  function ithCallback(i) {
    return function (err, res) {

      // Pass errors if necessary
      if (err) {
        if (!errors) errors = [];
        errors[i] = err;
      }

      // Save results in appropriate location
      results[i] = res;

      // Count number done
      done += 1;

      // Execute the callback if we have finished all calls
      if (done === arr.length) {
        callback(errors, results)
      }

    }
  }

  for (var i = 0; i < arr.length; ++i) {
    // Call the ith funtion with the ith callback
    arr[i](ithCallback(i));
  }

}

