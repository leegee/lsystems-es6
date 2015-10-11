var GUI = function GUI (Lsys, options) {};
var exports = module.exports = GUI;

GUI.prototype.lsystems = [];

GUI.prototype.addLsys = function (Lsys, options) {
    var canvas;

    if (options.hasOwnProperty('canvas')){
        canvas = options.canvas;
    }
    else {
        canvas = window.document.createElement( 'canvas' );
        // document.body.appendChild( canvas );
        window.document.getElementsByTagName( 'body' )[ 0 ].appendChild( canvas );
    }

    var lsys = new Lsys( options );
    lsys.setCanvas( canvas );
    this.lsystems.push( lsys );
};

GUI.prototype.run = function (options) {
    options = options || {};
    this.lsys.generate( options.totalGenerations || this.options.totalGenerations || 1 );
};

// options.totalGenerations = 4;
// options.init_y = 100;
// lsys = new Lsys( options );
// lsys.generate( options.totalGenerations );






