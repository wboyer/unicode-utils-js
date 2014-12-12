module.exports = function(grunt) {

	grunt.initConfig({

		compass: {
			dist: {
				options: {
					sassDir: '<%= grunt.option("src") %>/src/css',
					cssDir: '<%= grunt.option("dest") %>/dist/css',
					outputStyle: 'compressed',
					noLineComments: true
				}
			}
		},

		concat: {
			options: {
				separator: ';'
			},
            '<%= grunt.option("dest") %>/dist/js/unicode-utils.js': ['<%= grunt.option("src") %>/src/js/unicode-utils.js'],
            '<%= grunt.option("dest") %>/dist/js/unicode-utils-demo.js': ['<%= grunt.option("src") %>/src/js/unicode-utils-demo.js']
		},

		uglify: {
			dist: {
				options: {
					banner: '/*! unicode-utils-js <%= grunt.template.today("dd-mm-yyyy") %> */\n'
				},
				files: {
                    '<%= grunt.option("dest") %>/dist/js/unicode-utils.min.js': '<%= grunt.option("src") %>/dist/js/unicode-utils.js',
                    '<%= grunt.option("dest") %>/dist/js/unicode-utils-demo.min.js': '<%= grunt.option("src") %>/dist/js/unicode-utils-demo.js'
				}
			}
		},

		jshint: {
			files: ['<%= grunt.option("src") %>/src/js/**'],
			options: {
				globals: {
					console: true,
					module: true,
					document: true
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-compass');

	grunt.registerTask('build', ['jshint', 'concat', 'uglify', 'compass']);
};
