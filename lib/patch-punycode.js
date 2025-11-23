// Patch Node.js require to redirect punycode to npm package
// This must run before any other modules are loaded
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'punycode') {
    // Use the npm punycode package instead of Node's built-in deprecated one
    return require('punycode/');
  }
  return originalRequire.apply(this, arguments);
};

