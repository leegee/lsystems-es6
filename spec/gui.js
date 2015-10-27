"use strict";
var GUI      = require("../lib/GUI"),
    Controls = require('../lib/Controls'),
    Lsys     = require("../lib/LsysParametric.2d.js"),
    should   = require("chai").should(),
    Log4js   = require('Log4js'),
    jsdom    = require('jsdom');

Log4js.replaceConsole();
var logger = Log4js.getLogger();
logger.setLevel('DEBUG');

var document,
    window = jsdom.jsdom().defaultView;

window.onModulesLoaded = function (next) {
    jsdom.env(
        '<html><head/><body></body></html>',
        function (err, win){
            if (err) {
                throw err;
            }
            window = win;
            next();
        }
    );
};

var mockCanvas = {
    getContext: function () {
        return {
            translate: function () {}
        }
    }
};

describe('Test', function (){
    it('has window', function () {
        should.exist(window);
    });

    it('has document', function () {
        should.exist(window.document);
        var div = window.document.createElement('div')
        should.exist(div);
        div.nodeName.should.eql('DIV')
    });

    it('Should import', function(){
        should.exist(GUI);
    });
});

describe('GUI', function (){
    var gui = new GUI({
        window: window
    });

    it('should instantiate', function (){
        should.exist(gui);
    });

    gui.addLsys( Lsys, { canvas: mockCanvas });

    it('should have controls', function (){
        should.exist( gui.controls );
        gui.controls.should.be.instanceof( Array );
        gui.controls.should.be.length( 1 );
        gui.controls[0].should.be.instanceof( Controls );
        gui.controls[0].getElement().nodeName.should.eql('DIV');

        describe('DOM controls', function (){
            it('should have rulesIn values', function (){
                window.document.getElementsByClassName('rulesIn').length.should.be.gt(0);
            });
        });
    });

});
