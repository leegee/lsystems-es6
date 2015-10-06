var exports = module.exports = function GUI (Lsys, options) {};

module.exports.lsystems = [];

module.exports.addLsys = function (Lsys, options) {
    var canvas;

    if (options.hasOwnProperty('canvas')){
        canvas = options.canvas;
    }
    else {
        canvas = document.createElement( 'canvas' );
        document.getElementsByTagName( 'body' )[ 0 ].appendChild( this.canvas );
    }

    var lsys = new Lsys( options );
    lsys.setCanvas( canvas );
    this.lsystems.push( lsys );
};

exports.prototype.run = function (options) {
    options = options || {};
    this.lsys.generate( options.total_generations || this.options.total_generations || 1 );
};

// options.total_generations = 4;
// options.init_y = 100;
// lsys = new Lsys( options );
// lsys.generate( options.total_generations );






