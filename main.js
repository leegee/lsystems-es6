var Lsys = require( "./lib/LsysParametricAMD.js" );

console.log( "%O", Lsys )

"use strict";

var LOGGER = console; // log4javascript.getLogger();
// var LOGGER = log4javascript.getDefaultLogger();
/*
        var appender = new log4javascript.BrowserConsoleAppender();
        // var popUpLayout = new log4javascript.PatternLayout("%d{HH:mm:ss} %-5p - %m%n");
        // appender.setLayout(popUpLayout);
         appender.setThreshold(log4javascript.Level.INFO);
         LOGGER.addAppender(appender);
        */

function playSound( audioURL ) {
	if ( document.all ) document.all[ 'BGSOUND_ID' ].src = audioURL;
	else document.getElementById( 'iplayer' ).setAttribute( 'src',
		'jsplayer.html?' + audioURL );
}

var presets = [ {
		title: 'Tree Balanced',
		variables: '',
		rules: 'X -> F[+X][-X]FX\n' +
			'F -> FF\n',
		start: 'X',
		angle: 50,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 10,
		turtle_step_y: 10,
		generations: 2,
		line_width: 2,
		wrap_angle_at: 0
	}, { // list all, even unused, keys on this first eleemnt
		title: 'Parametric test',
		variables: "#define $W 0.5\n" +
			"#define $AS  2\n" +
			"#define $BS  1\n" +
			"#define $R       1\n" +
			"#define $L  -1",
		rules: "F($s,$o) : $s == $AS && $o == $R -> F($AS,$L)F($BS,$R)\n" +
			"F($s,$o) : $s == $AS && $o == $L -> F($BS,$L)F($AS,$R)\n" +
			"F($s,$o) : $s == $BS                -> F($AS,$o)\n",
		start: "!($W)F($BS,$R)",
		angle: 22,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 4,
		turtle_step_y: 4,
		generations: 4,
		line_width: 4
	},

	{ // list all, even unused, keys on this first eleemnt
		title: 'Tree 1',
		variables: '',
		rules: 'F->C0FF-[C1-F+F+F]+[C2+F-F-F]',
		start: 'F',
		angle: 22,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 4,
		turtle_step_y: 4,
		generations: 5,
		line_width: 1,
		wrap_angle_at: 12
	}, {
		title: 'Tree x',
		variables: '',
		rules: "X->C0F-[C2[X]+C3X]+C1F[C3+FX]-X\nF->FF",
		start: 'X',
		angle: 27,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 8,
		turtle_step_y: 8,
		generations: 6,
		line_width: 3,
		wrap_angle_at: 12
	}, {
		title: 'Tree x',
		variables: '',
		rules: "X->C0F-[C2[X]+C3X]+C1F[C3+FX]-X\nF->FF",
		start: 'X',
		angle: 27,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 8,
		turtle_step_y: 8,
		generations: 6,
		line_width: 3,
		wrap_angle_at: 12
	}, {
		title: 'Sierpinski Median Curve (2 gens)',
		variables: '',
		rules: "L->+R-F-R+\nR->-L+F+L-",
		start: 'L--F--L--F',
		angle: 45,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 10,
		turtle_step_y: 10,
		generations: 2,
		line_width: 3,
		wrap_angle_at: 12
	}, {
		title: 'Sierpinski Median Curve (4 gens)',
		variables: '',
		rules: "L->+R-F-R+\nR->-L+F+L-",
		start: 'L--F--L--F',
		angle: 45,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 10,
		turtle_step_y: 10,
		generations: 4,
		line_width: 3,
		wrap_angle_at: 12
	}, {
		title: 'Koch Snowflake',
		variables: '',
		rules: "F->F-F++F-F\nX->FF",
		start: 'F++F++F',
		angle: 60,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 4,
		turtle_step_y: 4,
		generations: 4,
		line_width: 6,
		wrap_angle_at: 12
	}, {
		title: 'Tree 3',
		variables: '',
		rules: 'F -> FF-[-F+F]+[+F-F]',
		start: 'F',
		angle: 22,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 4,
		turtle_step_y: 4,
		generations: 5,
		wrap_angle_at: 12
	}, {
		title: 'Tree 4',
		variables: '',
		rules: "F -> F[-FF]F[+FF]F",
		start: 'F',
		angle: 22,
		init_x: 0,
		init_y: 0,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 4,
		turtle_step_y: 4,
		generations: 5,
		wrap_angle_at: 12
	}, {
		title: 'Dragon Curve',
		variables: '',
		rules: "X->X+YF\nY->FX-Y",
		start: 'FX',
		angle: 90,
		init_x: 800,
		init_y: 100,
		canvas_width: 1000,
		canvas_height: 1000,
		turtle_step_x: 5,
		turtle_step_y: 5,
		generations: 7,
		line_width: 8,
		wrap_angle_at: 12
	}
];

function preview() {
	document.getElementById( 'preview' ).innerHTML = '';
	var options = {};
	var override = {
		canvas_width: 200,
		canvas_height: 100,
		el: document.getElementById( 'preview' )
	};

	Object.keys( presets[ 0 ] ).forEach( function ( i ) {
		options[ i ] = document.getElementById( i ).value; // xx
	} );
	for ( var i in override ) {
		options[ i ] = override[ i ];
	}
	var lsys = new Lsys( options );
	lsys.generate( 1 );
	createMIDIonServer( lsys, 'preview' );
}

function loadPreset( idx ) {
	Object.keys( presets[ idx ] ).forEach( function ( i ) {
		try {
			document.getElementById( i ).setAttribute( 'value', presets[ idx ][ i ] );
		} catch ( e ) {
			alert( 'Could not set ' + i + '.value' );
		}
	} );
	document.getElementById( 'title' ).textContent = presets[ idx ].title;
	preview();
}

function createMIDIonServer( lsys, isPreview ) {
	console.warn( 'Port me' );
	return;
	if ( !lsys || !lsys.hasOwnProperty( 'content' ) ) {
		alert( 'Graph first, please' );
		return
	}
	try {
		new Request.JSON( {
			url: '/cgi-bin/fractal_plant_chords.cgi',
			onFailure: function ( e ) {
				alert( 'Not available from your IP' );
				console.log( e );
			},
			onComplete: function () {
				createMidi.setAttribute( 'value', 'Geneate MIDI' );
				createMidi.setAttribute( 'disabled', false );
			},
			onError: function ( e ) {
				document.getElementById( 'error' ).textContent = e;
				console.error( e );
				// playSound( "/cgi-output/cgi.midi" );
			},
			onSuccess: function ( res ) {
				document.getElementById( 'error' ).textContent = res.errors;
				if ( !res.errors ) {
					playSound( "/cgi-output/cgi.midi" );
				}
			}
		} ).post( {
			content: lsys.content,
			isPreview: isPreview,
			duration: document.getElementById( 'duration' ).value,
			angle: document.getElementById( 'angle' ).value,
			scale: document.getElementById( 'scale' ).value,
			wrap_angle_at: document.getElementById( 'wrap_angle_at' ).value,
			bracket_callback: document.getElementById( 'bracket_callback' ).value
		} )
	} catch ( e ) {
		console.error( e );
	}
}

function listPresets() {
	var docfrag = document.createDocumentFragment();
	presets.forEach( function ( i, j ) {
		var li = document.createElement( 'li' );
		li.textContent = i.title;
		li.id = 'preset_' + j;
		li.addEventListener( 'click', function ( e ) {
			loadPreset( e.target.id.substr( 7 ) );
		} ); // delegate these
		docfrag.appendChild( li );
	} );
	var ul = document.getElementById( 'presets' );
	ul.appendChild( docfrag );
}

// document.addEvent( 'domready', function () {

var lsys = null;
var midi = document.getElementById( 'midi' );
var createMidi = document.getElementById( 'createMidi' );
var el_canvases = document.getElementById( 'canvases' );
var contentDisplay = document.getElementById( 'contentDisplay' );
var generate = document.getElementById( 'generate' );

listPresets();

generate.addEventListener( 'click', function ( e ) {
	generate.setAttribute( 'value', 'Generating...' );
	generate.setAttribute( 'disabled', true );
	createMidi.setAttribute( 'disabled', true );

	var options = {};
	Object.keys( presets[ 0 ] ).forEach( function ( i ) {
		options[ i ] = document.getElementById( i ).value; // xx
	} );

	var display_rules = document.getElementById( 'rules' ).value; // xx
	display_rules = display_rules.replace( /->/g, '→' );
	var el_t = document.createElement( 'div' );
	el_t.setAttribute( 'class', 'timing' );
	el_t.textContent = new Date().getTime();
	el_canvases.appendChild( el_t );

	// el_canvases.adopt( el_t );
	options.el = el_canvases;

	lsys = new Lsys( options );
	lsys.generate( options.generations );

	el_t.textContent = 'Generated in ' +
		( new Date().getTime() - parseFloat( el_t.textContent ) ) + ' ms. ' +
		display_rules + ' ' + document.getElementById( 'angle' ).value + 'º/' +
		document.getElementById( 'wrap_angle_at' ).value // xx
	;

	contentDisplay.setAttribute( 'value', lsys.content );
	generate.setAttribute( 'value', 'Generate Graph' );
	generate.setAttribute( 'disabled', false );
	createMidi.setAttribute( 'value', 'Generate MIDI' );
	createMidi.setAttribute( 'disabled', false );
	return false;
} );

createMidi.addEventListener( 'click', function () {
	createMidi.setAttribute( 'value', 'Hang on...' );
	createMidi.setAttribute( 'disabled', true );
	createMIDIonServer( lsys );
	createMidi.setAttribute( 'disabled', false );
} );

loadPreset( 0 );
generate.click();
// } );
