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
var _INVOCATIONS = 0;

var log4javascript = console;
var LOGGER = console; // LOGGER || log4javascript.getLogger();

if ( !console ) {
	console = {};
	console.log = console.warn = console.debug = console.info = function () {};
}

var exports = module.exports = function Lsys( options ) {
	this.options = {
		el: null, // destination element
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
		generations_scale_lines: 10,
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

	this.initialize();
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

	this.invocations = ++_INVOCATIONS;
	this.canvas = document.createElement( 'canvas' );
	this.canvas.id = 'canvas' + this.invocations;
	this.canvas.width = this.options.canvas_width;
	this.canvas.height = this.options.canvas_height;
	this.options.el.appendChild( this.canvas ); // should be 'top'

	this.colour = this.options.colours[ 0 ];
	this.content = '';
	this.x = this.options.init_x || 0;
	this.y = this.options.init_y || this.options.canvas_height / 2;
	this.max_x = 0;
	this.max_y = 0;
	this.min_x = 0;
	this.min_y = 0;
	this.ctx = this.canvas.getContext( "2d" );
};

exports.prototype.setOptions = function ( options ) {
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

	this.content += 'G' + this.generation;

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
						LOGGER.debug( 'Condition not met' );
						return original;
					}

					ruleSuccessfullyApplied = true;
					var substituted = self.interploateVars( rule[ 2 ] );
					LOGGER.info(
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
	var self = this;
	var dir = 0;
	var states = [];

	// PRODUCTION_RULES:
	for ( var i = 0; i < this.content.length; i++ ) {
		var draw = true;
		self.penUp = false;
		// LOGGER.debug( 'Do '+i);
		switch ( this.content.charAt( i )
			.toLowerCase() ) {
		case 'g':
			i++;
			var getGenNumber = new RegExp( '.{' + i + '}(\\d+)' );
			this.generation = getGenNumber.exec( this.content );
			this.generation = this.generation ?
				parseInt( this.generation[ 1 ] ) : null;
			console.log( '---> Generation ' + this.generation );
			break;
		case 'f':
			// self.penUp = true; why pen up going forards? nuts.
			break;
		case 'c':
			self.setColour( parseInt( this.content.charAt( ++i ), 10 ) );
			draw = false;
			break;
		case '+':
			dir += self.options.angle;
			break;
		case '-':
			dir -= self.options.angle;
			break;
		case '[':
			states.push( [ dir, self.x, self.y, self.colour ] );
			draw = false;
			break;
		case ']':
			var state = states.pop();
			dir = state[ 0 ];
			self.x = state[ 1 ];
			self.y = state[ 2 ];
			self.colour = state[ 3 ];
			draw = true;
			break;
		};

		if ( draw ) {
			self.turtle_graph( dir );
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
	if ( this.options.generations_scale_lines > 0 ) {
		this.ctx.lineWidth = 1 + ( this.options.generations - this.generation ) *
			this.options.generations_scale_lines;
		console.log( 'Generation ', this.generation, this.ctx.lineWidth )
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
	LOGGER.debug( this.min_x + '->' + this.max_x );
	LOGGER.debug( this.min_y + '->' + this.max_y );
	var wi = Math.abs( this.min_x ) + this.max_x;
	var hi = Math.abs( this.min_y ) + this.max_y;
	LOGGER.debug( this.canvas.width + ',' + this.canvas.height );
	LOGGER.debug( wi + ',' + hi );
	var sx = this.canvas.width / wi;
	var sy = this.canvas.height / hi;
	LOGGER.debug( 'Scale: ' + sx + ',' + sy );

	this.canvas.width = this.canvas.width;

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
