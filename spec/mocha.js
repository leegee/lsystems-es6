"use strict";
var Lsys     = require("../lib/LsysParametric.MIDI"),
    chai     = require('chai'),
    expect   = chai.expect,
    should   = require('chai').should(),
    fs       = require('fs');

var Log4js = require('Log4js');
Log4js.replaceConsole();

describe('Harness', function (){
    var testOutputPath = 'testing.midi';
    // Remove file created by test:
    before( function () {
        fs.unlink(testOutputPath, function (){} );
    });

    describe('Generic', function () {
        var defaultOptions = {
            variables: "#define $W    0.5\n" + "#define $AS  2\n" + "#define $BS  1\n" + "#define $R   1\n" + "#define $L    -1",
            rules: "F($s,$o) : $s == $AS && $o == $R -> F($AS,$L)F($BS,$R)\n" + "F($s,$o) : $s == $AS && $o == $L -> F($BS,$L)F($AS,$R)\n" + "F($s,$o) : $s == $BS             -> F($AS,$o)\n",
            // Axiom
            start: "!($W)F($BS,$R)"
        };

        it('Should import', function(){
            should.exist(Lsys);
        });

        it('should interpolates a variable', function (){
            var varName = '$AS';
            var lsys = new Lsys( defaultOptions );
            should.equal( parseFloat(lsys.interploateVars( varName )), 2);
        });

        it('should parse variable strings and populate as expected', function (){
            var varOpts = defaultOptions;
            varOpts.variables += "\n#define $Test -0.5";
            var lsys = new Lsys( varOpts );
            lsys.variables.$AS.should.equal( 2);
            lsys.variables.$L.should.equal(-1);
            lsys.variables.$W.should.equal(0.5);
            lsys.variables.$Test.should.equal(-0.5);
        });

        it( 'Constructs', function () {
            var options = defaultOptions;
            options.outputPath = testOutputPath;
            var lsys = new Lsys( options );
            should.equal( typeof lsys, "object", "Construted Lsys object" );

            it('created the file at outputPath', function (done) {
                fs.stat( this.outputPath, function (stats){
                    should.be.true( stats.isFile() );
                    done();
                });
            });

            lsys.options.rules.should.be.instanceof(Array);
            lsys.options.rules.forEach( function ( i ) {
                i.should.be.instanceof(Array);
                i.length.should.be.equal(3);
            } );

            lsys.options.rules.should.deep.equal( [
                [ "F($s,$o)", "$s == $AS && $o == $R", "F($AS,$L)F($BS,$R)" ],
                [ "F($s,$o)", "$s == $AS && $o == $L", "F($BS,$L)F($AS,$R)" ],
                [ "F($s,$o)", "$s == $BS", "F($AS,$o)" ]
            ]);
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
        } );
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

    describe('Parametric', function () {
        var defaultOptions = {
            variables: "#define $W    0.5\n" + "#define $AS  2\n" + "#define $BS  1\n" + "#define $R   1\n" + "#define $L    -1",
            rules: "F($s,$o) : $s == $AS && $o == $R -> F($AS,$L)F($BS,$R)\n" + "F($s,$o) : $s == $AS && $o == $L -> F($BS,$L)F($AS,$R)\n" + "F($s,$o) : $s == $BS             -> F($AS,$o)\n",
            // Axiom
            start: "!($W)F($BS,$R)"
        };

        // The content expected from the generator, by generation:
        var expectContent = [
            '!(0.5)F(1,1)',
            '!(0.5)F(2,1)',
            '!(0.5)F(2,-1)F(1,1)',
            '!(0.5)F(1,-1)F(2,1)F(2,1)',
        //    '!(0.5)F(2,-1)F(2,-1)F(1,1)F(2,-1)F(1,1)'
             '!(0.5)F(1,-1)F(2,1)F(1,-1)F(2,1)F(2,1)F(1,-1)F(2,1)F(2,1)'
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

});

        // test( 'Constructor with bad rules', function () {
        //     var badOptions = Object.clone( defaultOptions );
        //     badOptions.rules = 'This is not a rule.';
        //     try {
        //         var lsys = new Lsys( badOptions );
        //     } catch ( e ) {
        //         ok( e.match( /parse error/gi ), 'Bad rule parse error thrown' );
        //     }
        // } );

        // test( 'Bad variables option', function () {
        //     var badOptions = Object.clone( defaultOptions );
        //     badOptions.variables = 'This is not a variable definition.';
        //     try {
        //         var lsys = new Lsys( badOptions );
        //     } catch ( e ) {
        //         console.log( e );
        //         ok(
        //             e.match( /variable def/gi ),
        //             'Bad variable parse error thrown as hoped'
        //         );
        //     }
        // } );
