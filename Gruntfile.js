module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js',
        // 'app/*.js',
        // 'spec/*.js',
        'lib/*.js'
      ],
      options: {
        esnext: true,
        globals: {
          jQuery: true
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          hostname: '*',
          keepalive: true
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['spec/midi.mocha.js']
      }
    },

    browserify: {
      dist: {
        files: {
            // app/gui.js -o build/bundle-gui.js
          'build/bundle-gui.js': [
            'app/gui.js'
          ]
        },
        options: {}
      }
    }

    // watch: {
    //   files: ['<%= jshint.files %>'],
    //   tasks: ['jshint']
    // }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-browserify');
  // grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint']);

  grunt.registerTask('see', ['mochaTest', 'browserify', 'connect']);

  /** Move from package.json
  "scripts": {
    "miditest": "mocha --check-leaks --full-trace --ui tdd spec/midi.mocha.js",
    "test": "browserify spec/tests.js -o build/tests-bundle-2d-gui.js --debug --verbose; node build/tests-bundle-2d.js",
    "build2d": "browserify app/2d.js -o build/bundle-2d.js",
    "build3d": "browserify app/3d.js -o build/bundle-3d.js",
    "buildgui": "browserify app/gui.js -o build/bundle-gui.js",
    "watch2d": "watchify app/2d.js -o build/bundle-2d.js --debug --verbose",
    "watch3d": "watchify app/3d.js -o build/bundle-3d.js --debug --verbose",
    "watchgui": "watchify app/gui.js -o build/bundle-gui.js --debug --verbose"
  },
    */
};
