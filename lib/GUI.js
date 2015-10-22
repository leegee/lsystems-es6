var GUID     = require('../lib/GUID'),
    Controls = require('../lib/Controls');

var GUI = function GUI (options) {
    this.window = options.window;
    this.controls = [];
    this.lsystems = [];
    if (typeof this.window === 'undefined'){
        throw new Error('No window option supplied');
    }
};

var exports  = module.exports = GUI;

GUI.prototype.lsystems = [];

GUI.prototype.addLsys = function (document, Lsys, options) {
    options = options || {};

    if (! options.hasOwnProperty('canvas')){
        options.canvas = this.window.document.createElement( 'canvas' );
        options.canvas.setAttribute('id', new GUID().create() );
        this.window.document.body.appendChild( options.canvas );
        this.window.document.getElementsByTagName( 'body' )[ 0 ].appendChild( options.canvas );
    }

    var controls = new Controls({
        window: this.window
    });

    this.window.document.body.appendChild(
        controls.getElement()
    );

    var lsys = new Lsys( options );

    this.lsystems.push( lsys );
    this.controls.push( controls );
};

GUI.prototype.run = function (options) {
    options = options || {};
    this.lsystems.forEach( function (lsys) {
        lsys.generate( options.totalGenerations || lsys.options.totalGenerations || 1 );
    });
};






