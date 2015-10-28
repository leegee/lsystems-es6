// http://lsys/browsify/eg/gui.html
require([
    "../lib/LsysParametric.2d.js",
    "../lib/Timeline.js",
    "../lib/GUI.js",
    "Log4js",
    "../lib/Presets"
], function (
    Lsys, Timeline, GUI, Log4js, presets
){
    // Log4js.replaceConsole();
    // var logger = Log4js.getLogger();
    // logger.setLevel('ERROR');

    var gui = new GUI();
    var args = presets[0];
    args.generations = 2;
    args.window = window;
    gui.addLsys( Lsys, args );

    args = presets[5];
    args.window = window;
    args.generations = 1;
    gui.addLsys( Lsys, args );

    gui.run();

});
