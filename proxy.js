function Proxy(queue, phantom, pollFunction) {

  this.queue = queue;
  this.phantom = phantom;
  this.pollFunction = pollFunction;
}

Proxy.prototype.createPage = function(cb) {
  var args = [0, 'createPage'];
  this.queue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Proxy.prototype.injectJs = function(fileName, cb) {
  var args = [0, 'injectJs', fileName];
  this.queue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Proxy.prototype.addCookie = function(cookie, cb) {
  var args = [0, 'addCookie', cookie];
  this.queue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Proxy.prototype.clearCookies = function(cb) {
  var args = [0, 'clearCookies'];
  this.queue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Proxy.prototype.deleteCookie = function(cookie, cb) {
  var args = [0, 'deleteCookie', cookie];
  this.queue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Proxy.prototype.set = function(prop, val, cb) {
  var args = [0, 'setProperty', prop, val];
  this.queue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Proxy.prototype.get = function(prop, cb) {
  var args = [0, 'getProperty', property];
  this.queue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Proxy.prototype.exit = function(cb) {
  this.phantom.kill('SIGTERM');
  makeSafeCallback(cb)();
};

Proxy.prototype.on = function() {
  this.phantom.on.apply(this.phaneom, arguments);
};
