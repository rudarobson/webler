var inputTypes = {};
var log = wRequire('log');
var system = _wRequire('system');
var fs = require('fs');
var typeHandlers = {};
var utils = _wRequire('utils');
var $ = wRequire('$');

module.exports = {
    registerType: function (type, handler) {
        if (typeHandlers[type]) {
            log.error('error registering input type: ' + type + ' was already registered');
            system.exit(-1);
        }
        typeHandlers[type] = handler;
    },
    addConverterTo: function (fromType, toType, handler) {
        if (!typeHandlers[fromType]) {
            log.error('error adding converter: type ' + fromType + ' doesn\'t exist ');
            system.exit(-1);
        }
        typeHandlers[fromType].to[toType] = handler;
        typeHandlers[fromType].supported.push(toType);
    },
    getConverter: function (type) {
        return typeHandlers[type];
    }
}

module.exports.registerType('string', {
    string: function (value) {
        return value
    },
    file: function (fileName, value) {
        utils.safeWriteFile(fileName, value);
    },
    dom: function (html, options) {
        return $.parse(html, options);
    }
});

module.exports.registerType('file', {
    string: function (value) {
        return fs.readFileSync(value).toString();
    },
    file: function (value) {
        return file;
    },
    dom: function (file, options) {
        var html = fs.readFileSync(file).toString();
        return $.parse(html, options);
    }
});

module.exports.registerType('dom', {
    string: function ($elt) {
        return $elt.serialize();
    },
    file: function (fileName, value) {
        utils.safeWriteFile(fileName, value.html());
    },
    dom: function ($elt) {
        return $elt;
    }
});
