const RAD = Math.PI / 180.0;
var _invocations = 0;

if (!console){
	console = {};
	console.log = function(){};
	console.debug = function(){};
	console.info = function(){};
}

var Lsys = new Class({
	Implements: [Options],

	xoffset			: 0,
	yoffset			: 0,

	options: {
		el: null, // destination element
		start		: 'F',
		rules		: [
			{F: 'F[-FF]F[+FF]F'}
		],
		merge_duplicates : 1,
		duration 		: 48,
		scale 			: 'pentatonic',
		initial_note_decimal : 58,
		canvas_width		: 2000,
		canvas_height	: 800,
		angle			: 30,
		turtle_step_x	: 10,
		turtle_step_y	: 10,
		init_x			: null,
		init_y			: null,
		line_width		: 1,
		generations_scale_lines: true,
		colours			: [
//			"rgba(244, 0, 0, 0.75)",
//			"rgba(0, 244, 0, 0.75)",
//			"rgba(0, 0, 244, 0.75)",

			"rgba(130, 90, 70, 0.8)",
			"rgba(33, 180, 24, 0.6)",
			"rgba(50, 210, 50, 0.5)",
			"rgba(70, 255, 70, 0.4)"
		]
	},

	initialize: function( options ){
        Object.keys(options).each( function(i){
        		// Cast string to number
        		if (typeof options[i] === 'string' && options[i].match(/^\s*[.\d+]+\s*$/)) {
				options[i] = parseInt( options[i] );
        		}
        });
        options.rules = this.castRules(options.rules);
		this.setOptions(options);
		this.invocations = ++_invocations;
		this.canvas		= new Element('canvas', {
			id: 		'canvas'+this.invocations,
			width: 	this.options.canvas_width,
			height:	this.options.canvas_height
		}).inject( this.options.el, 'top' );
		this.colour		= this.options.colours[0];
		this.content		= '';
		this.x 			= this.options.init_x || 0;
		this.y 			= this.options.init_y || this.options.canvas_height/2;
		this.max_x 		= 0;
		this.max_y 		= 0;
		this.min_x 		= 0;
		this.min_y 		= 0;
		this.ctx			= this.canvas.getContext("2d");
	},

	castRules: function( str ){
		var rv = [];
		str.split(/[\n\r\f]+/).each( function(line){
			var head_tail = line.match(/^\s*(\w+)[:=]\s*(\S+)\s*/);
			var rule = {};
			rule[ head_tail[1] ] = head_tail[2];
			rv.push( rule );
		});
		console.log( rv );
		return rv;
	},

	dsin: function(radians){ return Math.sin(radians * RAD) },
	dcos: function(radians){ return Math.cos(radians * RAD) },

	generate: function( generations ) {
		console.debug( 'Enter generate for '+generations+' generations');
		var self = this;
		if (this.content.length == 0)
			self.content = this.options.start;

		for (var i=1; i <= generations; i++){
			console.debug( 'Generation '+i);
			this.apply_rules();
		}

		this.render();
		this.resize();
		this.finalise();
		console.debug( 'Leave generate -------------------------');
	},

	apply_rules: function() {
		var self = this;
		console.debug( 'Enter apply_rules' );
		var _new = [];

		self.options.rules.each( function( rule ){
			Object.keys(rule).each( function( to_match ){
				var re = new RegExp(to_match, 'g');
				self.content = self.content.replace( re, rule[to_match] );
			});
		});
	},

	render: function(){
		var self = this;
		var dir = 0;
		var states  = [];

		// PRODUCTION_RULES:
		for (var i=0; i < this.content.length; i++){
			var draw = true;
			// console.debug( 'Do '+i);
			switch (this.content.charAt(i).toLowerCase()){
				case 'c':
					self.setColour( parseInt( this.content.charAt( ++i ) ));
					break;
				case '+':
					dir += self.options.angle;
					break;
				case '-':
					dir -= self.options.angle;
					break;
				case '[':
					states.push([dir, self.x, self.y, self.colour]);
					draw = false;
					break;
				case ']':
					var state = states.pop();
					dir = state[0];
					self.x = state[1];
					self.y = state[2];
					self.colour = state[3];
					draw = true;
					break;
			};

			if (draw)
				self.turtle_graph( dir );
		}
		console.info('Leave default_generate_callback');
	},

	finalise: function(){
		console.debug( 'Finalised');
	},

	turtle_graph: function(dir){
		// console.debug( 'Move '+dir +' from '+this.x+','+this.y );

		this.ctx.beginPath();
		/*
		if (this.options.generations_scale_lines){
			this.ctx.lineWidth = this.options.generations
		}
		else
		*/
		if (this.options.line_width){
			this.ctx.lineWidth = this.options.line_width
		}
		this.ctx.moveTo( this.x, this.y );

		this.x += ( this.dcos(dir) * ( this.options.turtle_step_x ));
		this.y += ( this.dsin(dir) * ( this.options.turtle_step_y ));

		this.x += this.xoffset;
		this.y += this.yoffset;

		if (this.x > this.max_x) this.max_x = this.x;
		if (this.y > this.max_y) this.max_y = this.y;
		if (this.x < this.min_x) this.min_x = this.x;
		if (this.y < this.min_y) this.min_y = this.y;
		this.ctx.lineTo( this.x, this.y );
		this.ctx.closePath();
		this.ctx.stroke();
		// console.debug( '...to '+this.x+','+this.y );
	},

	setColour: function( index ){
		this.colour = this.options.colours[ index ];
		this.ctx.strokeStyle =  this.colour;
	},

	resize: function(){
		console.log(this.min_x +'->'+ this.max_x);
		console.log(this.min_y +'->'+ this.max_y);
		var wi = Math.abs( this.min_x )
			+ Math.abs( this.max_x );
		var hi = Math.abs( this.min_y )
			+ Math.abs( this.max_y );
		console.log( this.canvas.width +','+ this.canvas.height);
		console.log( wi+','+hi );
		var sx = this.canvas.width / wi;
		var sy = this.canvas.height / hi;
		console.log('Scale: '+ sx+','+sy );
		this.canvas.width = this.canvas.width;

		this.ctx.scale( sx, sy );

		this.x 			= this.options.init_x || 0;
		this.y 			= this.options.init_y || this.options.canvas_height/2;
		this.y -=  this.min_y;

		console.log( this.y);
		this.render();
	}
});



