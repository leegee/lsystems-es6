import {
    Lsys
} from "../lib/LsysParametric";

import {
    presets
} from "../lib/presets";

// remember the original reacted to Knob, replicate with new input type=range

export class Ctrls {
    constructor() {}

    init() {
        // this.elTimeDisplay = document.createElement('div');
        // this.elTimeDisplay.setAttribute('class', 'timing');
        // this.elTimeDisplay.innerText = new Date().getTime();
        this.canvas = document.getElementById('lsys-canvas');
        this.midi = document.getElementById('midi');
        this.createMidi = document.getElementById('createMidi');
        this.generate = document.getElementById('generate');
        this.el_canvases = document.getElementById('canvases');
        this.contentDisplay = document.getElementById('contentDisplay');
        this.setupEventListerners();
        this.listPresets();
        this.loadPreset(0);
    }

    loadPreset(idx) {
        console.log('Load preset ', idx, presets[idx]);
        Object.keys(presets[idx]).forEach((i) => {
            console.log('set preset key %s to %s', i, presets[idx][i]);
            try {
                const el = document.getElementById(i);
                if (el.nodeName === 'INPUT') {
                    el.setAttribute('value', presets[idx][i]);
                } else if (el.nodeName === 'TEXTAREA') {
                    el.innerText = presets[idx][i];
                }
            } catch (e) {
                console.error('Could not set ' + i + '.value: missing GUI element? ', e);
            }
        });
        document.getElementById('title').setAttribute('text', presets[idx].title);
    }

    listPresets() {
        var ul = document.getElementById('presets');
        presets.forEach((i, j) => {
            const li = document.createElement('li');
            li.setAttribute('text', i.title);
            li.setAttribute('id', 'preset_' + j);
            li.addEventListener('click', (e) => {
                this.loadPreset(e.target.id.substr(7));
            });
            ul.appendChild(li);
        });
    }

    setupEventListerners() {
        this.generate.addEventListener('click', (e) => {
            console.log('Generate')
            this.generate.setAttribute('value', 'Generating...');
            this.generate.setAttribute('disabled', true);
            this.createMidi.setAttribute('disabled', true);

            var options = {};
            Object.keys(presets[0]).forEach((i) => {
                try {
                    options[i] = document.getElementById(i).value;
                } catch (e) {
                    console.error('Cannot assign options.%s from element of same name', i);
                }
            });

            // this.el_canvases.appendChild(elTimeDisplay);

            options.el = this.el_canvases;

            const lsys = new Lsys(options, this.canvas);
            lsys.generate(options.total_generations);
            // this.elTimeDisplay.innerText = 'Generated in ' + (new Date().getTime() - (elTimeDisplay.get('text'))) + ' ms';

            this.contentDisplay.setAttribute('value', lsys.content);
            this.generate.setAttribute('value', 'Generate');
            this.generate.setAttribute('disabled', false);
            this.createMidi.setAttribute('value', 'Generate MIDI');
            this.createMidi.setAttribute('disabled', false);
            return false;
        });

        this.createMidi.addEventListener('click', () => {
            this.createMidi.setAttribute('value', 'Hang on...')
            this.createMidi.setAttribute('disabled', true);
            fetch('/cgi-bin/fractal_plant_chords.cgi', {
                duration: document.getElementById('duration').value,
                angle: document.getElementById('angle').value,
                scale: document.getElementById('scale').value

            }).then(() => {
                this.playSound("/cgi-output/cgi.midi");
            }).catch(() => {
                console.error(e);
                alert('Failure :(');
                this.createMidi.set('value', 'Generate MIDI');
            })
        });
    }
}