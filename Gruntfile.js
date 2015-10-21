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
    }
    // watch: {
    //   files: ['<%= jshint.files %>'],
    //   tasks: ['jshint']
    // }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  // grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint']);

};
