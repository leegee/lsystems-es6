if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require, exports, module) {
    "use strict";
    // var template = require('stache!controls');

    var GUID = require('../lib/GUID');
    var Guid = new GUID();

    var Controls = function Controls (options) {
        var self = this;
        options = options || {};
        this.id = options.id;
        this.window = options.window;

        if (! options.hasOwnProperty('el')){
            options.el = this.window.document.createElement( 'form' );
        }
        else if (options.el.nodeName !== 'FORM'){
            throw new Error('Bad el — should b form');
        }
        this.el = options.el;
        if (! this.el.getAttribute('id')){
            this.el.setAttribute('id', Guid.create() );
        }
        this.el.setAttribute('id', this.id);
        this.el.classList.add("controls");

        this.lsys = options.lsys;

        // Replace with templates later
        this.elementSettings.forEach( function (i) {
            var labelEl = self.window.document.createElement('label');
            labelEl.setAttribute('class', i.name);
            self.el.appendChild( labelEl );
            labelEl.innerHTML = i.name;

            var inputEl = self.window.document.createElement(
                i.node === 'textarea'? 'textarea' : 'input' );
            inputEl.setAttribute('id',  self.id + i.name);
            inputEl.setAttribute('class', i.name);
            if (self.lsys.options[i.name] instanceof Array){
                inputEl.value = self.lsys.options[i.name].join("\n");
            }
            else {
                inputEl.value = typeof self.lsys.options[i.name] !== 'undefined'? self.lsys.options[i.name] : '';
            }
            self.el.appendChild( inputEl );
            // console.debug('Set '+inputEl.getAttribute('id')+' = ' + self.lsys.options[i.name] );
        });

        var button = this.window.document.createElement( 'input' );
        button.type  = 'button';
        button.value = 'Update';
        button.addEventListener('click', function (){
            self.lsys.initialize( self.getValues() );
            self.lsys.generate();
        });
        self.el.appendChild( button );
    };

    exports  = module.exports = Controls;

    exports.prototype.elementSettings = [
        { node: 'text', name: 'start' },
        { node: 'textarea', name: 'rulesIn' },
        { node: 'text', name: 'wrapAngleAt' },
        { node: 'text', name: 'generations' },
        { node: 'textarea', name: 'variables' }
    ];

    exports.prototype.getElement = function (options) {
        return this.el;
    };

    exports.prototype.getValues = function (){
        var userValues = {};
        this.elementSettings.forEach( function (i) {
            userValues[i.name] = this.window.document.getElementById(
                this.id + i.name
            ).value;
        }, this);
        return userValues;
    };

});
