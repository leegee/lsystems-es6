(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/lee/src/lsys/htdocs/browsify/lib/LsysParametricAMD.js":[function(require,module,exports){
/*

#define W	0.5
#define AS 	 2
#define BS 	 1
#define R 	 1
#define L	-1


 w : !(W)F(BS,R)
p1 : F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R)
p2 : F(s,o) : s == AS && o == L -> F(BS,L)F(AS,R)
p3 : F(s,o) : s == BS	        -> F(AS,o)

p1 : F(s,o) : s == 2 && o ==  1 -> F(2,-1)F(1, 1)
p2 : F(s,o) : s == 2 && o == -1 -> F(1,-1)F(2, 1)
p3 : F(s,o) : s == 1 &&         -> F(2, o)

!(0.5)F(1,1)
!(0.5)F(2,1)
!(0.5)F(2,-1)F(1,1)
!(0.5)F(1,-1)F(2,1)F(2,1)

rule p2
F(1,-1)F(2,1)F(2,1)
rule p3

*/

const RAD = Math.PI / 180.0;

var log4javascript = console;
var LOGGER = console; // LOGGER || log4javascript.getLogger();
LOGGER.trace = console.debug;
if ( !console ) {
	console = {};
	console.log = console.warn = console.debug = console.info = function () {};
}

var exports = module.exports = function Lsys( options ) {
	this.options = {
		start: 'F',
		variables: '',
		rules: null,
		merge_duplicates: 1,
		duration: 48,
		scale: 'pentatonic',
		initial_note_decimal: 58,
		canvas_width: 2000,
		canvas_height: 800,
		angle: 30,
		turtle_step_x: 10,
		turtle_step_y: 10,
		init_x: null,
		init_y: null,
		line_width: 1,
		time_scale_lines: 0,
		clearCanvas: false,
		colours: [
			//			"rgba(244, 0, 0, 0.75)",
			//			"rgba(0, 244, 0, 0.75)",
			//			"rgba(0, 0, 244, 0.75)",

			"rgba(130,  90, 70, 0.8)",
			"rgba( 33, 180, 24, 0.6)",
			"rgba( 50, 210, 50, 0.5)",
			"rgba( 70, 255, 70, 0.4)"
		]
	};

	for ( var i in this.options ) {
		if ( options.hasOwnProperty( i ) ) {
			this.options[ i ] = options[ i ];
		};
	}

	this.xoffset = 0;
	this.yoffset = 0;
	this.generation = 0;
	this.total_generations = 0;
	this.variables = null;
	this.interpolateVarsRe = null;

	this.initialize( options );
};

exports.prototype.initialize = function ( options ) {
	this.setOptions( options );
	this.castRules();
	this.castVariables();
	this.interpolateVarsRe = new RegExp( /(\$\w+)/g );

	LOGGER.info( 'Variables: ' );
	LOGGER.info( this.variables );
	LOGGER.info( 'Rules: ' );
	LOGGER.info( this.options.rules );

	this.canvas = this.options.canvas;
	this.canvas.id = 'canvas';

	this.colour = this.options.colours[ 0 ];
	this.content = '';
	this.x = this.options.init_x || 0;
	this.y = this.options.init_y || this.canvas.height / 2;
	this.max_x = 0;
	this.max_y = 0;
	this.min_x = 0;
	this.min_y = 0;
	this.ctx = this.canvas.getContext( "2d" );
};

exports.prototype.setOptions = function ( options ) {
	var self = this;
	options = options || {};
	if ( typeof options !== 'object' ) {
		throw new TypeError( 'options was not an object, %O', options );
	}
	Object.keys( options )
		.forEach( function ( i ) {
			// Cast string to number
			if ( typeof options[ i ] === 'string' && options[ i ].match(
				/^\s*[.\d+]+\s*$/ ) ) {
				options[ i ] = parseInt( options[ i ] );
			}
			self.options[ i ] = options[ i ];
		} );
};

exports.prototype.castVariables = function ( str ) {
	str = str || this.options.variables;
	if ( !str ) return;
	var rv = {};
	str.split( /[\n\r\f]+/ )
		.forEach( function ( line ) {
			// Detect
			var name2val = line.match( /^\s*(#define)?\s*(\$\w+)\s*(\S+)\s*$/ );
			// Store
			if ( name2val ) {
				rv[ name2val[ 2 ] ] = name2val[ 3 ];
				// Cast
				if ( rv[ name2val[ 2 ] ].match( /^(-+)?\d+(\.\d+)?$/ ) )
					rv[ name2val[ 2 ] ] = parseFloat( rv[ name2val[ 2 ] ] );
			} else {
				throw ( "Bad variable definition:\n" + name2val + "\non line: \n" +
					line );
			}
		} );
	this.variables = rv;
	return rv;
};

/* Creates a strucure as follows:
	[ [to_match, condition, substitution ], ...]
	*/
exports.prototype.castRules = function ( str ) {
	str = str || this.options.rules;
	var rv = [];
	// F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R) \n

	str.split( /[\n\r\f]+/ )
		.forEach( function ( line ) {
			if ( line == '' ) return;
			var head_tail = line.match(
				/^\s*(.+?)\s*->\s*([^\n\r\f]+)\s*/
			);

			if ( head_tail != null ) {
				var match_condition = head_tail[ 1 ].match(
					/([^:]+)\s*:?\s*(.*?)\s*$/
				);
				var head = match_condition[ 1 ].match( /^(.+?)\s*$/ );
				var rule = [
					head[ 1 ],
					match_condition[ 2 ],
					head_tail[ 2 ]
				];
			} else {
				throw ( 'Parse error ' + line );
			}
			rv.push( rule );
		} );

	this.options.rules = rv;
	return rv;
};

exports.prototype.dsin = function ( radians ) {
	return Math.sin( radians * RAD )
};

exports.prototype.dcos = function ( radians ) {
	return Math.cos( radians * RAD )
};

exports.prototype.generate = function ( generations ) {
	this.total_generations = generations;
	LOGGER.debug( 'Enter generate for ' + this.total_generations +
		' generations' );

	this.content = this.options.start;
	this.content = this.interploateVars( this.content );

	for (
		this.generation = 1; this.generation <= this.total_generations; this.generation++
	) {
		this.apply_rules();
	}

	// Translate context to center of canvas:
	this.ctx.translate( 0, this.canvas.height );
	// Flip context vertically
	this.ctx.scale( 1, -1 );

	this.render();
	// this.resize();
	this.finalise();
	LOGGER.debug( 'Leave generate -------------------------' );
	return this;
};

exports.prototype.interploateVars = function ( str ) {
	var self = this;
	var rv = str.replace(
		this.interpolateVarsRe,
		function ( match ) {
			return ( typeof self.variables[ match ] != 'undefined' ) ?
				self.variables[ match ] : match;
		}
	);
	LOGGER.trace( 'Interpolate vars: ' + str + ' ...... ' + rv );
	return rv;
};

exports.prototype.string2reAndArgNames = function ( str ) {
	var self = this;
	var argNames = [];
	this.str2reRe = new RegExp( /(\w+)\(([^\)]+)\)/ );
	var rv = str.replace(
		this.str2reRe,
		function ( match, varname, argsCsv ) {
			argNames = argsCsv.split( /\s*,\s*/ );
			// Could cache these based on args.length:
			return '(' + varname + ')\\(' + argNames.map( function () {
				return '([\\$\\w-]+)'
			} ) + '\\)';
		}
	);
	return [
		new RegExp( rv, 'g' ),
		argNames
	];
};

exports.prototype.apply_rules = function () {
	var self = this;
	LOGGER.debug( 'Enter apply_rules for generation ' + this.generation );

	var finalContent = '';

	// Itterate over atoms within the content?
	var atoms = self.content.match( /(.(\([^)]+\))?)/g );
	if ( self.content != atoms.join( '' ) ) {
		LOGGER.ERROR( atoms );
		LOGGER.ERROR( 'atoms ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^' );
		alert( 'Atomic regex failed, results will be wrong' );
	}

	atoms.forEach( function ( atom ) {
		// Run production rules:
		var ruleNumber = 0;
		var ruleSuccessfullyApplied = false;

		self.options.rules.forEach( function ( rule ) {
			ruleNumber++;

			if ( ruleSuccessfullyApplied ) {
				LOGGER.debug( 'Skip rule ' + ruleNumber +
					' as have made substituion' );
				return;
			}

			// Re-write the rule to replace variables with literals, where possible:
			var _ = self.string2reAndArgNames( rule[ 0 ] );
			var rule2findRe = _[ 0 ];
			var ruleArgNames = _[ 1 ];
			LOGGER.debug( 'Rule ' + ruleNumber + ' says find ' + rule[ 0 ] +
				' in content of ' + atom );

			// Find the rule pattern (left-hand side of condition)
			// and replace if condition is met
			var atomAfterRuleApplied = atom.replace(
				rule2findRe,
				function replacement( original ) {
					/*  On entering this function, a match has been found
                            but rules have yet to be tested
                        */
					// Ascribe variables
					for ( var i = 2; i < arguments.length - 2; i++ ) {
						LOGGER.debug( "Let " + ruleArgNames[ i - 2 ] + ' = ' + arguments[
							i ] );
						// Set variables with values found
						self.variables[ ruleArgNames[ i - 2 ] ] = arguments[ i ];
					}

					// Get the rule code:
					var ruleConditionJs = self.interploateVars( rule[ 1 ] );
					LOGGER.debug( 'Rule ' + ruleNumber + ' condition: ' +
						ruleConditionJs );

					// Decide if the substitution take place
					var ruleConditionMet = ruleConditionJs.length == 0 ?
						true : eval( ruleConditionJs );

					// No substitutions
					if ( !ruleConditionMet ) {
						LOGGER.trace( 'Condition not met' );
						return original;
					}

					ruleSuccessfullyApplied = true;
					var substituted = self.interploateVars( rule[ 2 ] );
					LOGGER.debug(
						'Condition met:------> substituted result = ' + rule[ 2 ] +
						'  RV== ' + substituted
					);

					return substituted;
				} // end of replacement function
			); // end of replacement call

			// If the rule is not met, the replacement value will be undefined,
			// do not write this into the string:
			if ( ruleSuccessfullyApplied ) {
				atom = atomAfterRuleApplied;
				LOGGER.debug( 'After fulfilled rule ' + ruleNumber +
					' was applied, atom is: ' + atom );
				return;
			}

		} ); // Next rule

		finalContent += atom;
	} ); // Next atom

	self.content = finalContent;

	LOGGER.debug( 'After all rules were applied, content is: ', self.content );
	LOGGER.debug(
		'# FINAL for generation ' + this.generation + '/' + this.total_generations +
		' ############################ Content: ' + self.content
	);
};

exports.prototype.render = function () {
	var dir = 0;
	var states = [];
	this.stepped = 0;

	// PRODUCTION_RULES:
	for ( var i = 0; i < this.content.length; i++ ) {
		var draw = true;
		this.penUp = false;
		// LOGGER.debug( 'Do '+i);
		switch ( this.content.charAt( i )
			.toLowerCase() ) {
		case 'g':
			var getGenNumber = new RegExp( '.{' + i + '}(\\d+)' );
			this.generation = getGenNumber.exec( this.content );
			this.generation = this.generation ?
				parseInt( this.generation[ 1 ] ) : null;
			i += ( "" + this.generation )
				.length;
			console.log( '---> Set Generation ' + this.generation );
			break;
		case 'f':
			// this.penUp = true; why pen up going forards? nuts.
			break;
		case 'c':
			this.setColour( parseInt( this.content.charAt( ++i ), 10 ) );
			draw = false;
			break;
		case '+':
			dir += this.options.angle;
			break;
		case '-':
			dir -= this.options.angle;
			break;
		case '[':
			states.push( [ dir, this.x, this.y, this.colour, this.stepped ] );
			draw = false;
			break;
		case ']':
			var state = states.pop();
			dir = state[ 0 ];
			this.x = state[ 1 ];
			this.y = state[ 2 ];
			this.colour = state[ 3 ];
			this.stepped = state[ 4 ];
			draw = true;
			break;
		};

		if ( draw ) {
			this.turtle_graph( dir );
			this.stepped++;
		}
	}
	LOGGER.info( 'Leave default_generate_callback' );
};

exports.prototype.finalise = function () {
	LOGGER.debug( 'Finalised' );
};

exports.prototype.turtle_graph = function ( dir ) {
	// LOGGER.debug( 'Move '+dir +' from '+this.x+','+this.y );

	this.ctx.beginPath();
	if ( this.options.time_scale_lines > 0 ) {
		var w = ( this.options.time_scale_lines * this.total_generations ) - ( this.stepped * this.options.line_width );
		if ( parseInt( w ) < 1 ) {
			w = 1;
		}
		this.ctx.lineWidth = w;
		// console.log( 'this.stepped=%d,  LINE WIDTH: %d', this.stepped, this.ctx.lineWidth )

	} else if ( this.options.line_width ) {
		this.ctx.lineWidth = this.options.line_width
	}
	this.ctx.moveTo( this.x, this.y );

	this.x += ( this.dcos( dir ) * this.options.turtle_step_x );
	this.y += ( this.dsin( dir ) * this.options.turtle_step_y );

	this.x += this.xoffset;
	this.y += this.yoffset;

	if ( this.x > this.max_x ) this.max_x = this.x;
	if ( this.y > this.max_y ) this.max_y = this.y;
	if ( this.x < this.min_x ) this.min_x = this.x;
	if ( this.y < this.min_y ) this.min_y = this.y;

	this.ctx.lineTo( this.x, this.y );
	this.ctx.closePath();
	if ( !this.penUp ) this.ctx.stroke();
	// LOGGER.debug( '...to '+this.x+','+this.y );
};

exports.prototype.setColour = function ( index ) {
	this.colour = this.options.colours[ index ];
	this.ctx.strokeStyle = this.colour;
};

exports.prototype.resize = function () {
	console.warn( 'not resizing' );
	return;
	LOGGER.debug( this.min_x + '->' + this.max_x );
	LOGGER.debug( this.min_y + '->' + this.max_y );
	var wi = Math.abs( this.min_x ) + this.max_x;
	var hi = Math.abs( this.min_y ) + this.max_y;
	LOGGER.debug( this.canvas.width + ',' + this.canvas.height );
	LOGGER.debug( wi + ',' + hi );
	var sx = this.canvas.width / wi;
	var sy = this.canvas.height / hi;
	LOGGER.debug( 'Scale: ' + sx + ',' + sy );

	if ( this.options.clearCanvas ) {
		this.canvas.width = this.canvas.width;
	}

	this.ctx.scale( sx, sy );
	this.ctx.translate(
		this.options.turtle_step_x,
		this.options.turtle_step_y * -1
	);

	this.x = this.options.init_x || 0; // this.options.turtle_step_x || 0;
	this.y = this.options.init_y || this.options.canvas_height / 2;
	this.y -= this.min_y;
	this.render();
};

},{}],"/Users/lee/src/lsys/htdocs/browsify/spec/tests.js":[function(require,module,exports){
/*	t/parametric.js - qUnit test - v0.2

	Documentation via docco, hence single-line comments.
	1 tab == 4 spaces
*/

// Test the addition of parameters to the L1 L-system
// ==================================================
//
// Test case from Hanan, 1992
// --------------------------
// 	#define W	0.5
// 	#define AS 	 2
// 	#define BS 	 1
// 	#define R 	 1
// 	#define L	-1
//
//	  w : !(W)F(BS,R)
//	 p1 : F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R)
//	 p2 : F(s,o) : s == AS && o == L -> F(BS,L)F(AS,R)
//	 p3 : F(s,o) : s == BS	        -> F(AS,o)
//
// Dry-run Test Results
// ====================
//
//	 p1 : F(s,o) : s == 2 && o ==  1 -> F(2,-1)F(1, 1)
//	 p2 : F(s,o) : s == 2 && o == -1 -> F(1,-1)F(2, 1)
//	 p3 : F(s,o) : s == 1 &&         -> F(2, o)
//
// Dry-run Output
// ==============
//
//	 !(0.5)F(1,1)
//	 !(0.5)F(2,1)
//	 !(0.5)F(2,-1)F(1,1)
//	 !(0.5)F(1,-1)F(2,1)F(2,1)
//	 !(0.5)F(2-,1)F(2,-1)F(1,1)F(2,-1)F(1,1)
//

// var LOGGER = log4javascript.getLogger();
// Logs to the console, not to the default pop-up:
// var appender = new log4javascript.BrowserConsoleAppender();
// Log-level raised after development complete:
// appender.setThreshold(log4javascript.Level.ERROR);
// LOGGER.addAppender(appender);

"use strict";
var Lsys = require( "../lib/LsysParametricAMD.js" );
alert( Qunit );
var LOGGER = console; // log4javascript.getLogger();


// The content expected for the generation:
var expectContent = [
	'!(0.5)F(1,1)',
	'!(0.5)F(2,1)',
	'!(0.5)F(2,-1)F(1,1)',
	'!(0.5)F(1,-1)F(2,1)F(2,1)',
	'!(0.5)F(2,-1)F(2,-1)F(1,1)F(2,-1)F(1,1)'
];

// These options are fixed for every test:
var defaultOptions = {
	// An element into which the Lsys canvas can be inserted:
	el: document.newElement( 'div' ),
	variables: "#define $W	  0.5\n" + "#define $AS  2\n" + "#define $BS  1\n" + "#define $R   1\n" + "#define $L	 -1",
	rules: "F($s,$o) : $s == $AS && $o == $R -> F($AS,$L)F($BS,$R)\n" + "F($s,$o) : $s == $AS && $o == $L -> F($BS,$L)F($AS,$R)\n" + "F($s,$o) : $s == $BS	           -> F($AS,$o)\n",
	// Axiom
	start: "!($W)F($BS,$R)"
};

test( 'Constructed with old args', function () {
	var oldOptions = Object.clone( defaultOptions );
	delete oldOptions.variables;
	var lsys = new Lsys( oldOptions );
	equal( typeof lsys, "object", "Construted Lsys object" );
} );

test( 'Constructed with new parametric args', function () {
	var lsys = new Lsys( defaultOptions );
	equal( typeof lsys, "object", "Construted Lsys object" );

	// NB MooTools, not native:
	equal( typeOf( lsys.options.rules ), 'array', 'Rules array' );
	lsys.options.rules.each( function ( i ) {
		equal( typeOf( i ), 'array', 'Rule cast' );
		equal( i.length, 3, 'rule tuple' );
	} );

	deepEqual(
		lsys.options.rules, [
			[ "F($s,$o)", "$s == $AS && $o == $R", "F($AS,$L)F($BS,$R)" ],
			[ "F($s,$o)", "$s == $AS && $o == $L", "F($BS,$L)F($AS,$R)" ],
			[ "F($s,$o)", "$s == $BS", "F($AS,$o)" ]
		],
		'Rules parsed'
	);
} );

test( 'Interploation', function () {
	equal(
		new Lsys( defaultOptions )
		.interploateVars( '$AS' ),
		2,
		'Interpolate variable'
	);
} );

test( 'string to re and arg name', function () {
	var rv = new Lsys( defaultOptions )
		.string2reAndArgNames( 'F(s,o)' );
	equal( typeOf( rv ), 'array', 'rv type' );
	equal( rv.length, 2, 'rv length' );
	equal( typeOf( rv[ 0 ] ), 'regexp', 'rv regexp' );
	var varWord = '([\\$\\w-]+)';
	equal( rv[ 0 ], '/(F)\\(' + varWord + ',' + varWord + '\\)/g', 'rv regexp' );
	equal( typeOf( rv[ 1 ] ), 'array', 'rv var names type' );
	deepEqual( rv[ 1 ], [ 's', 'o' ], 'rv var names value' );
} );

test( 'Constructor with bad rules', function () {
	var badOptions = Object.clone( defaultOptions );
	badOptions.rules = 'This is not a rule.';
	try {
		var lsys = new Lsys( badOptions );
	} catch ( e ) {
		ok( e.match( /parse error/gi ), 'Bad rule parse error thrown' );
	}
} );

test( 'Bad variables option', function () {
	var badOptions = Object.clone( defaultOptions );
	badOptions.variables = 'This is not a variable definition.';
	try {
		var lsys = new Lsys( badOptions );
	} catch ( e ) {
		console.log( e );
		ok(
			e.match( /variable def/gi ),
			'Bad variable parse error thrown as hoped'
		);
	}
} );

test( 'Variable parsing', function () {
	var varOpts = Object.clone( defaultOptions );
	varOpts.variables += "\n#define $Test -0.5";
	var lsys = new Lsys( varOpts );
	equal( lsys.variables.$AS, 2, 'positive int' );
	equal( lsys.variables.$L, -1, 'negative int' );
	equal( lsys.variables.$W, 0.5, 'positive float' );
	equal( lsys.variables.$Test, -0.5, 'negative float' );
} );

test( 'Math routines', function () {
	var lsys = new Lsys( defaultOptions );
	equal( lsys.dsin( 1 ), 0.01745240643728351, 'sin' );
	equal( lsys.dcos( 1 ), 0.9998476951563913, 'sin' );
} );

// ## Generate content

test( 'Generated content', function () {
	// Test each generation
	for ( var g = 1; g < expectContent.length; g++ ) {
		// Let not an error stop the next test
		try {
			var lsys = new Lsys( defaultOptions );
			lsys.generate( g );
			equal( lsys.generation, g, 'lsys.generation ' + g );
			equal( lsys.total_generations, g, 'total_generations ' + g );
			equal( lsys.content, expectContent[ g ], 'content ' + g );
		} catch ( e ) {
			LOGGER.error( e )
		}
	}
} );

},{"../lib/LsysParametricAMD.js":"/Users/lee/src/lsys/htdocs/browsify/lib/LsysParametricAMD.js"}]},{},["/Users/lee/src/lsys/htdocs/browsify/spec/tests.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2xlZS9zcmMvbHN5cy9odGRvY3MvYnJvd3NpZnkvbGliL0xzeXNQYXJhbWV0cmljQU1ELmpzIiwiL1VzZXJzL2xlZS9zcmMvbHN5cy9odGRvY3MvYnJvd3NpZnkvc3BlYy90ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG5cbiNkZWZpbmUgV1x0MC41XG4jZGVmaW5lIEFTIFx0IDJcbiNkZWZpbmUgQlMgXHQgMVxuI2RlZmluZSBSIFx0IDFcbiNkZWZpbmUgTFx0LTFcblxuXG4gdyA6ICEoVylGKEJTLFIpXG5wMSA6IEYocyxvKSA6IHMgPT0gQVMgJiYgbyA9PSBSIC0+IEYoQVMsTClGKEJTLFIpXG5wMiA6IEYocyxvKSA6IHMgPT0gQVMgJiYgbyA9PSBMIC0+IEYoQlMsTClGKEFTLFIpXG5wMyA6IEYocyxvKSA6IHMgPT0gQlNcdCAgICAgICAgLT4gRihBUyxvKVxuXG5wMSA6IEYocyxvKSA6IHMgPT0gMiAmJiBvID09ICAxIC0+IEYoMiwtMSlGKDEsIDEpXG5wMiA6IEYocyxvKSA6IHMgPT0gMiAmJiBvID09IC0xIC0+IEYoMSwtMSlGKDIsIDEpXG5wMyA6IEYocyxvKSA6IHMgPT0gMSAmJiAgICAgICAgIC0+IEYoMiwgbylcblxuISgwLjUpRigxLDEpXG4hKDAuNSlGKDIsMSlcbiEoMC41KUYoMiwtMSlGKDEsMSlcbiEoMC41KUYoMSwtMSlGKDIsMSlGKDIsMSlcblxucnVsZSBwMlxuRigxLC0xKUYoMiwxKUYoMiwxKVxucnVsZSBwM1xuXG4qL1xuXG5jb25zdCBSQUQgPSBNYXRoLlBJIC8gMTgwLjA7XG5cbnZhciBsb2c0amF2YXNjcmlwdCA9IGNvbnNvbGU7XG52YXIgTE9HR0VSID0gY29uc29sZTsgLy8gTE9HR0VSIHx8IGxvZzRqYXZhc2NyaXB0LmdldExvZ2dlcigpO1xuTE9HR0VSLnRyYWNlID0gY29uc29sZS5kZWJ1ZztcbmlmICggIWNvbnNvbGUgKSB7XG5cdGNvbnNvbGUgPSB7fTtcblx0Y29uc29sZS5sb2cgPSBjb25zb2xlLndhcm4gPSBjb25zb2xlLmRlYnVnID0gY29uc29sZS5pbmZvID0gZnVuY3Rpb24gKCkge307XG59XG5cbnZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBMc3lzKCBvcHRpb25zICkge1xuXHR0aGlzLm9wdGlvbnMgPSB7XG5cdFx0c3RhcnQ6ICdGJyxcblx0XHR2YXJpYWJsZXM6ICcnLFxuXHRcdHJ1bGVzOiBudWxsLFxuXHRcdG1lcmdlX2R1cGxpY2F0ZXM6IDEsXG5cdFx0ZHVyYXRpb246IDQ4LFxuXHRcdHNjYWxlOiAncGVudGF0b25pYycsXG5cdFx0aW5pdGlhbF9ub3RlX2RlY2ltYWw6IDU4LFxuXHRcdGNhbnZhc193aWR0aDogMjAwMCxcblx0XHRjYW52YXNfaGVpZ2h0OiA4MDAsXG5cdFx0YW5nbGU6IDMwLFxuXHRcdHR1cnRsZV9zdGVwX3g6IDEwLFxuXHRcdHR1cnRsZV9zdGVwX3k6IDEwLFxuXHRcdGluaXRfeDogbnVsbCxcblx0XHRpbml0X3k6IG51bGwsXG5cdFx0bGluZV93aWR0aDogMSxcblx0XHR0aW1lX3NjYWxlX2xpbmVzOiAwLFxuXHRcdGNsZWFyQ2FudmFzOiBmYWxzZSxcblx0XHRjb2xvdXJzOiBbXG5cdFx0XHQvL1x0XHRcdFwicmdiYSgyNDQsIDAsIDAsIDAuNzUpXCIsXG5cdFx0XHQvL1x0XHRcdFwicmdiYSgwLCAyNDQsIDAsIDAuNzUpXCIsXG5cdFx0XHQvL1x0XHRcdFwicmdiYSgwLCAwLCAyNDQsIDAuNzUpXCIsXG5cblx0XHRcdFwicmdiYSgxMzAsICA5MCwgNzAsIDAuOClcIixcblx0XHRcdFwicmdiYSggMzMsIDE4MCwgMjQsIDAuNilcIixcblx0XHRcdFwicmdiYSggNTAsIDIxMCwgNTAsIDAuNSlcIixcblx0XHRcdFwicmdiYSggNzAsIDI1NSwgNzAsIDAuNClcIlxuXHRcdF1cblx0fTtcblxuXHRmb3IgKCB2YXIgaSBpbiB0aGlzLm9wdGlvbnMgKSB7XG5cdFx0aWYgKCBvcHRpb25zLmhhc093blByb3BlcnR5KCBpICkgKSB7XG5cdFx0XHR0aGlzLm9wdGlvbnNbIGkgXSA9IG9wdGlvbnNbIGkgXTtcblx0XHR9O1xuXHR9XG5cblx0dGhpcy54b2Zmc2V0ID0gMDtcblx0dGhpcy55b2Zmc2V0ID0gMDtcblx0dGhpcy5nZW5lcmF0aW9uID0gMDtcblx0dGhpcy50b3RhbF9nZW5lcmF0aW9ucyA9IDA7XG5cdHRoaXMudmFyaWFibGVzID0gbnVsbDtcblx0dGhpcy5pbnRlcnBvbGF0ZVZhcnNSZSA9IG51bGw7XG5cblx0dGhpcy5pbml0aWFsaXplKCBvcHRpb25zICk7XG59O1xuXG5leHBvcnRzLnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24gKCBvcHRpb25zICkge1xuXHR0aGlzLnNldE9wdGlvbnMoIG9wdGlvbnMgKTtcblx0dGhpcy5jYXN0UnVsZXMoKTtcblx0dGhpcy5jYXN0VmFyaWFibGVzKCk7XG5cdHRoaXMuaW50ZXJwb2xhdGVWYXJzUmUgPSBuZXcgUmVnRXhwKCAvKFxcJFxcdyspL2cgKTtcblxuXHRMT0dHRVIuaW5mbyggJ1ZhcmlhYmxlczogJyApO1xuXHRMT0dHRVIuaW5mbyggdGhpcy52YXJpYWJsZXMgKTtcblx0TE9HR0VSLmluZm8oICdSdWxlczogJyApO1xuXHRMT0dHRVIuaW5mbyggdGhpcy5vcHRpb25zLnJ1bGVzICk7XG5cblx0dGhpcy5jYW52YXMgPSB0aGlzLm9wdGlvbnMuY2FudmFzO1xuXHR0aGlzLmNhbnZhcy5pZCA9ICdjYW52YXMnO1xuXG5cdHRoaXMuY29sb3VyID0gdGhpcy5vcHRpb25zLmNvbG91cnNbIDAgXTtcblx0dGhpcy5jb250ZW50ID0gJyc7XG5cdHRoaXMueCA9IHRoaXMub3B0aW9ucy5pbml0X3ggfHwgMDtcblx0dGhpcy55ID0gdGhpcy5vcHRpb25zLmluaXRfeSB8fCB0aGlzLmNhbnZhcy5oZWlnaHQgLyAyO1xuXHR0aGlzLm1heF94ID0gMDtcblx0dGhpcy5tYXhfeSA9IDA7XG5cdHRoaXMubWluX3ggPSAwO1xuXHR0aGlzLm1pbl95ID0gMDtcblx0dGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCBcIjJkXCIgKTtcbn07XG5cbmV4cG9ydHMucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAoIG9wdGlvbnMgKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdGlmICggdHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnICkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoICdvcHRpb25zIHdhcyBub3QgYW4gb2JqZWN0LCAlTycsIG9wdGlvbnMgKTtcblx0fVxuXHRPYmplY3Qua2V5cyggb3B0aW9ucyApXG5cdFx0LmZvckVhY2goIGZ1bmN0aW9uICggaSApIHtcblx0XHRcdC8vIENhc3Qgc3RyaW5nIHRvIG51bWJlclxuXHRcdFx0aWYgKCB0eXBlb2Ygb3B0aW9uc1sgaSBdID09PSAnc3RyaW5nJyAmJiBvcHRpb25zWyBpIF0ubWF0Y2goXG5cdFx0XHRcdC9eXFxzKlsuXFxkK10rXFxzKiQvICkgKSB7XG5cdFx0XHRcdG9wdGlvbnNbIGkgXSA9IHBhcnNlSW50KCBvcHRpb25zWyBpIF0gKTtcblx0XHRcdH1cblx0XHRcdHNlbGYub3B0aW9uc1sgaSBdID0gb3B0aW9uc1sgaSBdO1xuXHRcdH0gKTtcbn07XG5cbmV4cG9ydHMucHJvdG90eXBlLmNhc3RWYXJpYWJsZXMgPSBmdW5jdGlvbiAoIHN0ciApIHtcblx0c3RyID0gc3RyIHx8IHRoaXMub3B0aW9ucy52YXJpYWJsZXM7XG5cdGlmICggIXN0ciApIHJldHVybjtcblx0dmFyIHJ2ID0ge307XG5cdHN0ci5zcGxpdCggL1tcXG5cXHJcXGZdKy8gKVxuXHRcdC5mb3JFYWNoKCBmdW5jdGlvbiAoIGxpbmUgKSB7XG5cdFx0XHQvLyBEZXRlY3Rcblx0XHRcdHZhciBuYW1lMnZhbCA9IGxpbmUubWF0Y2goIC9eXFxzKigjZGVmaW5lKT9cXHMqKFxcJFxcdyspXFxzKihcXFMrKVxccyokLyApO1xuXHRcdFx0Ly8gU3RvcmVcblx0XHRcdGlmICggbmFtZTJ2YWwgKSB7XG5cdFx0XHRcdHJ2WyBuYW1lMnZhbFsgMiBdIF0gPSBuYW1lMnZhbFsgMyBdO1xuXHRcdFx0XHQvLyBDYXN0XG5cdFx0XHRcdGlmICggcnZbIG5hbWUydmFsWyAyIF0gXS5tYXRjaCggL14oLSspP1xcZCsoXFwuXFxkKyk/JC8gKSApXG5cdFx0XHRcdFx0cnZbIG5hbWUydmFsWyAyIF0gXSA9IHBhcnNlRmxvYXQoIHJ2WyBuYW1lMnZhbFsgMiBdIF0gKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICggXCJCYWQgdmFyaWFibGUgZGVmaW5pdGlvbjpcXG5cIiArIG5hbWUydmFsICsgXCJcXG5vbiBsaW5lOiBcXG5cIiArXG5cdFx0XHRcdFx0bGluZSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0dGhpcy52YXJpYWJsZXMgPSBydjtcblx0cmV0dXJuIHJ2O1xufTtcblxuLyogQ3JlYXRlcyBhIHN0cnVjdXJlIGFzIGZvbGxvd3M6XG5cdFsgW3RvX21hdGNoLCBjb25kaXRpb24sIHN1YnN0aXR1dGlvbiBdLCAuLi5dXG5cdCovXG5leHBvcnRzLnByb3RvdHlwZS5jYXN0UnVsZXMgPSBmdW5jdGlvbiAoIHN0ciApIHtcblx0c3RyID0gc3RyIHx8IHRoaXMub3B0aW9ucy5ydWxlcztcblx0dmFyIHJ2ID0gW107XG5cdC8vIEYocyxvKSA6IHMgPT0gQVMgJiYgbyA9PSBSIC0+IEYoQVMsTClGKEJTLFIpIFxcblxuXG5cdHN0ci5zcGxpdCggL1tcXG5cXHJcXGZdKy8gKVxuXHRcdC5mb3JFYWNoKCBmdW5jdGlvbiAoIGxpbmUgKSB7XG5cdFx0XHRpZiAoIGxpbmUgPT0gJycgKSByZXR1cm47XG5cdFx0XHR2YXIgaGVhZF90YWlsID0gbGluZS5tYXRjaChcblx0XHRcdFx0L15cXHMqKC4rPylcXHMqLT5cXHMqKFteXFxuXFxyXFxmXSspXFxzKi9cblx0XHRcdCk7XG5cblx0XHRcdGlmICggaGVhZF90YWlsICE9IG51bGwgKSB7XG5cdFx0XHRcdHZhciBtYXRjaF9jb25kaXRpb24gPSBoZWFkX3RhaWxbIDEgXS5tYXRjaChcblx0XHRcdFx0XHQvKFteOl0rKVxccyo6P1xccyooLio/KVxccyokL1xuXHRcdFx0XHQpO1xuXHRcdFx0XHR2YXIgaGVhZCA9IG1hdGNoX2NvbmRpdGlvblsgMSBdLm1hdGNoKCAvXiguKz8pXFxzKiQvICk7XG5cdFx0XHRcdHZhciBydWxlID0gW1xuXHRcdFx0XHRcdGhlYWRbIDEgXSxcblx0XHRcdFx0XHRtYXRjaF9jb25kaXRpb25bIDIgXSxcblx0XHRcdFx0XHRoZWFkX3RhaWxbIDIgXVxuXHRcdFx0XHRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgKCAnUGFyc2UgZXJyb3IgJyArIGxpbmUgKTtcblx0XHRcdH1cblx0XHRcdHJ2LnB1c2goIHJ1bGUgKTtcblx0XHR9ICk7XG5cblx0dGhpcy5vcHRpb25zLnJ1bGVzID0gcnY7XG5cdHJldHVybiBydjtcbn07XG5cbmV4cG9ydHMucHJvdG90eXBlLmRzaW4gPSBmdW5jdGlvbiAoIHJhZGlhbnMgKSB7XG5cdHJldHVybiBNYXRoLnNpbiggcmFkaWFucyAqIFJBRCApXG59O1xuXG5leHBvcnRzLnByb3RvdHlwZS5kY29zID0gZnVuY3Rpb24gKCByYWRpYW5zICkge1xuXHRyZXR1cm4gTWF0aC5jb3MoIHJhZGlhbnMgKiBSQUQgKVxufTtcblxuZXhwb3J0cy5wcm90b3R5cGUuZ2VuZXJhdGUgPSBmdW5jdGlvbiAoIGdlbmVyYXRpb25zICkge1xuXHR0aGlzLnRvdGFsX2dlbmVyYXRpb25zID0gZ2VuZXJhdGlvbnM7XG5cdExPR0dFUi5kZWJ1ZyggJ0VudGVyIGdlbmVyYXRlIGZvciAnICsgdGhpcy50b3RhbF9nZW5lcmF0aW9ucyArXG5cdFx0JyBnZW5lcmF0aW9ucycgKTtcblxuXHR0aGlzLmNvbnRlbnQgPSB0aGlzLm9wdGlvbnMuc3RhcnQ7XG5cdHRoaXMuY29udGVudCA9IHRoaXMuaW50ZXJwbG9hdGVWYXJzKCB0aGlzLmNvbnRlbnQgKTtcblxuXHRmb3IgKFxuXHRcdHRoaXMuZ2VuZXJhdGlvbiA9IDE7IHRoaXMuZ2VuZXJhdGlvbiA8PSB0aGlzLnRvdGFsX2dlbmVyYXRpb25zOyB0aGlzLmdlbmVyYXRpb24rK1xuXHQpIHtcblx0XHR0aGlzLmFwcGx5X3J1bGVzKCk7XG5cdH1cblxuXHQvLyBUcmFuc2xhdGUgY29udGV4dCB0byBjZW50ZXIgb2YgY2FudmFzOlxuXHR0aGlzLmN0eC50cmFuc2xhdGUoIDAsIHRoaXMuY2FudmFzLmhlaWdodCApO1xuXHQvLyBGbGlwIGNvbnRleHQgdmVydGljYWxseVxuXHR0aGlzLmN0eC5zY2FsZSggMSwgLTEgKTtcblxuXHR0aGlzLnJlbmRlcigpO1xuXHQvLyB0aGlzLnJlc2l6ZSgpO1xuXHR0aGlzLmZpbmFsaXNlKCk7XG5cdExPR0dFUi5kZWJ1ZyggJ0xlYXZlIGdlbmVyYXRlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nICk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuZXhwb3J0cy5wcm90b3R5cGUuaW50ZXJwbG9hdGVWYXJzID0gZnVuY3Rpb24gKCBzdHIgKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0dmFyIHJ2ID0gc3RyLnJlcGxhY2UoXG5cdFx0dGhpcy5pbnRlcnBvbGF0ZVZhcnNSZSxcblx0XHRmdW5jdGlvbiAoIG1hdGNoICkge1xuXHRcdFx0cmV0dXJuICggdHlwZW9mIHNlbGYudmFyaWFibGVzWyBtYXRjaCBdICE9ICd1bmRlZmluZWQnICkgP1xuXHRcdFx0XHRzZWxmLnZhcmlhYmxlc1sgbWF0Y2ggXSA6IG1hdGNoO1xuXHRcdH1cblx0KTtcblx0TE9HR0VSLnRyYWNlKCAnSW50ZXJwb2xhdGUgdmFyczogJyArIHN0ciArICcgLi4uLi4uICcgKyBydiApO1xuXHRyZXR1cm4gcnY7XG59O1xuXG5leHBvcnRzLnByb3RvdHlwZS5zdHJpbmcycmVBbmRBcmdOYW1lcyA9IGZ1bmN0aW9uICggc3RyICkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdHZhciBhcmdOYW1lcyA9IFtdO1xuXHR0aGlzLnN0cjJyZVJlID0gbmV3IFJlZ0V4cCggLyhcXHcrKVxcKChbXlxcKV0rKVxcKS8gKTtcblx0dmFyIHJ2ID0gc3RyLnJlcGxhY2UoXG5cdFx0dGhpcy5zdHIycmVSZSxcblx0XHRmdW5jdGlvbiAoIG1hdGNoLCB2YXJuYW1lLCBhcmdzQ3N2ICkge1xuXHRcdFx0YXJnTmFtZXMgPSBhcmdzQ3N2LnNwbGl0KCAvXFxzKixcXHMqLyApO1xuXHRcdFx0Ly8gQ291bGQgY2FjaGUgdGhlc2UgYmFzZWQgb24gYXJncy5sZW5ndGg6XG5cdFx0XHRyZXR1cm4gJygnICsgdmFybmFtZSArICcpXFxcXCgnICsgYXJnTmFtZXMubWFwKCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiAnKFtcXFxcJFxcXFx3LV0rKSdcblx0XHRcdH0gKSArICdcXFxcKSc7XG5cdFx0fVxuXHQpO1xuXHRyZXR1cm4gW1xuXHRcdG5ldyBSZWdFeHAoIHJ2LCAnZycgKSxcblx0XHRhcmdOYW1lc1xuXHRdO1xufTtcblxuZXhwb3J0cy5wcm90b3R5cGUuYXBwbHlfcnVsZXMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0TE9HR0VSLmRlYnVnKCAnRW50ZXIgYXBwbHlfcnVsZXMgZm9yIGdlbmVyYXRpb24gJyArIHRoaXMuZ2VuZXJhdGlvbiApO1xuXG5cdHZhciBmaW5hbENvbnRlbnQgPSAnJztcblxuXHQvLyBJdHRlcmF0ZSBvdmVyIGF0b21zIHdpdGhpbiB0aGUgY29udGVudD9cblx0dmFyIGF0b21zID0gc2VsZi5jb250ZW50Lm1hdGNoKCAvKC4oXFwoW14pXStcXCkpPykvZyApO1xuXHRpZiAoIHNlbGYuY29udGVudCAhPSBhdG9tcy5qb2luKCAnJyApICkge1xuXHRcdExPR0dFUi5FUlJPUiggYXRvbXMgKTtcblx0XHRMT0dHRVIuRVJST1IoICdhdG9tcyBeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eJyApO1xuXHRcdGFsZXJ0KCAnQXRvbWljIHJlZ2V4IGZhaWxlZCwgcmVzdWx0cyB3aWxsIGJlIHdyb25nJyApO1xuXHR9XG5cblx0YXRvbXMuZm9yRWFjaCggZnVuY3Rpb24gKCBhdG9tICkge1xuXHRcdC8vIFJ1biBwcm9kdWN0aW9uIHJ1bGVzOlxuXHRcdHZhciBydWxlTnVtYmVyID0gMDtcblx0XHR2YXIgcnVsZVN1Y2Nlc3NmdWxseUFwcGxpZWQgPSBmYWxzZTtcblxuXHRcdHNlbGYub3B0aW9ucy5ydWxlcy5mb3JFYWNoKCBmdW5jdGlvbiAoIHJ1bGUgKSB7XG5cdFx0XHRydWxlTnVtYmVyKys7XG5cblx0XHRcdGlmICggcnVsZVN1Y2Nlc3NmdWxseUFwcGxpZWQgKSB7XG5cdFx0XHRcdExPR0dFUi5kZWJ1ZyggJ1NraXAgcnVsZSAnICsgcnVsZU51bWJlciArXG5cdFx0XHRcdFx0JyBhcyBoYXZlIG1hZGUgc3Vic3RpdHVpb24nICk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmUtd3JpdGUgdGhlIHJ1bGUgdG8gcmVwbGFjZSB2YXJpYWJsZXMgd2l0aCBsaXRlcmFscywgd2hlcmUgcG9zc2libGU6XG5cdFx0XHR2YXIgXyA9IHNlbGYuc3RyaW5nMnJlQW5kQXJnTmFtZXMoIHJ1bGVbIDAgXSApO1xuXHRcdFx0dmFyIHJ1bGUyZmluZFJlID0gX1sgMCBdO1xuXHRcdFx0dmFyIHJ1bGVBcmdOYW1lcyA9IF9bIDEgXTtcblx0XHRcdExPR0dFUi5kZWJ1ZyggJ1J1bGUgJyArIHJ1bGVOdW1iZXIgKyAnIHNheXMgZmluZCAnICsgcnVsZVsgMCBdICtcblx0XHRcdFx0JyBpbiBjb250ZW50IG9mICcgKyBhdG9tICk7XG5cblx0XHRcdC8vIEZpbmQgdGhlIHJ1bGUgcGF0dGVybiAobGVmdC1oYW5kIHNpZGUgb2YgY29uZGl0aW9uKVxuXHRcdFx0Ly8gYW5kIHJlcGxhY2UgaWYgY29uZGl0aW9uIGlzIG1ldFxuXHRcdFx0dmFyIGF0b21BZnRlclJ1bGVBcHBsaWVkID0gYXRvbS5yZXBsYWNlKFxuXHRcdFx0XHRydWxlMmZpbmRSZSxcblx0XHRcdFx0ZnVuY3Rpb24gcmVwbGFjZW1lbnQoIG9yaWdpbmFsICkge1xuXHRcdFx0XHRcdC8qICBPbiBlbnRlcmluZyB0aGlzIGZ1bmN0aW9uLCBhIG1hdGNoIGhhcyBiZWVuIGZvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0IHJ1bGVzIGhhdmUgeWV0IHRvIGJlIHRlc3RlZFxuICAgICAgICAgICAgICAgICAgICAgICAgKi9cblx0XHRcdFx0XHQvLyBBc2NyaWJlIHZhcmlhYmxlc1xuXHRcdFx0XHRcdGZvciAoIHZhciBpID0gMjsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAyOyBpKysgKSB7XG5cdFx0XHRcdFx0XHRMT0dHRVIuZGVidWcoIFwiTGV0IFwiICsgcnVsZUFyZ05hbWVzWyBpIC0gMiBdICsgJyA9ICcgKyBhcmd1bWVudHNbXG5cdFx0XHRcdFx0XHRcdGkgXSApO1xuXHRcdFx0XHRcdFx0Ly8gU2V0IHZhcmlhYmxlcyB3aXRoIHZhbHVlcyBmb3VuZFxuXHRcdFx0XHRcdFx0c2VsZi52YXJpYWJsZXNbIHJ1bGVBcmdOYW1lc1sgaSAtIDIgXSBdID0gYXJndW1lbnRzWyBpIF07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gR2V0IHRoZSBydWxlIGNvZGU6XG5cdFx0XHRcdFx0dmFyIHJ1bGVDb25kaXRpb25KcyA9IHNlbGYuaW50ZXJwbG9hdGVWYXJzKCBydWxlWyAxIF0gKTtcblx0XHRcdFx0XHRMT0dHRVIuZGVidWcoICdSdWxlICcgKyBydWxlTnVtYmVyICsgJyBjb25kaXRpb246ICcgK1xuXHRcdFx0XHRcdFx0cnVsZUNvbmRpdGlvbkpzICk7XG5cblx0XHRcdFx0XHQvLyBEZWNpZGUgaWYgdGhlIHN1YnN0aXR1dGlvbiB0YWtlIHBsYWNlXG5cdFx0XHRcdFx0dmFyIHJ1bGVDb25kaXRpb25NZXQgPSBydWxlQ29uZGl0aW9uSnMubGVuZ3RoID09IDAgP1xuXHRcdFx0XHRcdFx0dHJ1ZSA6IGV2YWwoIHJ1bGVDb25kaXRpb25KcyApO1xuXG5cdFx0XHRcdFx0Ly8gTm8gc3Vic3RpdHV0aW9uc1xuXHRcdFx0XHRcdGlmICggIXJ1bGVDb25kaXRpb25NZXQgKSB7XG5cdFx0XHRcdFx0XHRMT0dHRVIudHJhY2UoICdDb25kaXRpb24gbm90IG1ldCcgKTtcblx0XHRcdFx0XHRcdHJldHVybiBvcmlnaW5hbDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRydWxlU3VjY2Vzc2Z1bGx5QXBwbGllZCA9IHRydWU7XG5cdFx0XHRcdFx0dmFyIHN1YnN0aXR1dGVkID0gc2VsZi5pbnRlcnBsb2F0ZVZhcnMoIHJ1bGVbIDIgXSApO1xuXHRcdFx0XHRcdExPR0dFUi5kZWJ1Zyhcblx0XHRcdFx0XHRcdCdDb25kaXRpb24gbWV0Oi0tLS0tLT4gc3Vic3RpdHV0ZWQgcmVzdWx0ID0gJyArIHJ1bGVbIDIgXSArXG5cdFx0XHRcdFx0XHQnICBSVj09ICcgKyBzdWJzdGl0dXRlZFxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRyZXR1cm4gc3Vic3RpdHV0ZWQ7XG5cdFx0XHRcdH0gLy8gZW5kIG9mIHJlcGxhY2VtZW50IGZ1bmN0aW9uXG5cdFx0XHQpOyAvLyBlbmQgb2YgcmVwbGFjZW1lbnQgY2FsbFxuXG5cdFx0XHQvLyBJZiB0aGUgcnVsZSBpcyBub3QgbWV0LCB0aGUgcmVwbGFjZW1lbnQgdmFsdWUgd2lsbCBiZSB1bmRlZmluZWQsXG5cdFx0XHQvLyBkbyBub3Qgd3JpdGUgdGhpcyBpbnRvIHRoZSBzdHJpbmc6XG5cdFx0XHRpZiAoIHJ1bGVTdWNjZXNzZnVsbHlBcHBsaWVkICkge1xuXHRcdFx0XHRhdG9tID0gYXRvbUFmdGVyUnVsZUFwcGxpZWQ7XG5cdFx0XHRcdExPR0dFUi5kZWJ1ZyggJ0FmdGVyIGZ1bGZpbGxlZCBydWxlICcgKyBydWxlTnVtYmVyICtcblx0XHRcdFx0XHQnIHdhcyBhcHBsaWVkLCBhdG9tIGlzOiAnICsgYXRvbSApO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHR9ICk7IC8vIE5leHQgcnVsZVxuXG5cdFx0ZmluYWxDb250ZW50ICs9IGF0b207XG5cdH0gKTsgLy8gTmV4dCBhdG9tXG5cblx0c2VsZi5jb250ZW50ID0gZmluYWxDb250ZW50O1xuXG5cdExPR0dFUi5kZWJ1ZyggJ0FmdGVyIGFsbCBydWxlcyB3ZXJlIGFwcGxpZWQsIGNvbnRlbnQgaXM6ICcsIHNlbGYuY29udGVudCApO1xuXHRMT0dHRVIuZGVidWcoXG5cdFx0JyMgRklOQUwgZm9yIGdlbmVyYXRpb24gJyArIHRoaXMuZ2VuZXJhdGlvbiArICcvJyArIHRoaXMudG90YWxfZ2VuZXJhdGlvbnMgK1xuXHRcdCcgIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyBDb250ZW50OiAnICsgc2VsZi5jb250ZW50XG5cdCk7XG59O1xuXG5leHBvcnRzLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBkaXIgPSAwO1xuXHR2YXIgc3RhdGVzID0gW107XG5cdHRoaXMuc3RlcHBlZCA9IDA7XG5cblx0Ly8gUFJPRFVDVElPTl9SVUxFUzpcblx0Zm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5jb250ZW50Lmxlbmd0aDsgaSsrICkge1xuXHRcdHZhciBkcmF3ID0gdHJ1ZTtcblx0XHR0aGlzLnBlblVwID0gZmFsc2U7XG5cdFx0Ly8gTE9HR0VSLmRlYnVnKCAnRG8gJytpKTtcblx0XHRzd2l0Y2ggKCB0aGlzLmNvbnRlbnQuY2hhckF0KCBpIClcblx0XHRcdC50b0xvd2VyQ2FzZSgpICkge1xuXHRcdGNhc2UgJ2cnOlxuXHRcdFx0dmFyIGdldEdlbk51bWJlciA9IG5ldyBSZWdFeHAoICcueycgKyBpICsgJ30oXFxcXGQrKScgKTtcblx0XHRcdHRoaXMuZ2VuZXJhdGlvbiA9IGdldEdlbk51bWJlci5leGVjKCB0aGlzLmNvbnRlbnQgKTtcblx0XHRcdHRoaXMuZ2VuZXJhdGlvbiA9IHRoaXMuZ2VuZXJhdGlvbiA/XG5cdFx0XHRcdHBhcnNlSW50KCB0aGlzLmdlbmVyYXRpb25bIDEgXSApIDogbnVsbDtcblx0XHRcdGkgKz0gKCBcIlwiICsgdGhpcy5nZW5lcmF0aW9uIClcblx0XHRcdFx0Lmxlbmd0aDtcblx0XHRcdGNvbnNvbGUubG9nKCAnLS0tPiBTZXQgR2VuZXJhdGlvbiAnICsgdGhpcy5nZW5lcmF0aW9uICk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdmJzpcblx0XHRcdC8vIHRoaXMucGVuVXAgPSB0cnVlOyB3aHkgcGVuIHVwIGdvaW5nIGZvcmFyZHM/IG51dHMuXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdjJzpcblx0XHRcdHRoaXMuc2V0Q29sb3VyKCBwYXJzZUludCggdGhpcy5jb250ZW50LmNoYXJBdCggKytpICksIDEwICkgKTtcblx0XHRcdGRyYXcgPSBmYWxzZTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJysnOlxuXHRcdFx0ZGlyICs9IHRoaXMub3B0aW9ucy5hbmdsZTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJy0nOlxuXHRcdFx0ZGlyIC09IHRoaXMub3B0aW9ucy5hbmdsZTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ1snOlxuXHRcdFx0c3RhdGVzLnB1c2goIFsgZGlyLCB0aGlzLngsIHRoaXMueSwgdGhpcy5jb2xvdXIsIHRoaXMuc3RlcHBlZCBdICk7XG5cdFx0XHRkcmF3ID0gZmFsc2U7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICddJzpcblx0XHRcdHZhciBzdGF0ZSA9IHN0YXRlcy5wb3AoKTtcblx0XHRcdGRpciA9IHN0YXRlWyAwIF07XG5cdFx0XHR0aGlzLnggPSBzdGF0ZVsgMSBdO1xuXHRcdFx0dGhpcy55ID0gc3RhdGVbIDIgXTtcblx0XHRcdHRoaXMuY29sb3VyID0gc3RhdGVbIDMgXTtcblx0XHRcdHRoaXMuc3RlcHBlZCA9IHN0YXRlWyA0IF07XG5cdFx0XHRkcmF3ID0gdHJ1ZTtcblx0XHRcdGJyZWFrO1xuXHRcdH07XG5cblx0XHRpZiAoIGRyYXcgKSB7XG5cdFx0XHR0aGlzLnR1cnRsZV9ncmFwaCggZGlyICk7XG5cdFx0XHR0aGlzLnN0ZXBwZWQrKztcblx0XHR9XG5cdH1cblx0TE9HR0VSLmluZm8oICdMZWF2ZSBkZWZhdWx0X2dlbmVyYXRlX2NhbGxiYWNrJyApO1xufTtcblxuZXhwb3J0cy5wcm90b3R5cGUuZmluYWxpc2UgPSBmdW5jdGlvbiAoKSB7XG5cdExPR0dFUi5kZWJ1ZyggJ0ZpbmFsaXNlZCcgKTtcbn07XG5cbmV4cG9ydHMucHJvdG90eXBlLnR1cnRsZV9ncmFwaCA9IGZ1bmN0aW9uICggZGlyICkge1xuXHQvLyBMT0dHRVIuZGVidWcoICdNb3ZlICcrZGlyICsnIGZyb20gJyt0aGlzLngrJywnK3RoaXMueSApO1xuXG5cdHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuXHRpZiAoIHRoaXMub3B0aW9ucy50aW1lX3NjYWxlX2xpbmVzID4gMCApIHtcblx0XHR2YXIgdyA9ICggdGhpcy5vcHRpb25zLnRpbWVfc2NhbGVfbGluZXMgKiB0aGlzLnRvdGFsX2dlbmVyYXRpb25zICkgLSAoIHRoaXMuc3RlcHBlZCAqIHRoaXMub3B0aW9ucy5saW5lX3dpZHRoICk7XG5cdFx0aWYgKCBwYXJzZUludCggdyApIDwgMSApIHtcblx0XHRcdHcgPSAxO1xuXHRcdH1cblx0XHR0aGlzLmN0eC5saW5lV2lkdGggPSB3O1xuXHRcdC8vIGNvbnNvbGUubG9nKCAndGhpcy5zdGVwcGVkPSVkLCAgTElORSBXSURUSDogJWQnLCB0aGlzLnN0ZXBwZWQsIHRoaXMuY3R4LmxpbmVXaWR0aCApXG5cblx0fSBlbHNlIGlmICggdGhpcy5vcHRpb25zLmxpbmVfd2lkdGggKSB7XG5cdFx0dGhpcy5jdHgubGluZVdpZHRoID0gdGhpcy5vcHRpb25zLmxpbmVfd2lkdGhcblx0fVxuXHR0aGlzLmN0eC5tb3ZlVG8oIHRoaXMueCwgdGhpcy55ICk7XG5cblx0dGhpcy54ICs9ICggdGhpcy5kY29zKCBkaXIgKSAqIHRoaXMub3B0aW9ucy50dXJ0bGVfc3RlcF94ICk7XG5cdHRoaXMueSArPSAoIHRoaXMuZHNpbiggZGlyICkgKiB0aGlzLm9wdGlvbnMudHVydGxlX3N0ZXBfeSApO1xuXG5cdHRoaXMueCArPSB0aGlzLnhvZmZzZXQ7XG5cdHRoaXMueSArPSB0aGlzLnlvZmZzZXQ7XG5cblx0aWYgKCB0aGlzLnggPiB0aGlzLm1heF94ICkgdGhpcy5tYXhfeCA9IHRoaXMueDtcblx0aWYgKCB0aGlzLnkgPiB0aGlzLm1heF95ICkgdGhpcy5tYXhfeSA9IHRoaXMueTtcblx0aWYgKCB0aGlzLnggPCB0aGlzLm1pbl94ICkgdGhpcy5taW5feCA9IHRoaXMueDtcblx0aWYgKCB0aGlzLnkgPCB0aGlzLm1pbl95ICkgdGhpcy5taW5feSA9IHRoaXMueTtcblxuXHR0aGlzLmN0eC5saW5lVG8oIHRoaXMueCwgdGhpcy55ICk7XG5cdHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xuXHRpZiAoICF0aGlzLnBlblVwICkgdGhpcy5jdHguc3Ryb2tlKCk7XG5cdC8vIExPR0dFUi5kZWJ1ZyggJy4uLnRvICcrdGhpcy54KycsJyt0aGlzLnkgKTtcbn07XG5cbmV4cG9ydHMucHJvdG90eXBlLnNldENvbG91ciA9IGZ1bmN0aW9uICggaW5kZXggKSB7XG5cdHRoaXMuY29sb3VyID0gdGhpcy5vcHRpb25zLmNvbG91cnNbIGluZGV4IF07XG5cdHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvdXI7XG59O1xuXG5leHBvcnRzLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG5cdGNvbnNvbGUud2FybiggJ25vdCByZXNpemluZycgKTtcblx0cmV0dXJuO1xuXHRMT0dHRVIuZGVidWcoIHRoaXMubWluX3ggKyAnLT4nICsgdGhpcy5tYXhfeCApO1xuXHRMT0dHRVIuZGVidWcoIHRoaXMubWluX3kgKyAnLT4nICsgdGhpcy5tYXhfeSApO1xuXHR2YXIgd2kgPSBNYXRoLmFicyggdGhpcy5taW5feCApICsgdGhpcy5tYXhfeDtcblx0dmFyIGhpID0gTWF0aC5hYnMoIHRoaXMubWluX3kgKSArIHRoaXMubWF4X3k7XG5cdExPR0dFUi5kZWJ1ZyggdGhpcy5jYW52YXMud2lkdGggKyAnLCcgKyB0aGlzLmNhbnZhcy5oZWlnaHQgKTtcblx0TE9HR0VSLmRlYnVnKCB3aSArICcsJyArIGhpICk7XG5cdHZhciBzeCA9IHRoaXMuY2FudmFzLndpZHRoIC8gd2k7XG5cdHZhciBzeSA9IHRoaXMuY2FudmFzLmhlaWdodCAvIGhpO1xuXHRMT0dHRVIuZGVidWcoICdTY2FsZTogJyArIHN4ICsgJywnICsgc3kgKTtcblxuXHRpZiAoIHRoaXMub3B0aW9ucy5jbGVhckNhbnZhcyApIHtcblx0XHR0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoO1xuXHR9XG5cblx0dGhpcy5jdHguc2NhbGUoIHN4LCBzeSApO1xuXHR0aGlzLmN0eC50cmFuc2xhdGUoXG5cdFx0dGhpcy5vcHRpb25zLnR1cnRsZV9zdGVwX3gsXG5cdFx0dGhpcy5vcHRpb25zLnR1cnRsZV9zdGVwX3kgKiAtMVxuXHQpO1xuXG5cdHRoaXMueCA9IHRoaXMub3B0aW9ucy5pbml0X3ggfHwgMDsgLy8gdGhpcy5vcHRpb25zLnR1cnRsZV9zdGVwX3ggfHwgMDtcblx0dGhpcy55ID0gdGhpcy5vcHRpb25zLmluaXRfeSB8fCB0aGlzLm9wdGlvbnMuY2FudmFzX2hlaWdodCAvIDI7XG5cdHRoaXMueSAtPSB0aGlzLm1pbl95O1xuXHR0aGlzLnJlbmRlcigpO1xufTtcbiIsIi8qXHR0L3BhcmFtZXRyaWMuanMgLSBxVW5pdCB0ZXN0IC0gdjAuMlxuXG5cdERvY3VtZW50YXRpb24gdmlhIGRvY2NvLCBoZW5jZSBzaW5nbGUtbGluZSBjb21tZW50cy5cblx0MSB0YWIgPT0gNCBzcGFjZXNcbiovXG5cbi8vIFRlc3QgdGhlIGFkZGl0aW9uIG9mIHBhcmFtZXRlcnMgdG8gdGhlIEwxIEwtc3lzdGVtXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy9cbi8vIFRlc3QgY2FzZSBmcm9tIEhhbmFuLCAxOTkyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gXHQjZGVmaW5lIFdcdDAuNVxuLy8gXHQjZGVmaW5lIEFTIFx0IDJcbi8vIFx0I2RlZmluZSBCUyBcdCAxXG4vLyBcdCNkZWZpbmUgUiBcdCAxXG4vLyBcdCNkZWZpbmUgTFx0LTFcbi8vXG4vL1x0ICB3IDogIShXKUYoQlMsUilcbi8vXHQgcDEgOiBGKHMsbykgOiBzID09IEFTICYmIG8gPT0gUiAtPiBGKEFTLEwpRihCUyxSKVxuLy9cdCBwMiA6IEYocyxvKSA6IHMgPT0gQVMgJiYgbyA9PSBMIC0+IEYoQlMsTClGKEFTLFIpXG4vL1x0IHAzIDogRihzLG8pIDogcyA9PSBCU1x0ICAgICAgICAtPiBGKEFTLG8pXG4vL1xuLy8gRHJ5LXJ1biBUZXN0IFJlc3VsdHNcbi8vID09PT09PT09PT09PT09PT09PT09XG4vL1xuLy9cdCBwMSA6IEYocyxvKSA6IHMgPT0gMiAmJiBvID09ICAxIC0+IEYoMiwtMSlGKDEsIDEpXG4vL1x0IHAyIDogRihzLG8pIDogcyA9PSAyICYmIG8gPT0gLTEgLT4gRigxLC0xKUYoMiwgMSlcbi8vXHQgcDMgOiBGKHMsbykgOiBzID09IDEgJiYgICAgICAgICAtPiBGKDIsIG8pXG4vL1xuLy8gRHJ5LXJ1biBPdXRwdXRcbi8vID09PT09PT09PT09PT09XG4vL1xuLy9cdCAhKDAuNSlGKDEsMSlcbi8vXHQgISgwLjUpRigyLDEpXG4vL1x0ICEoMC41KUYoMiwtMSlGKDEsMSlcbi8vXHQgISgwLjUpRigxLC0xKUYoMiwxKUYoMiwxKVxuLy9cdCAhKDAuNSlGKDItLDEpRigyLC0xKUYoMSwxKUYoMiwtMSlGKDEsMSlcbi8vXG5cbi8vIHZhciBMT0dHRVIgPSBsb2c0amF2YXNjcmlwdC5nZXRMb2dnZXIoKTtcbi8vIExvZ3MgdG8gdGhlIGNvbnNvbGUsIG5vdCB0byB0aGUgZGVmYXVsdCBwb3AtdXA6XG4vLyB2YXIgYXBwZW5kZXIgPSBuZXcgbG9nNGphdmFzY3JpcHQuQnJvd3NlckNvbnNvbGVBcHBlbmRlcigpO1xuLy8gTG9nLWxldmVsIHJhaXNlZCBhZnRlciBkZXZlbG9wbWVudCBjb21wbGV0ZTpcbi8vIGFwcGVuZGVyLnNldFRocmVzaG9sZChsb2c0amF2YXNjcmlwdC5MZXZlbC5FUlJPUik7XG4vLyBMT0dHRVIuYWRkQXBwZW5kZXIoYXBwZW5kZXIpO1xuXG5cInVzZSBzdHJpY3RcIjtcbnZhciBMc3lzID0gcmVxdWlyZSggXCIuLi9saWIvTHN5c1BhcmFtZXRyaWNBTUQuanNcIiApO1xuYWxlcnQoIFF1bml0ICk7XG52YXIgTE9HR0VSID0gY29uc29sZTsgLy8gbG9nNGphdmFzY3JpcHQuZ2V0TG9nZ2VyKCk7XG5cblxuLy8gVGhlIGNvbnRlbnQgZXhwZWN0ZWQgZm9yIHRoZSBnZW5lcmF0aW9uOlxudmFyIGV4cGVjdENvbnRlbnQgPSBbXG5cdCchKDAuNSlGKDEsMSknLFxuXHQnISgwLjUpRigyLDEpJyxcblx0JyEoMC41KUYoMiwtMSlGKDEsMSknLFxuXHQnISgwLjUpRigxLC0xKUYoMiwxKUYoMiwxKScsXG5cdCchKDAuNSlGKDIsLTEpRigyLC0xKUYoMSwxKUYoMiwtMSlGKDEsMSknXG5dO1xuXG4vLyBUaGVzZSBvcHRpb25zIGFyZSBmaXhlZCBmb3IgZXZlcnkgdGVzdDpcbnZhciBkZWZhdWx0T3B0aW9ucyA9IHtcblx0Ly8gQW4gZWxlbWVudCBpbnRvIHdoaWNoIHRoZSBMc3lzIGNhbnZhcyBjYW4gYmUgaW5zZXJ0ZWQ6XG5cdGVsOiBkb2N1bWVudC5uZXdFbGVtZW50KCAnZGl2JyApLFxuXHR2YXJpYWJsZXM6IFwiI2RlZmluZSAkV1x0ICAwLjVcXG5cIiArIFwiI2RlZmluZSAkQVMgIDJcXG5cIiArIFwiI2RlZmluZSAkQlMgIDFcXG5cIiArIFwiI2RlZmluZSAkUiAgIDFcXG5cIiArIFwiI2RlZmluZSAkTFx0IC0xXCIsXG5cdHJ1bGVzOiBcIkYoJHMsJG8pIDogJHMgPT0gJEFTICYmICRvID09ICRSIC0+IEYoJEFTLCRMKUYoJEJTLCRSKVxcblwiICsgXCJGKCRzLCRvKSA6ICRzID09ICRBUyAmJiAkbyA9PSAkTCAtPiBGKCRCUywkTClGKCRBUywkUilcXG5cIiArIFwiRigkcywkbykgOiAkcyA9PSAkQlNcdCAgICAgICAgICAgLT4gRigkQVMsJG8pXFxuXCIsXG5cdC8vIEF4aW9tXG5cdHN0YXJ0OiBcIiEoJFcpRigkQlMsJFIpXCJcbn07XG5cbnRlc3QoICdDb25zdHJ1Y3RlZCB3aXRoIG9sZCBhcmdzJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgb2xkT3B0aW9ucyA9IE9iamVjdC5jbG9uZSggZGVmYXVsdE9wdGlvbnMgKTtcblx0ZGVsZXRlIG9sZE9wdGlvbnMudmFyaWFibGVzO1xuXHR2YXIgbHN5cyA9IG5ldyBMc3lzKCBvbGRPcHRpb25zICk7XG5cdGVxdWFsKCB0eXBlb2YgbHN5cywgXCJvYmplY3RcIiwgXCJDb25zdHJ1dGVkIExzeXMgb2JqZWN0XCIgKTtcbn0gKTtcblxudGVzdCggJ0NvbnN0cnVjdGVkIHdpdGggbmV3IHBhcmFtZXRyaWMgYXJncycsIGZ1bmN0aW9uICgpIHtcblx0dmFyIGxzeXMgPSBuZXcgTHN5cyggZGVmYXVsdE9wdGlvbnMgKTtcblx0ZXF1YWwoIHR5cGVvZiBsc3lzLCBcIm9iamVjdFwiLCBcIkNvbnN0cnV0ZWQgTHN5cyBvYmplY3RcIiApO1xuXG5cdC8vIE5CIE1vb1Rvb2xzLCBub3QgbmF0aXZlOlxuXHRlcXVhbCggdHlwZU9mKCBsc3lzLm9wdGlvbnMucnVsZXMgKSwgJ2FycmF5JywgJ1J1bGVzIGFycmF5JyApO1xuXHRsc3lzLm9wdGlvbnMucnVsZXMuZWFjaCggZnVuY3Rpb24gKCBpICkge1xuXHRcdGVxdWFsKCB0eXBlT2YoIGkgKSwgJ2FycmF5JywgJ1J1bGUgY2FzdCcgKTtcblx0XHRlcXVhbCggaS5sZW5ndGgsIDMsICdydWxlIHR1cGxlJyApO1xuXHR9ICk7XG5cblx0ZGVlcEVxdWFsKFxuXHRcdGxzeXMub3B0aW9ucy5ydWxlcywgW1xuXHRcdFx0WyBcIkYoJHMsJG8pXCIsIFwiJHMgPT0gJEFTICYmICRvID09ICRSXCIsIFwiRigkQVMsJEwpRigkQlMsJFIpXCIgXSxcblx0XHRcdFsgXCJGKCRzLCRvKVwiLCBcIiRzID09ICRBUyAmJiAkbyA9PSAkTFwiLCBcIkYoJEJTLCRMKUYoJEFTLCRSKVwiIF0sXG5cdFx0XHRbIFwiRigkcywkbylcIiwgXCIkcyA9PSAkQlNcIiwgXCJGKCRBUywkbylcIiBdXG5cdFx0XSxcblx0XHQnUnVsZXMgcGFyc2VkJ1xuXHQpO1xufSApO1xuXG50ZXN0KCAnSW50ZXJwbG9hdGlvbicsIGZ1bmN0aW9uICgpIHtcblx0ZXF1YWwoXG5cdFx0bmV3IExzeXMoIGRlZmF1bHRPcHRpb25zIClcblx0XHQuaW50ZXJwbG9hdGVWYXJzKCAnJEFTJyApLFxuXHRcdDIsXG5cdFx0J0ludGVycG9sYXRlIHZhcmlhYmxlJ1xuXHQpO1xufSApO1xuXG50ZXN0KCAnc3RyaW5nIHRvIHJlIGFuZCBhcmcgbmFtZScsIGZ1bmN0aW9uICgpIHtcblx0dmFyIHJ2ID0gbmV3IExzeXMoIGRlZmF1bHRPcHRpb25zIClcblx0XHQuc3RyaW5nMnJlQW5kQXJnTmFtZXMoICdGKHMsbyknICk7XG5cdGVxdWFsKCB0eXBlT2YoIHJ2ICksICdhcnJheScsICdydiB0eXBlJyApO1xuXHRlcXVhbCggcnYubGVuZ3RoLCAyLCAncnYgbGVuZ3RoJyApO1xuXHRlcXVhbCggdHlwZU9mKCBydlsgMCBdICksICdyZWdleHAnLCAncnYgcmVnZXhwJyApO1xuXHR2YXIgdmFyV29yZCA9ICcoW1xcXFwkXFxcXHctXSspJztcblx0ZXF1YWwoIHJ2WyAwIF0sICcvKEYpXFxcXCgnICsgdmFyV29yZCArICcsJyArIHZhcldvcmQgKyAnXFxcXCkvZycsICdydiByZWdleHAnICk7XG5cdGVxdWFsKCB0eXBlT2YoIHJ2WyAxIF0gKSwgJ2FycmF5JywgJ3J2IHZhciBuYW1lcyB0eXBlJyApO1xuXHRkZWVwRXF1YWwoIHJ2WyAxIF0sIFsgJ3MnLCAnbycgXSwgJ3J2IHZhciBuYW1lcyB2YWx1ZScgKTtcbn0gKTtcblxudGVzdCggJ0NvbnN0cnVjdG9yIHdpdGggYmFkIHJ1bGVzJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgYmFkT3B0aW9ucyA9IE9iamVjdC5jbG9uZSggZGVmYXVsdE9wdGlvbnMgKTtcblx0YmFkT3B0aW9ucy5ydWxlcyA9ICdUaGlzIGlzIG5vdCBhIHJ1bGUuJztcblx0dHJ5IHtcblx0XHR2YXIgbHN5cyA9IG5ldyBMc3lzKCBiYWRPcHRpb25zICk7XG5cdH0gY2F0Y2ggKCBlICkge1xuXHRcdG9rKCBlLm1hdGNoKCAvcGFyc2UgZXJyb3IvZ2kgKSwgJ0JhZCBydWxlIHBhcnNlIGVycm9yIHRocm93bicgKTtcblx0fVxufSApO1xuXG50ZXN0KCAnQmFkIHZhcmlhYmxlcyBvcHRpb24nLCBmdW5jdGlvbiAoKSB7XG5cdHZhciBiYWRPcHRpb25zID0gT2JqZWN0LmNsb25lKCBkZWZhdWx0T3B0aW9ucyApO1xuXHRiYWRPcHRpb25zLnZhcmlhYmxlcyA9ICdUaGlzIGlzIG5vdCBhIHZhcmlhYmxlIGRlZmluaXRpb24uJztcblx0dHJ5IHtcblx0XHR2YXIgbHN5cyA9IG5ldyBMc3lzKCBiYWRPcHRpb25zICk7XG5cdH0gY2F0Y2ggKCBlICkge1xuXHRcdGNvbnNvbGUubG9nKCBlICk7XG5cdFx0b2soXG5cdFx0XHRlLm1hdGNoKCAvdmFyaWFibGUgZGVmL2dpICksXG5cdFx0XHQnQmFkIHZhcmlhYmxlIHBhcnNlIGVycm9yIHRocm93biBhcyBob3BlZCdcblx0XHQpO1xuXHR9XG59ICk7XG5cbnRlc3QoICdWYXJpYWJsZSBwYXJzaW5nJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgdmFyT3B0cyA9IE9iamVjdC5jbG9uZSggZGVmYXVsdE9wdGlvbnMgKTtcblx0dmFyT3B0cy52YXJpYWJsZXMgKz0gXCJcXG4jZGVmaW5lICRUZXN0IC0wLjVcIjtcblx0dmFyIGxzeXMgPSBuZXcgTHN5cyggdmFyT3B0cyApO1xuXHRlcXVhbCggbHN5cy52YXJpYWJsZXMuJEFTLCAyLCAncG9zaXRpdmUgaW50JyApO1xuXHRlcXVhbCggbHN5cy52YXJpYWJsZXMuJEwsIC0xLCAnbmVnYXRpdmUgaW50JyApO1xuXHRlcXVhbCggbHN5cy52YXJpYWJsZXMuJFcsIDAuNSwgJ3Bvc2l0aXZlIGZsb2F0JyApO1xuXHRlcXVhbCggbHN5cy52YXJpYWJsZXMuJFRlc3QsIC0wLjUsICduZWdhdGl2ZSBmbG9hdCcgKTtcbn0gKTtcblxudGVzdCggJ01hdGggcm91dGluZXMnLCBmdW5jdGlvbiAoKSB7XG5cdHZhciBsc3lzID0gbmV3IExzeXMoIGRlZmF1bHRPcHRpb25zICk7XG5cdGVxdWFsKCBsc3lzLmRzaW4oIDEgKSwgMC4wMTc0NTI0MDY0MzcyODM1MSwgJ3NpbicgKTtcblx0ZXF1YWwoIGxzeXMuZGNvcyggMSApLCAwLjk5OTg0NzY5NTE1NjM5MTMsICdzaW4nICk7XG59ICk7XG5cbi8vICMjIEdlbmVyYXRlIGNvbnRlbnRcblxudGVzdCggJ0dlbmVyYXRlZCBjb250ZW50JywgZnVuY3Rpb24gKCkge1xuXHQvLyBUZXN0IGVhY2ggZ2VuZXJhdGlvblxuXHRmb3IgKCB2YXIgZyA9IDE7IGcgPCBleHBlY3RDb250ZW50Lmxlbmd0aDsgZysrICkge1xuXHRcdC8vIExldCBub3QgYW4gZXJyb3Igc3RvcCB0aGUgbmV4dCB0ZXN0XG5cdFx0dHJ5IHtcblx0XHRcdHZhciBsc3lzID0gbmV3IExzeXMoIGRlZmF1bHRPcHRpb25zICk7XG5cdFx0XHRsc3lzLmdlbmVyYXRlKCBnICk7XG5cdFx0XHRlcXVhbCggbHN5cy5nZW5lcmF0aW9uLCBnLCAnbHN5cy5nZW5lcmF0aW9uICcgKyBnICk7XG5cdFx0XHRlcXVhbCggbHN5cy50b3RhbF9nZW5lcmF0aW9ucywgZywgJ3RvdGFsX2dlbmVyYXRpb25zICcgKyBnICk7XG5cdFx0XHRlcXVhbCggbHN5cy5jb250ZW50LCBleHBlY3RDb250ZW50WyBnIF0sICdjb250ZW50ICcgKyBnICk7XG5cdFx0fSBjYXRjaCAoIGUgKSB7XG5cdFx0XHRMT0dHRVIuZXJyb3IoIGUgKVxuXHRcdH1cblx0fVxufSApO1xuIl19
