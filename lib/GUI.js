var exports = module.exports = function GUI (Lsys, options) {
    this.options = options;

    if (this.options.hasOwnProperty('canvas')){
        this.canvas = this.options.canvas;
    }
    else {
        this.canvas = this.options.canvas = document.createElement( 'canvas' );
        document.getElementsByTagName( 'body' )[ 0 ].appendChild( this.canvas );
    }

    this.lsys = new Lsys( this.options );

    this.lsys.setCanvas( this.canvas );
};

exports.prototype.run = function (options) {
    options = options || {};
    this.lsys.generate( options.total_generations || this.options.total_generations || 1 );
};

// options.total_generations = 4;
// options.init_y = 100;
// lsys = new Lsys( options );
// lsys.generate( options.total_generations );






