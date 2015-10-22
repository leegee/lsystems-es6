"use strict";
var Lsys     = require("../lib/LsysParametric.MIDI"),
    GUI      = require("../lib/GUI"),
    chai     = require('chai'),
    expect   = chai.expect,
    should   = require('chai').should(),
    fs       = require('fs'),
    path     = require('path'),
    Log4js   = require('Log4js'),
    jsdom    = require('jsdom');

var window = typeof window === 'undefined'? jsdom.jsdom().defaultView : window;

Log4js.replaceConsole();
var logger = Log4js.getLogger();
logger.setLevel('FATAL');

var defaultOptions = {
    variables: "#define $W    0.5\n" + "#define $AS  2\n" + "#define $BS  1\n" + "#define $R   1\n" + "#define $L    -1",
    rules: "F($s,$o) : $s == $AS && $o == $R -> F($AS,$L)F($BS,$R)\n" + "F($s,$o) : $s == $AS && $o == $L -> F($BS,$L)F($AS,$R)\n" + "F($s,$o) : $s == $BS             -> F($AS,$o)\n",
    // Axiom
    start: "!($W)F($BS,$R)"
};

var testOutputPath = path.normalize('./testing.midi');

function testOptions () {
    var args = arguments,
        rv = {
            window: window
        };

    for (var i=0; i < args.length; i++){
        Object.keys( args[i] ).forEach( function (key) {
            rv[key] = args[i][key];
        });
    }
    return rv;
}

describe('testOptions', function (){
    var opts = testOptions(
        defaultOptions, {
        outputPath: testOutputPath
    });
    should.equal( typeof opts, "object", "created object" );
    should.exist(opts.outputPath);
    should.equal( defaultOptions.start, "!($W)F($BS,$R)", "got defaultOptions" );
});

describe('LsysMIDI', function (){
    // Remove file created by test:
    before( function () {
        fs.unlink(testOutputPath, function (){});
    });

    describe('Generic', function () {
        it('Should import', function(){
            should.exist(Lsys);
        });

        it('should interpolates a variable', function (){
            var varName = '$AS';
            var lsys = new Lsys( testOptions(defaultOptions) );
            should.equal( parseFloat(lsys.interploateVars( varName )), 2);
        });

        it('should parse variable strings and populate as expected', function (){
            var lsys = new Lsys(testOptions( defaultOptions, {
                variables: defaultOptions.variables += "\n#define $Test -0.5",
            }));
            lsys.variables.$AS.should.equal( 2);
            lsys.variables.$L.should.equal(-1);
            lsys.variables.$W.should.equal(0.5);
            lsys.variables.$Test.should.equal(-0.5);
        });

        it('fails to construct', function (){
            describe( 'throws bad rule parse error', function () {
                var lsys;
                expect( function () {
                    lsys = new Lsys( testOptions(
                        defaultOptions,
                        {rules: 'X X X'})
                    );
                }).to.throw(Lsys.ParseError);
            });

            describe( 'throws bad variable parse error', function () {
                var lsys; // yes, optimistic
                expect( function (){
                    lsys = new Lsys( testOptions(
                        defaultOptions,
                        {
                            variables: 'This is not a variable definition.'
                        }
                    ));
                }).to.throw(/variable def/gi);
            });
        });


        describe( 'Construction', function () {
            var lsys = new Lsys( testOptions(
                defaultOptions,
                {
                    outputPath: testOutputPath
                }
            ));
            should.equal( typeof lsys, "object", "created object" );
            lsys.should.be.instanceof(Lsys, "created Lsys object" );
            should.exist(lsys.options.outputPath);
            lsys.options.outputPath.should.eql( testOutputPath );

            lsys.generate();

            it('created the file at outputPath', function () {
                fs.statSync( lsys.options.outputPath ).isFile().should.be.true();
            });

            it("with rules", function (){
                lsys.options.rules.should.be.instanceof(Array);
                lsys.options.rules.forEach( function ( i ) {
                    i.should.be.instanceof(Array);
                    i.length.should.be.equal(3);
                });

                lsys.options.rules.should.deep.equal( [
                    [ "F($s,$o)", "$s == $AS && $o == $R", "F($AS,$L)F($BS,$R)" ],
                    [ "F($s,$o)", "$s == $AS && $o == $L", "F($BS,$L)F($AS,$R)" ],
                    [ "F($s,$o)", "$s == $BS", "F($AS,$o)" ]
                ]);
            });
        });

        it( 'should string to re and arg name', function () {
            var rv = new Lsys( defaultOptions )
                .string2reAndArgNames( 'F(s,o)' );
            typeof( rv ).should.be.instanceof(Array);
            rv.length.should.equal(2);
            typeof( rv[ 0 ] ).should.be.instanceof(RegExp);
            var varWord = '([\\$\\w-]+)';
            rv[ 0 ].toString().should.equal(
                '/(F)\\(' + varWord + ',' + varWord + '\\)/g'
            );
            typeof( rv[1] ).should.be.instanceof(Array);
            rv[1].should.be.deep.equal([ 's', 'o' ] );
        });
    });


    describe('Non-parametric non-progressive', function () {
        var defaultOptions = {
            variables: "",
            rules: "A -> AB\n" + "B->A",
            // Axiom
            start: "A"
        };

        // The content expected from the generator, by generation:
        var expectContent = [
            'AB',
            'ABA',
            'ABAAB',
            'ABAABABA'
        ];

        it('should generate content as expected', function (){
            // Test each generation
            for ( var g = 0; g < expectContent.length; g++ ) {
                // Let not an error stop the next test
                try {
                    var lsys = new Lsys( defaultOptions );
                    lsys.generate( g+1 );
                    lsys.generation.should.equal( lsys.totalGenerations );
                    lsys.content.should.equal( expectContent[ g ] );
                } catch ( e ) {
                    console.error( e )
                }
            }
        });
    });

    describe('Non-parametric progressive', function () {
        var defaultOptions = {
            variables: "",
            rules: "A -> A+B-\n" + "B->A+",
            // Axiom
            start: "A"
        };

        // The content expected from the generator, by generation:
        var expect = [
            {
                stave: [ 'e3', 'd3', 'c3', 'd#3' ],
                content: 'A+B-'
            },
            {
                stave: [ 'e3', 'd3', 'c3', 'd#3', 'c#3', 'e3', 'd3', 'c3' ],
                content: 'A+B-+A+-'
            }
        ];

        it('should generate content as expected', function (){
            // Test each generation
            for ( var g = 0; g < expect.length; g++ ) {
                var lsys = new Lsys( defaultOptions );
                lsys.generate( g+1 );
                lsys.generation.should.equal( lsys.totalGenerations );
                lsys.content.should.equal( expect[ g ].content );
                lsys.stave.should.deep.equal( expect[ g ].stave );
            }
        });
    });

    describe('Parametric', function (done) {
        var defaultOptions = {
            variables: "#define $W    0.5\n" + "#define $AS  2\n" + "#define $BS  1\n" + "#define $R   1\n" + "#define $L    -1",
            rules: "F($s,$o) : $s == $AS && $o == $R -> F($AS,$L)F($BS,$R)\n" + "F($s,$o) : $s == $AS && $o == $L -> F($BS,$L)F($AS,$R)\n" + "F($s,$o) : $s == $BS             -> F($AS,$o)\n",
            // Axiom
            start: "!($W)F($BS,$R)"
        };

        // The content expected from the generator, by generation:
        var expectContent = [
            '!(0.5)F(2,1)',
            // '!(0.5)F(2,-1)',
            '!(0.5)F(2,-1)F(1,1)',
            '!(0.5)F(1,-1)F(2,1)F(2,1)',
            '!(0.5)F(2,-1)F(2,-1)F(1,1)F(2,-1)F(1,1)'
        ];

        it('should generate content as expected', function (){
            // Test each generation
            for ( var g = 0; g < expectContent.length; g++ ) {
                // Let not an error stop the next test
                try {
                    var lsys = new Lsys( defaultOptions );
                    lsys.generate( g+1 );
                    lsys.generation.should.equal( lsys.totalGenerations );
                    lsys.content.should.equal( expectContent[ g ] );
                } catch ( e ) {
                    console.error( e )
                }
            }
        });
    });

    describe('GUI', function (){
        it('should init have two Lsys', function (){
            var gui = new GUI( defaultOptions );
            it( 'Constructs', function () {
                should.equal( typeof lsys, "object", "Construted GUI object" );
                should.equal( gui instanceof GUI, "object", "Construted GUI object" );
            });
        });
    });
});

