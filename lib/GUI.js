var GUID     = require('../lib/GUID');
var Controls = require('../lib/Controls');
var GUI      = function GUI (Lsys, options) {};
var exports  = module.exports = GUI;

GUI.prototype.lsystems = [];

GUI.prototype.addLsys = function (Lsys, options) {
    options = options || {};
    var canvas;

    if (! options.hasOwnProperty('canvas')){
        options.canvas = window.document.createElement( 'canvas' );
        options.canvas.setAttribute('id', new GUID() );
        window.document.body.appendChild( options.canvas );
        window.document.getElementsByTagName( 'body' )[ 0 ].appendChild( options.canvas );
    }

    options.controlsDiv = new Controls();

    var lsys = new Lsys( options );
    this.lsystems.push( lsys );
};

GUI.prototype.run = function (options) {
    options = options || {};
    this.lsystems.forEach( function (lsys) {
        lsys.generate( options.totalGenerations || lsys.options.totalGenerations || 1 );
    });
};






