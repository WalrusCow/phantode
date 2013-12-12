/*
 * Functions for communicating with the bridge.
 * ... or something
 */

var _ = require('underscore');

function encodeArg(val) {
  /* Turn a value into an argument that we use. */

  var arg;

  // We need to `eval` functions on the other side
  if (typeof arg === 'function') {
    arg = {
      eval: true,
      val: val.toString()
    };
  }

  else {
    arg = {
      eval: false,
      val: JSON.stringify(val)
    };
  }

  return arg;
}

function decodeArg(arg) {
  return arg.eval ? eval(arg.val) : arg.val;
}

function encodeFunc(context, func, args) {
  /*
   * Encode a function to use in PhantomJS.
   *
   * `context` is the context in which to *find* the function to evaluate.
   * This could be 'globals', a global object in PhantomJS, or a page
   * ID.  If it is a page ID then the function will be evaluated in the
   * context of that page.
   * `func` is the name of a function
   * `args` is an array of arguments
   */
  args = _.map(args, encodeArg);
  return {
    ctx: context,
    func: func,
    args: args
  };
}
