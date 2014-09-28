const RAD = Math.PI / 180.0;
var _invocations = 0;

if ( !console ) {
	console = {};
	console.log = function () {};
	console.debug = function () {};
	console.info = function () {};
}

window.requestAnimFrame = ( function () {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function ( callback ) {
			window.setTimeout( callback, 1000 / 60 );
		};
} )();

var Lsys3d = new Class( {
	Implements: [ Options ],

	xoffset: 0,
	yoffset: 0,

	options: {
		el: null, // destination element
		start: 'F',
		rules: [ {
			F: 'F[-FF]F[+FF]F'
		} ],
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
		colours: [
			0xAA9988, // "rgba(130, 90, 70, 0.8)",
			0x119909, // "rgba(33, 180, 24, 0.6)",
			0x33EE33, // "rgba(50, 210, 50, 0.5)",
			0x44FF77 //"rgba(70, 255, 70, 0.4)"
		]
	},

	initialize: function ( options ) {
		Object.keys( options )
			.each( function ( i ) {
				// Cast string to number
				if ( typeof options[ i ] === 'string' && options[ i ].match(
					/^\s*[.\d+]+\s*$/ ) ) {
					options[ i ] = parseInt( options[ i ] );
				}
			} );
		options.rules = this.castRules( options.rules );
		this.setOptions( options );

		var mouseX = 0,
			mouseY = 0,
			windowHalfX = window.innerWidth / 2,
			windowHalfY = window.innerHeight / 2;

		this.invocations = ++_invocations;
		this.colour = this.options.colours[ 0 ];
		this.content = '';
		this.x = this.options.init_x || 0;
		this.y = this.options.init_y; // || this.options.canvas_height/2;
		this.z = this.options.init_z || 0;
		this.max_x = 0;
		this.max_y = 0;
		this.min_x = 0;
		this.min_y = 0;

		var container = new Element( 'div' );
		$( this.options.el )
			.adopt( container );
		this.camera = new THREE.PerspectiveCamera(
			33,
			window.innerWidth / window.innerHeight,
			1,
			10000
		);
		this.camera.position.y = 40;
		this.camera.position.z = 700;
		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( this.renderer.domElement );
		this.scene.add( this.camera );
		this.camera.position.z = 300;

		var pointLight = new THREE.PointLight( 0xFFFFFF );
		pointLight.position.x = 100;
		pointLight.position.y = 50;
		pointLight.position.z = 130;
		this.scene.add( pointLight );

		var planeGeo = new THREE.PlaneGeometry( 400, 200, 10, 10 );
		var planeMat = new THREE.MeshLambertMaterial( {
			color: 0xFFFFFF
		} );
		var plane = new THREE.Mesh( planeGeo, planeMat );
		plane.rotation.x = -Math.PI / 2;
		plane.position.y = 0;
		plane.receiveShadow = true;
		this.scene.add( plane );

		if ( !this.holder ) {
			this.holder = new THREE.Object3D();
			this.scene.add( this.holder );
			console.debug( 'Made ground' );
		}

		this.material = new THREE.MeshLambertMaterial( {
			color: this.colour
		} );

		this.renderer.render( this.scene, this.camera );
	},

	setDatGui: function () {
		var gui = new dat.GUI();
		gui.add( this.camera.position, 'x', 0, 1000 );
		gui.add( this.camera.position, 'y', 0, 1000 );
		gui.add( this.camera.position, 'z' )
			.min( 0 )
			.max( 1000 )
			.step( 10 );

		gui.add( this.holder.rotation, 'x', 0, 10 );
		gui.add( this.holder.rotation, 'y', 0, 1000 );
		gui.add( this.holder.rotation, 'z', 0, 1000 );

		//this.gui.add(this.camera.position, 'z', 0, 500, 1000);
	},

	castRules: function ( str ) {
		var rv = [];
		str.split( /[\n\r\f]+/ )
			.each( function ( line ) {
				var head_tail = line.match( /^\s*(\w+)[:=]\s*(\S+)\s*/ );
				var rule = {};
				rule[ head_tail[ 1 ] ] = head_tail[ 2 ];
				rv.push( rule );
			} );
		console.log( rv );
		return rv;
	},

	dsin: function ( radians ) {
		return Math.sin( radians * RAD )
	},
	dcos: function ( radians ) {
		return Math.cos( radians * RAD )
	},

	generate: function ( generations ) {
		console.debug( 'Enter generate for ' + generations + ' generations' );
		var self = this;
		if ( this.content.length == 0 )
			self.content = this.options.start;

		for ( var i = 1; i <= generations; i++ ) {
			this.apply_rules();
		}

		this.render();

		// Schedule rendering:
		var self = this;
		( function animloop() {
			requestAnimFrame( animloop );
			self.renderer.render( self.scene, self.camera );
		} )();

		console.debug( 'Leave generate -------------------------' );
	},

	apply_rules: function () {
		var self = this;
		console.debug( 'Enter apply_rules' );
		var _new = [];

		self.options.rules.each( function ( rule ) {
			Object.keys( rule )
				.each( function ( to_match ) {
					var re = new RegExp( to_match, 'g' );
					self.content = self.content.replace( re, rule[ to_match ] );
				} );
		} );
	},

	render: function () {
		var self = this;
		var dir = 0;
		var states = [];

		// PRODUCTION_RULES:
		for ( var i = 0; i < this.content.length; i++ ) {
			var draw = true;
			// console.debug( 'Do '+i);
			switch ( this.content.charAt( i )
				.toLowerCase() ) {
			case 'c':
				self.setColour( parseInt( this.content.charAt( ++i ) ) );
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

			if ( draw ) self.turtle_graph( dir );
		}

		this.setDatGui();
		console.info( 'Leave default_generate_callback' );
	},

	turtle_graph: function ( dir ) {
		// console.debug( 'Move '+dir +' from '+this.x+','+this.y );
		var add2x = ( this.dcos( dir ) * ( this.options.turtle_step_x ) );
		var add2y = ( this.dsin( dir ) * ( this.options.turtle_step_y ) );

		this.material = new THREE.MeshLambertMaterial( {
			color: this.colour
		} );

		//      this.ctx.moveTo( this.x, this.y );

		var geo = new THREE.CylinderGeometry(
			Math.abs( add2x ), // radiusTop
			Math.abs( add2x ), // radiusBottom,
			Math.abs( add2x ), // segmentsRadius,
			100, // segmentsHeight
			false // openEnded
		);

		var mesh = new THREE.Mesh( geo, this.material );
		mesh.castShadow = mesh.receiveShadow = true;

		mesh.position.y = this.x;
		mesh.position.x = this.y; // - 500;
		mesh.position.z = 0;
		mesh.rotation.x = 0;
		mesh.rotation.y = 0;
		mesh.rotation.z = 0;

		this.holder.add( mesh );

		this.renderer.render( this.scene, this.camera );

		this.x += add2x;
		this.y += add2y;

		//  console.debug( '...to '+this.x+','+this.y );
	},

	setColour: function ( index ) {
		this.colour = this.options.colours[ index ];
		// this.ctx.strokeStyle =  this.colour;
	}
} );
