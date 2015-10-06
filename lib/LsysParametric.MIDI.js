/* LsysParametric.MIDI.js */

var Lsys = require('../lib/LsysParametric.common');

exports = module.exports = MIDI;
exports.prototype = Object.create( Lsys.prototype );
exports.prototype.constructor = MIDI;

function MIDI (options) {
    var self = this;
    Lsys.prototype.constructor.call( this, options );
};

// @override
exports.prototype.initialize = function (options) {
    if (this.options.initially
        && typeof this.options.initially === 'function'
    ){
        this.options.initially.call(this);
    }
};

