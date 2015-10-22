var GUID = require('../lib/GUID');

var Guid = new GUID();

var Controls = function Controls (options) {
    options = options || {};

    this.window = options.window;

    if (! options.hasOwnProperty('el')){
        options.el = this.window.document.createElement( 'div' );
    }

    if (! options.el.getAttribute('id')){
        options.el.setAttribute('id', Guid.create() );
    }

    this.el = options.el;
};

var exports  = module.exports = Controls;

Controls.prototype.getElement = function (options) {
    return this.el;
};

