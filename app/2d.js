"use strict";

var Lsys = require( "../lib/LsysParametric/2d.js" );
var presets = require( "../lib/LsysParametric/Presets.js" );


var config = presets[ 0 ];
config.canvas.width  = config.canvasWidth;
config.canvas.height = config.canvasHeight;

config.canvas = document.createElement( 'canvas' );
document.getElementsByTagName( 'body' )[ 0 ].appendChild( config.canvas );

var lsys = new Lsys( config );
lsys.generate();
