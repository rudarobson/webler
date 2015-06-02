var fs = require('fs');
var $ = wRequire('$');
var utils = _wRequire('utils');
var converters = require('./converters');

function Resource(src, dest) {
  var _type = 'file';
  var _value = src;
  var dependencies: { [id: string]: any } = {};

  this.set = function(type, value) {
    _type = type;
    _value = value;
  }

  this.value = function(type) {
    if (arguments.length == 0)
      return _value;
    else
      return converters.getConverter(_type)[type](_value);
  }

  this.type = function() {
    return _type;
  }

  this.is = function(type) {
    return _type == type;
  }

  this.src = function() {
    return src;
  }

  this.dest = function() {
    return dest;
  }

  this.addDependency = function(file: string) {
    dependencies[file] = {
      creationDate: ''
    };
  }

  this.getDependencies = function(): { [id: string]: any } {
    return dependencies;
  }
}

export = {
  createResource: function(src, dest): FileResource {
    return new Resource(src, dest);
  },
  addResourceType: function(type, handler): void {
    converters.registerType(type, handler);
  }
}
