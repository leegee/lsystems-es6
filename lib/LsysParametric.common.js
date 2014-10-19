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

var LOGGER;
LOGGER = console;
LOGGER.log = function () {};

// require('../bower_components/log4javascript-amd/js/log4javascript_production.js');
// LOGGER = log4javascript.getLogger("main");
// var appender = new log4javascript.InPageAppender();
// LOGGER.addAppender(appender);
// LOGGER.debug("This is a debugging message from the log4javascript in-page page");
const RAD = Math.PI / 180.0;

var exports = module.exports = function Lsys(options) {
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
		time_scale_lines: 1,
		clearCanvas: true,
		colours: [
			"rgba(130,  90, 70, 0.8)",
			"rgba(33, 180, 24, 0.6)",
			"rgba(50, 210, 50, 0.5)",
			"rgba(70, 255, 70, 0.4)"
		]
	};

    this.setOptions(options);

	this.xoffset = 0;
	this.yoffset = 0;
	this.generation = 0;
	this.total_generations = null;
	this.variables = null;
	this.interpolateVarsRe = null;

	this.initialize();

	this.x = this.max_x = this.min_x = this.options.init_x || 0;
	this.y = this.max_y = this.min_y = this.options.init_y || 0;
	this.content = '';

	this.castRules();
	this.castVariables();
	this.interpolateVarsRe = new RegExp(/(\$\w+)/g);

	LOGGER.info('Variables: ');
	LOGGER.info(this.variables);
	LOGGER.info('Rules: ');
	LOGGER.info(this.options.rules);
};

exports.prototype.initialize = function (options) {
	this.canvas = this.options.canvas;
	this.canvas.id = 'canvas';
	this.colour = this.options.colours[ 0 ];
	this.ctx = this.canvas.getContext("2d");
	// Translate context to center of canvas:
	//	this.ctx.translate(0, this.canvas.height);
	// Flip context vertically
	//this.ctx.scale(1, -1);
};

exports.prototype.setOptions = function (options) {
	var self = this;
	options = options || {};
	if (typeof options !== 'object') {
		throw new TypeError('options was not an object, %O', options);
	}
	Object.keys(options)
		.forEach(function (i) {
			// Cast string to number
			if (typeof options[ i ] === 'string' && options[ i ].match(
				/^\s*[.\d+]+\s*$/)) {
				options[ i ] = parseInt(options[ i ]);
			}
			self.options[ i ] = options[ i ];
		});
};

exports.prototype.castVariables = function (str) {
	str = str || this.options.variables;
	if (!str) return;
	var rv = {};
	str.split(/[\n\r\f]+/)
		.forEach(function (line) {
			// Detect
			var name2val = line.match(/^\s*(#define)?\s*(\$\w+)\s*(\S+)\s*$/);
			// Store
			if (name2val) {
				rv[ name2val[ 2 ] ] = name2val[ 3 ];
				// Cast
				if (rv[ name2val[ 2 ] ].match(/^(-+)?\d+(\.\d+)?$/))
					rv[ name2val[ 2 ] ] = parseFloat(rv[ name2val[ 2 ] ]);
			} else {
				throw ("Bad variable definition:\n" + name2val + "\non line: \n" +
					line);
			}
		});
	this.variables = rv;
	return rv;
};

/* Creates a strucure as follows:
	[ [to_match, condition, substitution ], ...]
	*/
exports.prototype.castRules = function (str) {
	str = str || this.options.rules;
	var rv = [];
	// F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R) \n

	str.split(/[\n\r\f]+/)
		.forEach(function (line) {
			if (line == '') return;
			var head_tail = line.match(
				/^\s*(.+?)\s*->\s*([^\n\r\f]+)\s*/
			);

			if (head_tail != null) {
				var match_condition = head_tail[ 1 ].match(
					/([^:]+)\s*:?\s*(.*?)\s*$/
				);
				var head = match_condition[ 1 ].match(/^(.+?)\s*$/);
				var rule = [
					head[ 1 ],
					match_condition[ 2 ],
					head_tail[ 2 ]
				];
			} else {
				throw ('Parse error ' + line);
			}
			rv.push(rule);
		});

	this.options.rules = rv;
	return rv;
};

exports.prototype.dsin = function (radians) {
	return Math.sin(radians * RAD)
};

exports.prototype.dcos = function (radians) {
	return Math.cos(radians * RAD)
};

exports.prototype.generate = function (generations) {
	this.total_generations = generations;

	LOGGER.debug('Enter to create %d generations', this.total_generations);

	this.content = this.options.start;
	this.content = this.interploateVars(this.content);

	for (
		this.generation = 1; this.generation <= this.total_generations; this.generation++
	) {
		this.apply_rules();
        console.info( this.content );
	}

	this.render();

	this.finalise();

	LOGGER.debug('Leave generate');
	return this;
};

exports.prototype.interploateVars = function (str) {
	var self = this;
	var rv = str.replace(
		this.interpolateVarsRe,
		function (match) {
			return (typeof self.variables[ match ] != 'undefined') ?
				self.variables[ match ] : match;
		}
	);
	LOGGER.log('Interpolate vars: %s ... %s', str, rv);
	return rv;
};

exports.prototype.string2reAndArgNames = function (str) {
	var self = this;
	var argNames = [];
	this.str2reRe = new RegExp(/(\w+)\(([^\)]+)\)/);
	var rv = str.replace(
		this.str2reRe,
		function (match, varname, argsCsv) {
			argNames = argsCsv.split(/\s*,\s*/);
			// Could cache these based on args.length:
			return '(' + varname + ')\\(' + argNames.map(function () {
				return '([\\$\\w-]+)'
			}) + '\\)';
		}
	);
	return [
		new RegExp(rv, 'g'),
		argNames
	];
};

exports.prototype.apply_rules = function () {
	var self = this;
	LOGGER.debug('Enter apply_rules for generation ' + this.generation);

	var finalContent = '';

	// Itterate over atoms within the content?
	var atoms = self.content.match(/(.(\([^)]+\))?)/g);
	if (self.content != atoms.join('')) {
		LOGGER.ERROR(atoms);
		LOGGER.ERROR('atoms ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
		alert('Atomic regex failed, results will be wrong');
	}

	atoms.forEach(function (atom) {
		// Run production rules:
		var ruleNumber = 0;
		var ruleSuccessfullyApplied = false;

		self.options.rules.forEach(function (rule) {
			ruleNumber++;

			if (ruleSuccessfullyApplied) {
				LOGGER.log('Skip rule ' + ruleNumber +
					' as have made substituion');
				return;
			}

			// Re-write the rule to replace variables with literals, where possible:
			var _ = self.string2reAndArgNames(rule[ 0 ]);
			var rule2findRe = _[ 0 ];
			var ruleArgNames = _[ 1 ];
			LOGGER.log('Rule ' + ruleNumber + ' says find ' + rule[ 0 ] +
				' in content of ' + atom);

			// Find the rule pattern (left-hand side of condition)
			// and replace if condition is met
			var atomAfterRuleApplied = atom.replace(
				rule2findRe,
				function replacement(original) {
					/*  On entering this function, a match has been found
                            but rules have yet to be tested
                        */
					// Ascribe variables
					for (var i = 2; i < arguments.length - 2; i++) {
						LOGGER.log("Let " + ruleArgNames[ i - 2 ] + ' = ' + arguments[
							i ]);
						// Set variables with values found
						self.variables[ ruleArgNames[ i - 2 ] ] = arguments[ i ];
					}

					// Get the rule code:
					var ruleConditionJs = self.interploateVars(rule[ 1 ]);
					LOGGER.log('Rule ' + ruleNumber + ' condition: ' +
						ruleConditionJs);

					// Decide if the substitution take place
					var ruleConditionMet = ruleConditionJs.length == 0 ?
						true : eval(ruleConditionJs);

					// No substitutions
					if (!ruleConditionMet) {
						LOGGER.log('Condition not met');
						return original;
					}

					ruleSuccessfullyApplied = true;
					var substituted = self.interploateVars(rule[ 2 ]);
					LOGGER.log(
						'Condition met:------> substituted result = ' + rule[ 2 ] +
						'  RV== ' + substituted
					);

					return substituted;
				} // end of replacement function
			); // end of replacement call

			// If the rule is not met, the replacement value will be undefined,
			// do not write this into the string:
			if (ruleSuccessfullyApplied) {
				atom = atomAfterRuleApplied;
				LOGGER.log('After fulfilled rule ' + ruleNumber +
					' was applied, atom is: ' + atom);
				return;
			}

		}); // Next rule

		finalContent += atom;
	}); // Next atom

	self.content = finalContent;

	LOGGER.log('After all rules were applied, content is: ', self.content);
	LOGGER.log(
		'# FINAL for generation ' + this.generation + '/' + this.total_generations +
		' ############################ Content: ' + self.content
	);
};

exports.prototype.render = function () {
	var dir = 0;
	var states = [];

	this.stepped = 0;

	// PRODUCTION_RULES:
	for (var i = 0; i < this.content.length; i++) {
		var draw = true;
		this.penUp = false;
		// LOGGER.log('Do '+i);
		switch (this.content.charAt(i)
			.toLowerCase()) {
		// Set the generation
		case 'f':
			// this.penUp = true; why pen up going forards? nuts.
			break;
		// Set colour
		case 'c':
			this.setColour(parseInt(this.content.charAt(++i), 10));
			draw = false;
			break;
		// Turn one way
		case '+':
			dir += this.options.angle;
			break;
		// Turn the other way
		case '-':
			dir -= this.options.angle;
			break;
		// Start a branch
		case '[':
			states.push([ dir, this.x, this.y, this.colour, this.stepped ]);
			draw = false;
			break;
		// End a branch
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

		if (draw) {
			this.turtle_graph(dir);
			this.stepped++;
		}
	}
	LOGGER.info('Leave default_generate_callback');
};

exports.prototype.finalise = function () {
    if (this.options.finally
        && typeof this.options.finally === 'function'
    ){
        this.options.finally.call(this);
    }
    //this.resize();
	LOGGER.info('Finalised');
};

exports.prototype.turtle_graph = function (dir) {
	// LOGGER.debug('Move '+dir +' from '+this.x+','+this.y);

	var oldLOGGER = LOGGER;
	LOGGER = console;

	this.ctx.beginPath();
	if (this.options.time_scale_lines > 0) {
        this.ctx.lineWidth = this.options.line_width;
	}
    else if (this.options.line_width) {
		this.ctx.lineWidth = this.options.line_width;
	}
	this.ctx.moveTo(this.x, this.y);

	this.x += (this.dcos(dir) * this.options.turtle_step_x);
	this.y += (this.dsin(dir) * this.options.turtle_step_y);

	this.x += this.xoffset;
	this.y += this.yoffset;

	this.ctx.lineTo(this.x, this.y);
	this.ctx.closePath();
	if (!this.penUp) this.ctx.stroke();

	if (this.x > this.max_x) this.max_x = this.x;
	if (this.y > this.max_y) this.max_y = this.y;
	if (this.x < this.min_x) this.min_x = this.x;
	if (this.y < this.min_y) this.min_y = this.y;
	// LOGGER.debug('...to '+this.x+','+this.y);
};

exports.prototype.setWidth = function (px) {
    this.ctx.lineWidth = px;
};

exports.prototype.setColour = function (index) {
	this.colour = this.options.colours[ index ];
	this.ctx.strokeStyle = this.colour;
};

exports.prototype.resize = function () {
	LOGGER.debug('Min: %d , %d', this.min_x, this.min_y);
	LOGGER.debug('Max: %d , %d', this.max_x, this.max_y);
	var wi = (this.min_x < 0) ?
		Math.abs(this.min_x) + Math.abs(this.max_x) : this.max_x - this.min_x;
	var hi = (this.min_y < 0) ?
		Math.abs(this.min_y) + Math.abs(this.max_y) : this.max_y - this.min_y;
	if (this.max_y <= 0 || this.max_x <= 0) {
		alert('oops');
	}

	LOGGER.debug('Ctx: %d , %d', this.canvas.width, this.canvas.height);
	LOGGER.debug('Abs: %d , %d', wi, hi);
	var sx = this.canvas.width / wi;
	var sy = this.canvas.height / hi;
	LOGGER.debug('Scale: %d , %d', sx, sy);


	if (this.options.clearCanvas) {
		this.canvas.width = this.canvas.width;
	}

	// this.ctx.beginPath();
	// this.ctx.lineWidth = 3;
	// this.colour = this.options.colours[ 2 ];
	// this.ctx.strokeStyle = this.colour;
	// this.ctx.moveTo(this.min_x, this.min_y);
	// this.ctx.lineTo(this.max_x, this.max_y);
	// this.ctx.closePath();
	// this.ctx.stroke();

	this.ctx.scale(sx, sy);

	this.ctx.translate(
		this.options.turtle_step_x,
		this.options.turtle_step_y * -1
	);

	this.x = this.options.init_x || 0; // this.options.turtle_step_x || 0;

	this.y = this.options.init_y || this.options.canvas_height / 2;
	this.y -= this.min_y;

	this.render();
	console.debug('Resized');
};
