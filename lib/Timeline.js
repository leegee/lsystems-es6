if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require, exports, module) {
    "use strict";
    // var template = require('stache!controls');

    var Base = require('../lib/Base');

    var Timeline = function (options){
        this.setOptions(this, options);
    };

    exports  = module.exports = Timeline;
    exports.prototype = Object.create( Base.prototype );
    exports.prototype.constructor = Timeline;

    exports.prototype.render = function () {
    };
});

