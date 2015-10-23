"use strict";
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

var GUID   = require("../lib/GUID");
var should = require('chai').should();

describe('GUID', function (){
    it('Should import', function(){
        should.exist(GUID);
    });
    var creator = new GUID();
    var guid = creator.create();
    guid.should.match(/\w+?-\w+?-\w+?-\w+?-\w+?/);
});
