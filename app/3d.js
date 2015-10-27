"use strict";

// var logger = {};
// logger.trace = logger.log = logger.warn =
//  logger.debug = logger.info = function () {};
var Lsys = require( "../lib/3d.js" );

var presets = [

	{
		title: 'Weed',
		generations: 3,
		variables: '',
		start: 'X',
		rulesIn: 'X -> F[+X]F[-X]+X\nF->FF',
		angle: 20,
		init_x: 0,
		init_y: 0,
		canvasWidth: 100,
		canvasHeight: 100,
		turtleStepX: 1,
		turtleStepY: 2,
		wrapAngleAt: 0,
		lineWidthPixels: 1
	},

	{
		title: 'Kock Ring Squared',
		variables: '',
		rulesIn: 'F -> FF-F-F-F-FF\n',
		start: 'F-F-F-F',
		angle: 90,
		generations: 4,
		init_x: 1,
		init_y: 500,
		canvasWidth: 500,
		canvasHeight: 500,
		turtleStepX: 5,
		turtleStepY: 5,
		wrapAngleAt: 0,
		lineWidthPixels: 1
	},

	{
		title: 'Kock Ring',
		variables: '',
		rulesIn: 'F -> C0FF-F-F-F-F-FC1+F\n',
		start: 'F-F-F-F',
		angle: 90,
		generations: 4,
		init_x: 400,
		init_y: 400,
		canvasWidth: 500,
		canvasHeight: 500,
		turtleStepX: 2,
		turtleStepY: 2,
		wrapAngleAt: 0,
		lineWidthPixels: 1
	},

	{
		title: 'Tree Balanced',
		variables: '',
		rulesIn: 'X -> C0FF[+X][-X]C1FC2X\n' +
			'F -> FF\n',
		start: 'X',
		angle: 40,
		init_x: 0,
		init_y: 0,
		canvasWidth: 900,
		canvasHeight: 600,
		turtleStepX: 5,
		turtleStepY: 5,
		generations: 5,
		wrapAngleAt: 0,
		lineWidthPixels: 0.4,
		time_scale_lines: 5
	},

	{ // list all, even unused, keys on this first eleemnt
		title: 'Parametric test',
		variables: "#define $W 0.5\n" +
			"#define $AS  2\n" +
			"#define $BS  1\n" +
			"#define $R   1\n" +
			"#define $L  -1",
		rulesIn: "F($s,$o) : $s == $AS && $o == $R -> F($AS,$L)F($BS,$R)\n" +
			"F($s,$o) : $s == $AS && $o == $L -> F($BS,$L)F($AS,$R)\n" +
			"F($s,$o) : $s == $BS                -> F($AS,$o)\n",
		start: "!($W)F($BS,$R)",
		angle: 22,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 4,
		turtleStepY: 4,
		generations: 4,
		lineWidthPixels: 4
	},

	{ // list all, even unused, keys on this first eleemnt
		title: 'Tree 1',
		variables: '',
		rulesIn: 'F->C0FF-[C1-F+F+F]+[C2+F-F-F]',
		start: 'F',
		angle: 22,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 4,
		turtleStepY: 4,
		generations: 5,
		lineWidthPixels: 1,
		wrapAngleAt: 12
	},

	{
		title: 'Tree x',
		variables: '',
		rulesIn: "X->C0F-[C2[X]+C3X]+C1F[C3+FX]-X\nF->FF",
		start: 'X',
		angle: 27,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 8,
		turtleStepY: 8,
		generations: 6,
		lineWidthPixels: 3,
		wrapAngleAt: 12
	}, {
		title: 'Tree x',
		variables: '',
		rulesIn: "X->C0F-[C2[X]+C3X]+C1F[C3+FX]-X\nF->FF",
		start: 'X',
		angle: 27,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 8,
		turtleStepY: 8,
		generations: 6,
		lineWidthPixels: 3,
		wrapAngleAt: 12
	},

	{
		title: 'Sierpinski Median Curve (2 gens)',
		variables: '',
		rulesIn: "L->+R-F-R+\nR->-L+F+L-",
		start: 'L--F--L--F',
		angle: 45,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 10,
		turtleStepY: 10,
		generations: 2,
		lineWidthPixels: 3,
		wrapAngleAt: 12
	},

	{
		title: 'Sierpinski Median Curve (4 gens)',
		variables: '',
		rulesIn: "L->+R-F-R+\nR->-L+F+L-",
		start: 'L--F--L--F',
		angle: 45,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 10,
		turtleStepY: 10,
		generations: 4,
		lineWidthPixels: 3,
		wrapAngleAt: 12
	},

	{
		title: 'Koch Snowflake',
		variables: '',
		rulesIn: "F->F-F++F-F\nX->FF",
		start: 'F++F++F',
		angle: 60,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 4,
		turtleStepY: 4,
		generations: 4,
		lineWidthPixels: 6,
		wrapAngleAt: 12
	},

	{
		title: 'Tree 3',
		variables: '',
		rulesIn: 'F -> FF-[-F+F]+[+F-F]',
		start: 'F',
		angle: 22,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 4,
		turtleStepY: 4,
		generations: 5,
		wrapAngleAt: 12
	},

	{
		title: 'Tree 4',
		variables: '',
		rulesIn: "F -> F[-FF]F[+FF]F",
		start: 'F',
		angle: 22,
		init_x: 0,
		init_y: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 4,
		turtleStepY: 4,
		generations: 5,
		wrapAngleAt: 12
	},

	{
		title: 'Dragon Curve',
		variables: '',
		rulesIn: "X->X+YF\nY->FX-Y",
		start: 'FX',
		angle: 90,
		init_x: 800,
		init_y: 100,
		init_z: 0,
		canvasWidth: 1000,
		canvasHeight: 1000,
		turtleStepX: 5,
		turtleStepY: 5,
		generations: 7,
		lineWidthPixels: 8,
		wrapAngleAt: 12
	}
];

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
