"use strict";
var GUI    = require("../lib/GUI"),
    Lsys   = require( "../lib/LsysParametric.2d.js" ),
    should = require('chai').should();

describe('GUI', function (){
    it('Should import', function(){
        should.exist(GUI);
    });

    var gui = new GUI( Lsys, {} );

    console.log('----', gui);

    it('Should instantiate', function (){
        should.exist(gui);
    });
});
