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

        this.window = options.window;

        if (! options.hasOwnProperty('el')){
            options.el = this.window.document.createElement( 'div' );
        }

        if (! options.el.getAttribute('id')){
            options.el.setAttribute('id', Guid.create() );
        }

        this.el = options.el;
        this.lsys = options.lsys;

        // Replace with templates later
        this.elementSettings.forEach( function (i) {
            var el = self.window.document.createElement(
                i.node === 'textarea'? 'textarea' : 'input' );
            el.setAttribute('id',  i.name);
            el.setAttribute('class', i.name);
            if (self.lsys.options[i.name] instanceof Array){
                el.value = self.lsys.options[i.name].join("\n");
            }
            else {
                el.value = typeof self.lsys.options[i.name] !== 'undefined'? self.lsys.options[i.name] : '';
            }
            self.el.appendChild( el );
            console.log('Set '+i.name+' = ' + self.lsys.options[i.name] );
        });

        var button = this.window.document.createElement( 'input' );
        button.type  = 'button';
        button.value = 'update';
        button.addEventListener('click', function (){
            self.lsys.recreate( );
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

});
