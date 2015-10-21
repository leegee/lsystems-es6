/*

Sample Programs
===============

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

// require('../bower_components/log4javascript-amd/js/log4javascript_production.js');
// LOGGER = log4javascript.getLogger("main");
// var appender = new log4javascript.InPageAppender();
// console.addAppender(appender);
// console.debug("This is a debugging message from the log4javascript in-page page");

const RAD = Math.PI / 180.0;

var LsysBase = require('../lib/LsysParametric.base');

function Lsys (options) {
    this.options = {
		start :               'F',
		variables :           '',
		rules :               null,
		merge_duplicates :    1,
		duration :            48,
		scale :               'pentatonic',
		initial_note_decimal : 58,
		canvas_width :         2000,
		canvas_height :        800,
		angle :                30,
		turtle_step_x :        10,
		turtle_step_y :        10,
		init_x :               null,
		init_y :               null,
		line_width :           1,
		time_scale_lines :     1,
		clearCanvas :          true,
		colours : [
			"rgba(130,  90, 70, 0.8)",
			"rgba(33, 180, 24, 0.6)",
			"rgba(50, 210, 50, 0.5)",
			"rgba(70, 255, 70, 0.4)"
		]
	};

    this.setOptions(options);

	this.xoffset           = 0;
	this.yoffset           = 0;
	this.generation        = 0;
	this.totalGenerations = null;
	this.variables         = null;
	this.interpolateVarsRe = null;

	this.initialize();

	this.x = this.max_x = this.min_x = this.options.init_x || 0;
	this.y = this.max_y = this.min_y = this.options.init_y || 0;
	this.content = '';

	this.castRules();
	this.castVariables();
	this.interpolateVarsRe = new RegExp(/(\$\w+)/g);

	console.debug('Variables: %O\nRules:\n%O', this.variables, this.options.rules);
};

var exports = module.exports = Lsys;
exports.prototype = Object.create(LsysBase.prototype);
exports.prototype.constructor = Lsys;

exports.prototype.initialize = function (options) {
    if (! this.options.canvas){
        throw new Error("No canvas supplied");
    }
    this.ctx = this.options.canvas.getContext("2d");
	this.colour = this.options.colours[ 0 ];
	// Translate context to center of canvas:
	this.ctx.translate( this.options.canvas.width/2, this.options.canvas.height/2);
	// Flip context vertically
    if (this.options.initially
        && typeof this.options.initially === 'function'
    ){
        this.options.initially.call(this);
    }
};

exports.prototype.getCanvas = function () {
    return this.canvas;
};

exports.prototype.setCanvas = function (canvas) {
    this.canvas = canvas;
};

exports.prototype.dsin = function (radians) {
	return Math.sin(radians * RAD)
};

exports.prototype.dcos = function (radians) {
	return Math.cos(radians * RAD)
};

exports.prototype.render = function () {
	var dir = 0;
	var states = [];

	this.stepped = 0;

	// PRODUCTION_RULES:
	for (var i = 0; i < this.content.length; i++) {
		var draw = true;
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
	console.debug('Leave default_generate_callback');
};

exports.prototype.finalise = function () {
    if (this.options.finally
        && typeof this.options.finally === 'function'
    ){
        this.options.finally.call(this);
    }
    this.resize();
	console.debug('Finalised');
};

exports.prototype.turtle_graph = function (dir) {
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

exports.prototype.setWidth = function (px) {
    this.ctx.lineWidth = px;
};

exports.prototype.setColour = function (index) {
	this.colour = this.options.colours[ index ];
	this.ctx.strokeStyle = this.colour;
};

exports.prototype.resize = function () {
	console.debug('Min: %d , %d', this.min_x, this.min_y);
	console.debug('Max: %d , %d', this.max_x, this.max_y);
	var wi = (this.min_x < 0) ?
		Math.abs(this.min_x) + Math.abs(this.max_x) : this.max_x - this.min_x;
	var hi = (this.min_y < 0) ?
		Math.abs(this.min_y) + Math.abs(this.max_y) : this.max_y - this.min_y;
	if (this.max_y <= 0 || this.max_x <= 0) {
        alert('oops');
        throw new RangeError('Max_x or max_y out of bounds');
	}

	var sx = this.options.canvas.width / wi,
	    sy = this.options.canvas.height / hi;

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
