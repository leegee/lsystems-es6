if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require, exports, module) {
    "use strict";
    function Base () {}

    exports = module.exports = Base;

    exports.prototype.cast = function (variable) {
        if (typeof variable === 'string' &&
            variable.match(/^\s*(-+)?\d+(\.\d+)?\s*$/)
        ){
            variable = parseFloat( variable );
        }
        return variable;
    }

    exports.prototype.setOptions = function (options) {
        options = options || {};
        this.options = this.options || {};
        if (typeof options !== 'object') {
            throw new exports.prototype.OptionsError('Caller failed to supply an object: '+options);
        }
        Object.keys(options).forEach(function (i) {
            this.options[i] = this.cast( options[i] );
        }, this);
    };

});
