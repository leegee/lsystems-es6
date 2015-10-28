"use strict";

var Lsys    = require( "../lib/LsysParametric/3d.js" );
var presets = require( "../lib/LsysParametric/Presets.js" );

var options = presets[ 0 ];
var body = ( document.getElementsByTagName( 'body' )[ 0 ] );
options.el = document.createElement( 'div' );
body.appendChild( options.el );

var lsys = new Lsys( options );
lsys.generate( options.generations );


// options.generations = 4;
// options.init_y = 100;
// lsys = new Lsys( options );
// lsys.generate( options.generations );
