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

export class LsysParametric {
	options = {
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

	constructor(args) {
		this.setOptions(args);

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

		console.info('Variables: %O\nRules:\n%O', this.variables, this.options.rules);
	};

	initialize(options = {}) {
		this.colour = this.options.colours[0];
		if (!this.options.canvas) {
			throw new Error('No options.canvas!');
		}
		this.ctx = this.options.canvas.getContext("2d");
		if (!this.ctx) {
			throw new Error('No ctx from options.canvas!');
		}
		// Translate context to center of canvas:
		this.ctx.translate(this.options.canvas.width / 2, this.options.canvas.height / 2);
		// Flip context vertically
		if (this.options.initially
			&& typeof this.options.initially === 'function'
		) {
			this.options.initially.call(this);
		}
	};

	setOptions(options) {
		options = options || {};
		if (typeof options !== 'object') {
			throw new TypeError('options was not an object, %O', options);
		}
		Object.keys(options).forEach((i) => {
			if (typeof options[i] === 'string') {
				if (options[i].match(/^\s*[.\d+]+\s*$/)) {
					options[i] = parseFloat(options[i]);
				}
				else if (options[i].match(/^\d+$/)) {
					options[i] = Number(options[i]);
				}
			}
			this.options[i] = options[i];
		});
	};

	castVariables(str) {
		str = str || this.options.variables;
		if (!str) return;
		let rv = {};
		str.split(/[\n\r\f]+/).forEach((line) => {
			// Detect
			const name2val = line.match(/^\s*(#define)?\s*(\$\w+)\s*(\S+)\s*$/);
			// Store
			if (name2val) {
				rv[name2val[2]] = name2val[3];
				// Cast
				if (rv[name2val[2]].match(/^(-+)?\d+(\.\d+)?$/))
					rv[name2val[2]] = parseFloat(rv[name2val[2]]);
			} else {
				throw new Error("Bad variable definition:\n" + name2val + "\non line: \n" + line);
			}
		});
		this.variables = rv;
		return rv;
	};

	/* Creates a strucure as follows:
		[ [to_match, condition, substitution ], ...]
		*/
	castRules(str) {
		str = str || this.options.rules;
		const rv = [];

		// F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R) \n
		str.split(/[\n\r\f]+/).forEach((line) => {
			if (line === '') {
				return;
			}
			let rule = '';
			const head_tail = line.match(/^\s*(.+?)\s*->\s*([^\n\r\f]+)\s*/);

			if (head_tail != null) {
				const match_condition = head_tail[1].match(/([^:]+)\s*:?\s*(.*?)\s*$/);
				const head = match_condition[1].match(/^(.+?)\s*$/);
				rule = [
					head[1],
					match_condition[2],
					head_tail[2]
				];
			} else {
				throw new Error('Parse error ' + line);
			}
			rv.push(rule);
		});

		this.options.rules = rv;
		return rv;
	};

	dsin(radians) {
		return Math.sin(radians * RAD)
	};

	dcos(radians) {
		return Math.cos(radians * RAD)
	};

	generate(generations) {
		this.total_generations = generations;
		console.debug('Enter to create %d generations', this.total_generations);

		this.content = this.options.start;
		this.content = this.interploateVars(this.content);

		for (
			this.generation = 1; this.generation <= this.total_generations; this.generation++
		) {
			this.applyRules();
			console.info(this.content);
		}

		this.render();

		this.finalise();

		console.debug('Leave generate');
		return this;
	};

	interploateVars(str) {
		const rv = str.replace(
			this.interpolateVarsRe,
			(match) => {
				return (typeof this.variables[match] != 'undefined') ?
					this.variables[match] : match;
			}
		);
		console.log('Interpolate vars: %s ... %s', str, rv);
		return rv;
	};

	string2reAndArgNames(str) {
		let argNames = [];
		this.str2reRe = new RegExp(/(\w+)\(([^\)]+)\)/);

		const rv = str.replace(
			this.str2reRe,
			(match, varname, argsCsv) => {
				argNames = argsCsv.split(/\s*,\s*/);
				// Could cache these based on args.length:
				return '(' + varname + ')\\(' + argNames.map(() => {
					return '([\\$\\w-]+)'
				}) + '\\)';
			}
		);

		return [
			new RegExp(rv, 'g'),
			argNames
		];
	};

	applyRules() {
		console.debug('Enter applyRules for generation ' + this.generation);
		let finalContent = '';

		// Itterate over atoms within the content?
		const atoms = this.content.match(/(.(\([^)]+\))?)/g);
		if (this.content != atoms.join('')) {
			console.error(atoms);
			console.error('atoms ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
			throw new Error('Atomic regex failed, results would be wrong');
		}

		atoms.forEach((atom) => {
			// Run production rules:
			let ruleNumber = 0;
			let ruleSuccessfullyApplied = false;

			this.options.rules.forEach((rule) => {
				ruleNumber++;

				if (ruleSuccessfullyApplied) {
					console.log('Skip rule ' + ruleNumber + ' as have made substituion');
					return;
				}

				// Re-write the rule to replace variables with literals, where possible:
				const [rule2findRe, ruleArgNames] = this.string2reAndArgNames(rule[0]);
				console.log('Rule ' + ruleNumber + ' says find ' + rule[0] + ' in content of ' + atom);

				// Find the rule pattern (left-hand side of condition)
				// and replace if condition is met
				const atomAfterRuleApplied = atom.replace(
					rule2findRe,
					(original) => {
						/*  On entering this function, a match has been found
								but rules have yet to be tested
							*/
						// Ascribe variables
						for (let i = 2; i < arguments.length - 2; i++) {
							console.log("Let " + ruleArgNames[i - 2] + ' = ' + arguments[i]);
							// Set variables with values found
							this.variables[ruleArgNames[i - 2]] = arguments[i];
						}

						// Get the rule code:
						const ruleConditionJs = this.interploateVars(rule[1]);
						console.log('Rule ' + ruleNumber + ' condition: ' + ruleConditionJs);

						// Decide if the substitution take place
						let ruleConditionMet = ruleConditionJs.length === 0; // || eval ruleConditionMet

						if (!ruleConditionMet) {
							try {
								ruleConditionMet = eval(ruleConditionJs);
							} catch (e) {
								console.warn(e);
							}
						}

						// No substitutions
						if (!ruleConditionMet) {
							console.log('Condition not met');
							return original;
						}

						ruleSuccessfullyApplied = true;
						const substituted = this.interploateVars(rule[2]);
						console.log('Condition met:------> substituted result = ' + rule[2] + '  RV== ' + substituted);

						return substituted;
					} // end of replacement function
				); // end of replacement call

				// If the rule is not met, the replacement value will be undefined,
				// do not write this into the string:
				if (ruleSuccessfullyApplied) {
					atom = atomAfterRuleApplied;
					console.log('After fulfilled rule ' + ruleNumber + ' was applied, atom is: ' + atom);
					return;
				}

			}); // Next rule

			finalContent += atom;
		}); // Next atom

		this.content = finalContent;

		console.log('After all rules were applied, content is: ', this.content);
		console.log(
			'# FINAL for generation ' + this.generation + '/' + this.total_generations +
			' ############################ Content: ' + this.content
		);
	};

	render() {
		let dir = 0;
		const states = [];

		this.stepped = 0;

		// PRODUCTION_RULES:
		for (let i = 0; i < this.content.length; i++) {
			let draw = true;
			this.penUp = false;
			// console.log('Do '+i);
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
					states.push([dir, this.x, this.y, this.colour, this.stepped]);
					draw = false;
					break;
				// End a branch
				case ']':
					const state = states.pop();
					dir = state[0];
					this.x = state[1];
					this.y = state[2];
					this.colour = state[3];
					this.stepped = state[4];
					draw = true;
					break;
			};

			if (draw) {
				this.turtle_graph(dir);
				this.stepped++;
			}
		}
		console.info('Leave default_generate_callback');
	};

	finalise() {
		if (this.options.finally
			&& typeof this.options.finally === 'function'
		) {
			this.options.finally.call(this);
		}
		this.resize();
		console.info('Finalised');
	};

	turtle_graph(dir) {
		// console.debug('Move '+dir +' from '+this.x+','+this.y);

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
		// console.debug('...to '+this.x+','+this.y);
	};

	setWidth(px) {
		this.ctx.lineWidth = px;
	};

	setColour(index) {
		this.colour = this.options.colours[index];
		this.ctx.strokeStyle = this.colour;
	};

	resize() {
		console.debug('Min: %d , %d', this.min_x, this.min_y);
		console.debug('Max: %d , %d', this.max_x, this.max_y);
		const wi = (this.min_x < 0) ?
			Math.abs(this.min_x) + Math.abs(this.max_x) : this.max_x - this.min_x;
		const hi = (this.min_y < 0) ?
			Math.abs(this.min_y) + Math.abs(this.max_y) : this.max_y - this.min_y;
		if (this.max_y <= 0 || this.max_x <= 0) {
			throw new RangeError('Max_x or max_y out of bounds');
		}

		const sx = this.options.canvas.width / wi;
		const sy = this.options.canvas.height / hi;

		if (this.options.clearCanvas) {
			this.options.canvas.width = this.options.canvas.width;
		}

		this.ctx.scale(sx, sy);

		this.x = this.options.init_x || 0; // this.options.turtle_step_x || 0;
		this.y = this.options.init_y || this.options.canvas_height / 2;
		this.y -= this.min_y;

		this.render();
		console.debug('Resized');
	};
}
