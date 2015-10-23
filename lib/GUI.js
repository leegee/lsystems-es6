var GUID     = require('../lib/GUID'),
    Base     = require('../lib/Base'),
    Controls = require('../lib/Controls');

var GUI = function GUI (options) {
    options = options || {};
    this.setOptions(options);
    this.window = options.window || window;
    this.controls = [];
    this.lsystems = [];
};

var exports  = module.exports = GUI;
exports.prototype = Object.create( Base.prototype );
exports.prototype.constructor = GUI;

GUI.prototype.lsystems = [];

GUI.prototype.addLsys = function (Lsys, options) {
    options = options || {};
    var lsysOptions = {};
    Object.keys(options).forEach(function (i) {
        lsysOptions[ i ] = options[ i ];
    });

    if (! lsysOptions.hasOwnProperty('canvas')){
        lsysOptions.canvas = this.window.document.createElement( 'canvas' );
        lsysOptions.canvas.setAttribute('id', new GUID().create() );
        this.window.document.body.appendChild( lsysOptions.canvas );
        this.window.document.getElementsByTagName( 'body' )[ 0 ].appendChild( lsysOptions.canvas );
    }
    else {
        throw new Error('!')
    }

    var lsys = new Lsys( lsysOptions );

    var controls = new Controls({
        window: this.window,
        lsys: lsys
    });

    this.window.document.body.appendChild(
        controls.getElement()
    );

    this.lsystems.push( lsys );
    this.controls.push( controls );
};

GUI.prototype.run = function (options) {
    options = options || {};
    this.lsystems.forEach( function (lsys) {
        var generations = options.totalGenerations || lsys.options.totalGenerations || 2 ;
        lsys.generate( generations );
    });
};






