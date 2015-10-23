define(function(require, exports, module) {

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

	this.initialize();

	this.x = this.max_x = this.min_x = this.options.init_x || 0;
	this.y = this.max_y = this.min_y = this.options.init_y || 0;

	console.debug('Variables: %O\nRules:\n%O', this.variables, this.options.rules);
}

var exports = module.exports = Lsys;
exports.prototype = Object.create(LsysBase.prototype);
exports.prototype.constructor = Lsys;
exports.prototype.xoffset = 0;
exports.prototype.yoffset = 0;
exports.prototype.min_x = 0;
exports.prototype.min_y = 0;
exports.prototype.max_x = 0;
exports.prototype.max_y = 0;

exports.prototype.initialize = function (options) {
    LsysBase.prototype.initialize.call(this, options);

    if (! this.options.canvas){
        throw new Error("No canvas supplied");
    }
    this.ctx = this.options.canvas.getContext("2d");

	this.colour = this.options.colours[ 0 ];
	// Translate context to center of canvas:
	this.ctx.translate( this.options.canvas.width/2, this.options.canvas.height/2);
	// Flip context vertically
    if (this.options.initially &&
        typeof this.options.initially === 'function'
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
	return Math.sin(radians * RAD);
};

exports.prototype.dcos = function (radians) {
	return Math.cos(radians * RAD);
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
		}

		if (draw) {
			this.turtle_graph(dir);
			this.stepped++;
		}
	}
	console.debug('Leave default_generate_callback');
};

exports.prototype.finalise = function () {
    if (this.options.finally &&
        typeof this.options.finally === 'function'
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

	var wi = this.min_x < 0 ?
		Math.abs(this.min_x) + Math.abs(this.max_x)
        : this.max_x - this.min_x;
	var hi = this.min_y < 0 ?
		Math.abs(this.min_y) + Math.abs(this.max_y)
        : this.max_y - this.min_y;

	var sx = this.options.canvas.width / wi,
	    sy = this.options.canvas.height / hi;

    console.debug('Size ',wi,hi);
    console.debug('Scale ',sx,sy);

	if (this.options.clearCanvas) {
		this.options.canvas.width = this.options.canvas.width;
	}

	this.ctx.scale(sx, sy);

    if (this.min_x < 0){
        this.x = this.min_x *-1;
    } else {
        this.x = this.options.init_x || 1; // 0
    }

    if (this.min_y < 0) {
        this.y = this.min_y *-1;
    } else {
        this.y = this.options.init_y || parseInt(this.options.canvas_height / 2);
        this.y -= this.min_y;
    }

    console.info('Re-render initial X,Y = ', this.x, this.y);

	this.render();
	console.debug('Resized');
};

});
