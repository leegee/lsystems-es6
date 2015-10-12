var GUI = function GUI (Lsys, options) {};
var exports = module.exports = GUI;

GUI.prototype.lsystems = [];

GUI.prototype.addLsys = function (Lsys, options) {
    options = options || {};
    var canvas;

    if (! options.hasOwnProperty('canvas')){
        options.canvas = window.document.createElement( 'canvas' );
        window.document.body.appendChild( options.canvas );
        window.document.getElementsByTagName( 'body' )[ 0 ].appendChild( options.canvas );
    }

    var lsys = new Lsys( options );
    this.lsystems.push( lsys );
};

GUI.prototype.run = function (options) {
    options = options || {};
    this.lsystems.forEach( function (lsys) {
        lsys.generate( options.totalGenerations || lsys.options.totalGenerations || 1 );
    });
};

// options.totalGenerations = 4;
// options.init_y = 100;
// lsys = new Lsys( options );
// lsys.generate( options.totalGenerations );






