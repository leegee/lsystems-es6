var GUID = require('../lib/GUID');

var Guid = new GUID();

var Controls = function Controls (options) {
    options = options || {};

    this.window = options.window;

    if (! options.hasOwnProperty('el')){
        options.el = this.window.document.createElement( 'div' );
    }

    if (! options.el.getAttribute('id')){
        options.el.setAttribute('id', Guid.create() );
    }

    this.el = options.el;

    this.elementSettings.forEach( function (i) {
        var el = this.window.document.createElement( i.node );
        el.setAttribute('name',  i.name);
        el.setAttribute('class', i.name);
        self.el.appendChild( el );
    });

    var button = this.window.document.createElement( 'input' );
    button.type = 'button';
    button.addEventListener('click', function (){
        self.recreate();
    });
};

var exports  = module.exports = Controls;

Controls.prototype.elementSettings = [
    { node: 'text', name: 'start' },
    { node: 'text', name: 'wrap_angle_at' },
    { node: 'text', name: 'generations' },
    { node: 'textarea', name: 'variables' },
    { node: 'textarea', name: 'rules' },
];

Controls.prototype.getElement = function (options) {
    return this.el;
};

