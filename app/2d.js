import {
	Ctrls
} from '../lib/Ctrls';

document.addEventListener('DOMContentLoaded', () => {
	new Ctrls().init();
}, {
	passive: true
});