if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require, exports, module) {
    "use strict";
    var Base = require('../lib/Base');

    const RAD = Math.PI / 180.0;

    function Lsys (options) {
        this.options = {
            start :               'F',
            variables :           '',
            rules :               null,
            angle :                30
        };

        this.initialize();

        console.debug('Variables:',this.variables);
        console.debug('Rules:', this.options.rules);
    }

    exports = module.exports = Lsys;
    exports.prototype = Object.create( Base.prototype );
    exports.prototype.constructor = Lsys;

    exports.prototype.generation        = 0;
    exports.prototype.generations = null;
    exports.prototype.variables         = null;
    exports.prototype.interpolateVarsRe = new RegExp(/(\$\w+)/g);

    exports.prototype.initialize = function (options) {
        if (options){
            this.setOptions(options);
        }

        this.content = '';

        this.castRules();
        this.castVariables();

        if (this.options.initially &&
            typeof this.options.initially === 'function'
        ){
            this.options.initially.call(this);
        }
    };

    // Type casting when lost
    exports.prototype.castVariables = function (str) {
        str = str || this.options.variables;
        var rv = {};

        if (typeof str !== 'undefined' && str.length > 0) {
            str.split(/[\n\r\f]+/).forEach(function (line) {
                // Detect
                var name2val = line.match(/^\s*(#define)?\s*(\$\w+)\s*(\S+)\s*$/);
                // Store
                if (name2val !== null) {
                    rv[ name2val[ 2 ] ] = name2val[ 3 ];
                    // Cast
                    rv[ name2val[2] ] = this.cast( rv[ name2val[2] ]);
                } else {
                    throw new exports.prototype.VariableError('On line:['+line+']');
                }
            }, this);
        }

        this.variables = rv;
        console.log('Set this.variables to ', rv);
        return rv;
    };

    exports.prototype.setgenerations = function (n){
        this.generations = n;
        return this.getgenerations();
    };

    exports.prototype.getgenerations = function (n){
        return this.generations;
    };

    /* Creates a strucure as follows:
        [ [to_match, condition, substitution ], ...]
    */
    exports.prototype.castRules = function (str) {
        str = str || this.options.rules;
        var rv = [];

        if (str === null){
            return rv;
        }

        // F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R) \n
        str.split(/[\n\r\f]+/).forEach(function (line) {
            if (line === '') return;
            var head_tail = line.match(
                /^\s*(.+?)\s*->\s*([^\n\r\f]+)\s*/
            );

            if (head_tail !== null) {
                var match_condition = head_tail[ 1 ].match(
                    /([^:]+)\s*:?\s*(.*?)\s*$/
                );
                var head = match_condition[ 1 ].match(/^(.+?)\s*$/);
                var rule = [
                    head[ 1 ],
                    match_condition[ 2 ],
                    head_tail[ 2 ]
                ];
                rv.push(rule);
            }

            else {
                throw new exports.prototype.ParseError('Error reading line:[' +line +']');
            }
        });

        this.options.rules = rv;
        return rv;
    };

    exports.prototype.generate = function (generations) {
        this.generations = generations;

        console.debug('Enter to create %d generations', this.generations);

        this.content = this.options.start;
        this.content = this.interploateVars(this.content);

        for (
            this.generation = 1; this.generation <= this.generations; this.generation++
        ) {
            this.applyRules();
        }

        this.render();
        this.finalise();

        this.generation --; // omg

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
                    return '([\\$\\w-]+)';
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
                        var ruleConditionMet = ruleConditionJs.length === 0 ?
                            true : eval(ruleConditionJs); // jshint ignore:line

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
            '# FINAL for generation ' + this.generation + '/' + this.generations +
            ' ############################ Content: ' + self.content
        );
    };

    /** To override **/
    exports.prototype.render = function () {};

    exports.prototype.finalise = function () {
        if (this.options.finally &&
            typeof this.options.finally === 'function'
        ){
            this.options.finally.call(this);
        }
        console.debug('Finalised');
    };

    exports.prototype.ParseError = function (message) {
        this.name = 'ParseError';
        this.message = message || 'Parse error';
        this.stack = (new Error()).stack;
    };

    exports.prototype.ParseError.prototype = new Error ();

    exports.prototype.OptionsError = function (message) {
        this.name = 'OptionsError';
        this.message = message || 'Options error';
        this.stack = (new Error()).stack;
    };

    exports.prototype.OptionsError.prototype = new Error ();

    exports.prototype.VariableError = function (message) {
        this.name = "Bad Variable Definition";
        this.message = message || '';
        this.stack = (new Error()).stack;
    };

    exports.prototype.VariableError.prototype = new Error ();

});
