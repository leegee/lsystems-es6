if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require, exports, module) {
    "use strict";
    var GUID = require('../lib/GUID');

    var Guid = new GUID();

    var Controls = function Controls (options) {
        var self = this;
        options = options || {};
        this.id = options.id;
        this.window = options.window;

        if (! options.hasOwnProperty('el')){
            options.el = this.window.document.createElement( 'div' );
        }
        options.el.setAttribute('id', this.id);

        if (! options.el.getAttribute('id')){
            options.el.setAttribute('id', Guid.create() );
        }

        this.el = options.el;
        this.lsys = options.lsys;

        // Replace with templates later
        this.elementSettings.forEach( function (i) {
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
            console.log('Set '+inputEl.getAttribute('id')+' = ' + self.lsys.options[i.name] );
        });

        var button = this.window.document.createElement( 'input' );
        button.type  = 'button';
        button.value = 'update';
        button.addEventListener('click', function (){
            // xxx rules type to str
            self.lsys.initialize( self.getValues() );
            self.lsys.generate();
        });
        self.el.appendChild( button );
    };

    exports  = module.exports = Controls;

    exports.prototype.elementSettings = [
        { node: 'text', name: 'start' },
        { node: 'text', name: 'wrapAngleAt' },
        { node: 'text', name: 'generations' },
        { node: 'textarea', name: 'variables' },
        { node: 'textarea', name: 'rules' },
    ];

    exports.prototype.getElement = function (options) {
        return this.el;
    };

    exports.prototype.getValues = function (){
        var userValues = {};
        this.elementSettings.forEach( function (i) {
            userValues[i.name] = this.window.document.getElementById(
                this.id + i.name
            ).value
        }, this);
    };

});
