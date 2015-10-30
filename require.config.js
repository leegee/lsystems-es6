"use strict";

requirejs.config({
    //By default load any module IDs from js/lib
    // baseUrl: '.',
    paths: {
        "Log4js": '../bower_components/log4javascript/log4javascript',
        "jsx":  '../bower_components/requirejs-react-jsx/jsx',
        "react": "../bower_components/react/react-with-addons",
        "react-no-jsx/mixin": "node_modules/react-no-jsx/index",

        "JSXTransformer": "../bower_components/react/JSXTransformer",
        "text": "../bower_components/requirejs-text/text"

        // mustache: '../bower_components/mustache.js/mustache',
        // stache: '../bower_components/requirejs-mustache/stache'
    },
    shim : {
        "react": {
        "exports": "React"
        },
        "JSXTransformer": "JSXTransformer"
    },
    config: {
        jsx: {
            fileExtension: ".jsx",
            transformOptions: {
                harmony: true,
                stripTypes: false,
                inlineSourceMap: true
            },
            usePragma: false
        }
    }
});
