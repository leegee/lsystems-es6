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
            i.node === 'textarea'? i.node : 'input' );
        el.setAttribute('name',  i.name);
        el.setAttribute('class', i.name);
        if (self.lsys.options[i.name] instanceof Array){
            el.value = self.lsys.options[i.name].join("\n");
        } else {
            el.value = self.lsys.options[i.name]? self.lsys.options[i.name] : '';
        }
        self.el.appendChild( el );
    });

    var button = this.window.document.createElement( 'input' );
    button.type  = 'button';
    button.value = 'update';
    button.addEventListener('click', function (){
        self.lsys.recreate( );
    });
    self.el.appendChild( button );
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

