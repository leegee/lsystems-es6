var exports = module.exports = function GUI (Lsys, options) {

    this.options = options;
    this.lsys = new Lsys( Lsys, options );

    if (this.options.mainCanvas){
        this.mainCanvas = this.options.mainCanvas;
    }
    else {
        this.mainCanvas = document.createElement( 'canvas' );
        document.getElementsByTagName( 'body' )[ 0 ].appendChild( this.mainCanvas );
    }

    this.lsys.setCanvas( this.mainCanvas );
};

exports.prototype.run = function (options) {
    this.lsys.generate( config.total_generations );
};

// options.total_generations = 4;
// options.init_y = 100;
// lsys = new Lsys( options );
// lsys.generate( options.total_generations );






