/* LsysParametric.LsysMIDI.js */

var Log4js = require('Log4js');
var Midi   = require('jsmidgen');
var fs     = require('fs');
var Lsys   = require('../lib/LsysParametric.base');

// @param {object} options
var LsysMIDI = function LsysMIDI (options) {
    var self = this;
    options.outputPath = options.outputPath || 'lsys.midi';

    Lsys.prototype.constructor.call( this, options );
    this.currentPitch = 54;
    this.file  = new Midi.File();
    this.track = new Midi.Track();
    this.file.addTrack( this.track );
};

exports = module.exports = LsysMIDI;
exports.prototype = Object.create( Lsys.prototype );
exports.prototype.constructor = LsysMIDI;

// @todo use this to set voice
LsysMIDI.prototype.setColour = function () {}

// @override
LsysMIDI.prototype.render = function () {
    var dir = 0;
    var states = [];

    this.stepped = 0;

    // PRODUCTION_RULES:
    for (var i = 0; i < this.content.length; i++) {
        var draw = true;
        console.trace('Do '+i);
        switch (this.content.charAt(i).toLowerCase()) {
            // Set the generation
            case 'f':
                break;
            // Set colour
            case 'c':
                this.setColour(parseInt(this.content.charAt(++i), 10));
                draw = false;
                break;
            // Turn one way
            case '+':
                dir += this.options.angle;
                break;
            // Turn the other way
            case '-':
                dir -= this.options.angle;
                break;
            // Start a branch
            case '[':
                states.push([ dir, this.x, this.y, this.colour, this.stepped ]);
                draw = false;
                break;
            // End a branch
            case ']':
                var state = states.pop();
                dir = state[ 0 ];
                this.x = state[ 1 ];
                this.y = state[ 2 ];
                this.colour = state[ 3 ];
                this.stepped = state[ 4 ];
                draw = true;
                break;
        };

        if (draw) {
            this.addNote(dir);
            this.stepped++;
        }
    }

    console.debug('Leave default_generate_callback');
};


// Akin to turtle_graph
LsysMIDI.prototype.addNote = function (dir) {
    this.currentPitch += dir; // use scales here
    var note = Midi.Util.noteFromLsysMIDIPitch( this.currentPitch );
    this.track.addNote(0, note, 64);
};

LsysMIDI.prototype.finalise = function () {
    this.fs.writeFileSync( this.outputPath, file.toBytes(), 'binary');
};


