function Base () {};
var exports = module.exports = Base;
exports.prototype.setOptions = function (options) {
    var self = this;
    options = options || {};
    self.options = self.options || {};
    if (typeof options !== 'object') {
        throw new exports.prototype.OptionsError('Caller failed to supply an object: '+options);
    }
    Object.keys(options).forEach(function (i) {
        // Cast string to number
        if (typeof options[ i ] === 'string' && options[ i ].match(
            /^\s*[.\d+]+\s*$/)) {
            options[ i ] = parseInt(options[ i ]);
        }
        self.options[ i ] = options[ i ];
    });
};
