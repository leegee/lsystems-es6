// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require, exports, module) {
    "use strict";
    var GUID = function GUID () {};
    exports = module.exports = GUID;

    exports.prototype.create = function () {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    };

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
    }

});
