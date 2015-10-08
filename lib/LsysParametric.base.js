/*

Sample Programs
===============

#define W   0.5
#define AS   2
#define BS   1
#define R    1
#define L   -1


 w : !(W)F(BS,R)
p1 : F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R)
p2 : F(s,o) : s == AS && o == L -> F(BS,L)F(AS,R)
p3 : F(s,o) : s == BS           -> F(AS,o)

p1 : F(s,o) : s == 2 && o ==  1 -> F(2,-1)F(1, 1)
p2 : F(s,o) : s == 2 && o == -1 -> F(1,-1)F(2, 1)
p3 : F(s,o) : s == 1 &&         -> F(2, o)

!(0.5)F(1,1)
!(0.5)F(2,1)
!(0.5)F(2,-1)F(1,1)
!(0.5)F(1,-1)F(2,1)F(2,1)

rule p2
F(1,-1)F(2,1)F(2,1)
rule p3

*/

// require('../bower_components/log4javascript-amd/js/log4javascript_production.js');
// LOGGER = log4javascript.getLogger("main");
// var appender = new log4javascript.InPageAppender();
// console.addAppender(appender);
// console.debug("This is a debugging message from the log4javascript in-page page");

const RAD = Math.PI / 180.0;

var exports = module.exports = function Lsys (options) {
    this.options = {
        start :               'F',
        variables :           '',
        rules :               null,
        angle :                30
    };

    this.setOptions(options);

    this.generation        = 0;
    this.totalGenerations = null;
    this.variables         = null;
    this.interpolateVarsRe = null;

    this.initialize();

    this.content = '';

    this.castRules();
    this.castVariables();
    this.interpolateVarsRe = new RegExp(/(\$\w+)/g);

    console.info('Variables:',this.variables);
    console.info('Rules:', this.options.rules);
};

exports.prototype.initialize = function (options) {
    if (options){
        this.setOptions(options);
    }
    if (this.options.initially
        && typeof this.options.initially === 'function'
    ){
        this.options.initially.call(this);
    }
};

exports.prototype.setOptions = function (options) {
    var self = this;
    self.options = self.options || {};
    options = options || {};
    if (typeof options !== 'object') {
        throw new TypeError('options was not an object, %O', options);
    }
    Object.keys(options).forEach(function (i) {
        // Cast string to number
        if (typeof options[ i ] === 'string' && options[ i ].match(
            /^\s*[.\d+]+\s*$/)) {
            options[ i ] = parseInt(options[ i ]);
        }
        self.options[ i ] = options[ i ];
    });
};

// Type casting when lost
exports.prototype.castVariables = function (str) {
    str = str || this.options.variables;
    if (!str) return;
    var rv = {};
    str.split(/[\n\r\f]+/).forEach(function (line) {
        // Detect
        var name2val = line.match(/^\s*(#define)?\s*(\$\w+)\s*(\S+)\s*$/);
        // Store
        if (name2val) {
            rv[ name2val[ 2 ] ] = name2val[ 3 ];
            // Cast
            if (rv[ name2val[ 2 ] ].match(/^(-+)?\d+(\.\d+)?$/)){
                rv[ name2val[ 2 ] ] = parseFloat(rv[ name2val[ 2 ] ]);
            }
        } else {
            throw ("Bad variable definition:\n" + name2val + "\non line: \n" +
                line);
        }
    });
    this.variables = rv;
    console.log('Set this.variables to ', rv);
    return rv;
};

/* Creates a strucure as follows:
    [ [to_match, condition, substitution ], ...]
    */
exports.prototype.castRules = function (str) {
    str = str || this.options.rules;
    var rv = [];

    // F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R) \n
    str.split(/[\n\r\f]+/).forEach(function (line) {
        if (line == '') return;
        var head_tail = line.match(
            /^\s*(.+?)\s*->\s*([^\n\r\f]+)\s*/
        );

        if (head_tail != null) {
            var match_condition = head_tail[ 1 ].match(
                /([^:]+)\s*:?\s*(.*?)\s*$/
            );
            var head = match_condition[ 1 ].match(/^(.+?)\s*$/);
            var rule = [
                head[ 1 ],
                match_condition[ 2 ],
                head_tail[ 2 ]
            ];
        } else {
            throw ('Parse error ' + line);
        }
        rv.push(rule);
    });

    this.options.rules = rv;
    return rv;
};

exports.prototype.generate = function (generations) {
    this.totalGenerations = generations;

    console.debug('Enter to create %d generations', this.totalGenerations);

    this.content = this.options.start;
    this.content = this.interploateVars(this.content);

    for (
        this.generation = 1; this.generation <= this.totalGenerations; this.generation++
    ) {
        this.applyRules();
        console.info( this.content );
    }

    this.render();
    this.finalise();

    console.debug('Leave generate with generation ', this.generation);
    return this;
};

exports.prototype.interploateVars = function (str) {
    var self = this;
    var rv = str.replace(
        this.interpolateVarsRe,
        function (match) {
            var f = self.variables && self.variables.hasOwnProperty(match) ?
                self.variables[ match ] : match;
            return parseFloat(f);
        }
    );
    console.log('Interpolate vars: %s ... %s', str, rv);
    return rv;
};

exports.prototype.string2reAndArgNames = function (str) {
    var self = this;
    var argNames = [];
    this.str2reRe = new RegExp(/(\w+)\(([^\)]+)\)/);

    var rv = str.replace(
        this.str2reRe,
        function (match, varname, argsCsv) {
            argNames = argsCsv.split(/\s*,\s*/);
            // Could cache these based on args.length:
            return '(' + varname + ')\\(' + argNames.map(function () {
                return '([\\$\\w-]+)'
            }) + '\\)';
        }
    );

    return [
        new RegExp(rv, 'g'),
        argNames
    ];
};

exports.prototype.applyRules = function () {
    var self = this;
    console.debug('Enter applyRules for generation ' + this.generation);
    var finalContent = '';

    // Itterate over atoms within the content?
    var atoms = self.content.match(/(.(\([^)]+\))?)/g);
    if (self.content != atoms.join('')) {
        console.ERROR(atoms);
        console.ERROR('atoms ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
        alert('Atomic regex failed, results will be wrong');
    }

    atoms.forEach(function (atom) {
        // Run production rules:
        var ruleNumber = 0;
        var ruleSuccessfullyApplied = false;

        self.options.rules.forEach(function (rule) {
            ruleNumber++;

            if (ruleSuccessfullyApplied) {
                console.log('Skip rule ' + ruleNumber +
                    ' as have made substituion');
                return;
            }

            // Re-write the rule to replace variables with literals, where possible:
            var _ = self.string2reAndArgNames(rule[ 0 ]);
            var rule2findRe = _[ 0 ];
            var ruleArgNames = _[ 1 ];
            console.log('Rule ' + ruleNumber + ' says find ' + rule[ 0 ] +
                ' in content of ' + atom);

            // Find the rule pattern (left-hand side of condition)
            // and replace if condition is met
            var atomAfterRuleApplied = atom.replace(
                rule2findRe,
                function replacement(original) {
                    /*  On entering this function, a match has been found
                            but rules have yet to be tested
                        */
                    // Ascribe variables
                    for (var i = 2; i < arguments.length - 2; i++) {
                        console.log("Let " + ruleArgNames[ i - 2 ] + ' = ' + arguments[
                            i ]);
                        // Set variables with values found
                        self.variables[ ruleArgNames[ i - 2 ] ] = arguments[ i ];
                    }

                    // Get the rule code:
                    var ruleConditionJs = self.interploateVars(rule[ 1 ]);
                    console.log('Rule ' + ruleNumber + ' condition: ' +
                        ruleConditionJs);

                    // Decide if the substitution take place
                    var ruleConditionMet = ruleConditionJs.length == 0 ?
                        true : eval(ruleConditionJs);

                    // No substitutions
                    if (!ruleConditionMet) {
                        console.log('Condition not met');
                        return original;
                    }

                    ruleSuccessfullyApplied = true;
                    var substituted = self.interploateVars(rule[ 2 ]);
                    console.log(
                        'Condition met:------> substituted result = ' + rule[ 2 ] +
                        '  RV== ' + substituted
                    );

                    return substituted;
                } // end of replacement function
            ); // end of replacement call

            // If the rule is not met, the replacement value will be undefined,
            // do not write this into the string:
            if (ruleSuccessfullyApplied) {
                atom = atomAfterRuleApplied;
                console.log('After fulfilled rule ' + ruleNumber +
                    ' was applied, atom is: ' + atom);
                return;
            }

        }); // Next rule

        finalContent += atom;
    }); // Next atom

    self.content = finalContent;

    console.log('After all rules were applied, content is: ', self.content);
    console.log(
        '# FINAL for generation ' + this.generation + '/' + this.totalGenerations +
        ' ############################ Content: ' + self.content
    );
};

/** To override **/
exports.prototype.render = function () {}

exports.prototype.finalise = function () {
    if (this.options.finally
        && typeof this.options.finally === 'function'
    ){
        this.options.finally.call(this);
    }
    console.info('Finalised');
};

