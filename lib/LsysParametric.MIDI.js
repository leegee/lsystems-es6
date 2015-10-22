/* LsysParametric.LsysMIDI.js */
var Log4js = require('Log4js');
var Midi   = require('jsmidgen');
var fs     = require('fs');
var Lsys   = require('../lib/LsysParametric.base');

const PITCHES_PER_OCTAVE = 12;

// @param {object} options
function LsysMIDI (options) {
    options = options || {};
    Object.keys(this.options).forEach( function (key) {
        options[key] = options.hasOwnProperty(key)? options[key] : this.options[key];
    }, this);
    this.setOptions(options);

    Lsys.call( this, options );

    if (this.options.angle > 12){
        console.warn('Remember the option.angle is currently semitones: you have '+this.options.angle);
    }

    this.currentPitch = this.options.initialPitch;
    this.file  = new Midi.File();
    this.track = new Midi.Track();
    this.file.addTrack( this.track );
}

var exports = module.exports = LsysMIDI;
module.exports.prototype = Object.create( Lsys.prototype );
module.exports.prototype.constructor = LsysMIDI;
module.exports.prototype.stave = [];
module.exports.prototype.options = {
    initialPitch :        54,
    merge_duplicates :    1,
    duration :            48,
    scale :               'pentatonic',
    initial_note_decimal : 58,
    angle : 1,
    outputPath : 'lsys.midi'
};

module.exports.prototype.scales = {
    pentatonic : [3,2,2,3,2]
};

// @todo use this to set voice
module.exports.prototype.setColour = function () {};

// @override
module.exports.prototype.render = function () {
    var dir = 0;
    var states = [];
    this.stave = [];
    this.stepped = 0;

    // PRODUCTION_RULES:
    for (var i = 0; i < this.content.length; i++) {
        var draw   = true,
            noNote = false;

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
            // Ignore parameters for now:
            // case '(':
            //     // dangerous slurp, syntax error will hang sys
            //     while (this.content.charAt(i).toLowerCase() !== ')'){
            //         console.debug('skip ', this.content.charAt(i).toLowerCase());
            //         i++;
            //     }
            //     draw = false;
            //     break;
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
        }

        if (draw) {
            if (!noNote){
                this.addNote(dir);
                this.stepped++;
            }
        }
    }

    console.debug('Leave render');
};


// Akin to turtle_graph
module.exports.prototype.addNote = function (dir) {
    var pitch  = this.currentPitch % this.scales[this.options.scale].length;
    var octave = parseInt(
        this.currentPitch / PITCHES_PER_OCTAVE
    );

    // this.currentPitch += dir; // use scales here
    this.currentPitch = pitch + (PITCHES_PER_OCTAVE * octave);

    var note = Midi.Util.noteFromMidiPitch( this.currentPitch );
    if (typeof note !== 'string'){
        console.error('Failed to produce MIDI note after adding direction of '+dir+'to this.currentPitch to generate pitch of '+this.currentPitch);
    }
    this.track.addNote(0, note, 64);

    // For debugging/stave:
    this.stave.push( note );
};

module.exports.prototype.finalise = function () {
    console.debug("Write to ", this.options.outputPath);
    fs.writeFileSync( this.options.outputPath, this.file.toBytes(), 'binary');
    console.debug("Wrote to ", this.options.outputPath);
};


