var GUID     = require('../lib/GUID');

var Controls = function Controls (options) {};
var exports  = module.exports = Controls;

var Guid = new GUID();

Controls.prototype.addToDom = function (options) {
    options = options || {};
    var div;

    if (! options.hasOwnProperty('div')){
        options.div = window.document.createElement( 'div' );
    }

    if (! options.div.getAttribute('id')){
        options.div.setAttribute('id', Guid.create() );
    }
};
