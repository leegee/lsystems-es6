if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require, exports, module) {
    "use strict";
    function Base () {}

    exports = module.exports = Base;

    exports.prototype.setOptions = function (options) {
        options = options || {};
        this.options = this.options || {};
        if (typeof options !== 'object') {
            throw new exports.prototype.OptionsError('Caller failed to supply an object: '+options);
        }
        Object.keys(options).forEach(function (i) {
            // Cast string to number
            if (typeof options[ i ] === 'string' &&
                options[ i ].match(/^\s*[.\d+]+\s*$/)
            ) {
                this.options[ i ] = parseInt( options[i] );
            } else {
                this.options[ i ] = options[ i ];
            }
        }, this);
    };

});
