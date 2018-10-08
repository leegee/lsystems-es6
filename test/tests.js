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

"use strict";
const expect = require('chai').expect;
import { LsysParametric } from "../src/LsysParametric";

window.HTMLCanvasElement.prototype.getContext = function () {
	return {
		fillRect: function () { },
		clearRect: function () { },
		getImageData: function (x, y, w, h) {
			return {
				data: new Array(w * h * 4)
			};
		},
		putImageData: function () { },
		createImageData: function () { return [] },
		setTransform: function () { },
		drawImage: function () { },
		save: function () { },
		fillText: function () { },
		restore: function () { },
		beginPath: function () { },
		moveTo: function () { },
		lineTo: function () { },
		closePath: function () { },
		stroke: function () { },
		translate: function () { },
		scale: function () { },
		rotate: function () { },
		arc: function () { },
		fill: function () { },
		measureText: function () {
			return { width: 0 };
		},
		transform: function () { },
		rect: function () { },
		clip: function () { },
	};
}

window.HTMLCanvasElement.prototype.toDataURL = () => {
	return "";
}


// The content expected for the generation:
const expectContent = [
	'!(0.5)F(1,1)',
	'!(0.5)F(2,1)',
	'!(0.5)F(2,-1)F(1,1)',
	'!(0.5)F(1,-1)F(2,1)F(2,1)',
	'!(0.5)F(2,-1)F(2,-1)F(1,1)F(2,-1)F(1,1)'
];

// These options are fixed for every test:
const defaultOptions = {
	// An element into which the Lsys canvas can be inserted:
	el: document.createElement('div'),
	variables: "#define $W	  0.5\n" + "#define $AS  2\n" + "#define $BS  1\n" + "#define $R   1\n" + "#define $L	 -1",
	rules: "F($s,$o) : $s == $AS && $o == $R -> F($AS,$L)F($BS,$R)\n" + "F($s,$o) : $s == $AS && $o == $L -> F($BS,$L)F($AS,$R)\n" + "F($s,$o) : $s == $BS	           -> F($AS,$o)\n",
	// Axiom
	start: "!($W)F($BS,$R)",
	canvas: document.createElement('canvas')
};

describe('Constructor', () => {
	it('with legacy args', () => {
		const legacyOptions = {
			...defaultOptions,
			canvas: document.createElement('canvas')
		};
		delete legacyOptions.variables;
		const lsys = new LsysParametric(legacyOptions);
		expect(lsys).to.be.an("object", "Construted Lsys object");
	});

	it('with new parametric args', () => {
		var lsys = new LsysParametric(defaultOptions);
		expect(lsys).to.be.an("object", "Construted Lsys object");

		// NB MooTools, not native:
		expect(lsys.options.rules).to.be.an("array", "Rules array");
		lsys.options.rules.forEach((i) => {
			expect(i).to.be.an('array', 'Rule cast');
			expect(i).to.have.length(3, 'rule tuple');
		});

		expect(lsys.options.rules).to.deep.equal([
			["F($s,$o)", "$s == $AS && $o == $R", "F($AS,$L)F($BS,$R)"],
			["F($s,$o)", "$s == $AS && $o == $L", "F($BS,$L)F($AS,$R)"],
			["F($s,$o)", "$s == $BS", "F($AS,$o)"]
		],
			'Rules parsed'
		);
	});

	it('Interploates', function () {
		expect(
			new LsysParametric(defaultOptions).interploateVars('$AS')
		).to.equal('2', 'Interpolate variable');
	});

	it('processes string to re and arg name', function () {
		var rv = new LsysParametric(defaultOptions).string2reAndArgNames('F(s,o)');
		expect(rv).to.be.an('array', 'rv type');
		expect(rv).to.have.length(2, 'rv length');
		expect(rv[0]).to.be.a('regexp', 'rv regexp');

		const varWord = '\([\\$\\w-]+\)';
		expect(rv[0].toString()).to.equal('/\(F\)\\(' + varWord + ',' + varWord + '\\)/g', 'rv regexp');

		expect(rv[1]).to.be.an('array', 'rv var names type');
		expect(rv[1]).to.deep.equal(['s', 'o'], 'rv var names value');
	});

	it('fails to construct with bad rules', function () {
		const badOptions = {
			...defaultOptions,
			canvas: document.createElement('canvas')
		};
		badOptions.rules = 'This is not a rule.';
		expect(() => {
			new LsysParametric(badOptions);
		}).to.throw(/parse error/gi, 'Bad rule parse error thrown');
	});

	it('with bad variables option', function () {
		const badOptions = {
			...defaultOptions,
			canvas: document.createElement('canvas')
		};
		badOptions.variables = 'This is not a variable definition.';
		expect(() => { new Lsys(badOptions) }).to.throw(/variable def/gi, 'Bad variable parse error thrown as hoped');
	});
});

/*

test('Variable parsing', function () {
	var varOpts = Object.clone(defaultOptions);
	varOpts.variables += "\n#define $Test -0.5";
	var lsys = new Lsys(varOpts);
	equal(lsys.variables.$AS, 2, 'positive int');
	equal(lsys.variables.$L, -1, 'negative int');
	equal(lsys.variables.$W, 0.5, 'positive float');
	equal(lsys.variables.$Test, -0.5, 'negative float');
});

test('Math routines', function () {
	var lsys = new Lsys(defaultOptions);
	equal(lsys.dsin(1), 0.01745240643728351, 'sin');
	equal(lsys.dcos(1), 0.9998476951563913, 'sin');
});

// ## Generate content

test('Generated content', function () {
	// Test each generation
	for (var g = 1; g < expectContent.length; g++) {
		// Let not an error stop the next test
		try {
			var lsys = new Lsys(defaultOptions);
			lsys.generate(g);
			equal(lsys.generation, g, 'lsys.generation ' + g);
			equal(lsys.total_generations, g, 'total_generations ' + g);
			equal(lsys.content, expectContent[g], 'content ' + g);
		} catch (e) {
			console.error(e)
		}
	}
});

*/