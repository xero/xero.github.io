//___________________________________________________________________________________
//                                                                              grunt
module.exports = function(grunt) {
	grunt.initConfig({
		//___________________________________________________________________________
		//                                                                     config
		pkg: grunt.file.readJSON('package.json'),
		//___________________________________________________________________________
		//                                                                  variables
		meta: {
			basePath: '/ui/',
			cssPath: 'ui/css/',
			sassPath: 'ui/sass/',
			jsPath: 'ui/js/',
			jsLibPath: 'ui/js/lib/',
			jsAppPath: 'ui/js/app/',
			jsStachesPath: 'ui/js/app/staches/'
		},
		//___________________________________________________________________________
		//                                                                 javascript        
		handlebars: {
			templates: {
				files: {
					'<%= meta.jsAppPath %>templates.js': '<%= meta.jsStachesPath %>*.handlebars'
				},
				options: {
					knownHelpers: [],
					knownOnly: true
				}
			}
		},
		uglify: {
			options: {
				mangle: false
			},
			libs: {
				src: [
					'<%= meta.jsLibPath %>jq.js',
					'<%= meta.jsLibPath %>bootstrap.js',
					'<%= meta.jsLibPath %>handlebars.js',
					'<%= meta.jsLibPath %>highlight.js'
				],
				dest: '<%= meta.jsPath %>libs.min.js'
			},
			app: {
				src: [
					'<%= meta.jsAppPath %>templates.js',
					'<%= meta.jsAppPath %>main.js',
				],
				dest: '<%= meta.jsPath %>app.min.js'
			}
		},
		//___________________________________________________________________________
		//                                                                   sass/css		
		sass: {
			bootstrap: {
				options: {
					compass: true
				},
				files: [{
					expand: true,
					cwd: '<%= meta.sassPath %>bootstrap',
					src: ['*.scss'],
					dest: '<%= meta.cssPath %>',
					ext: '.css'
				}]
			},
			pixelgraff: {
				options: {
					compass: true,
					lineNumbers: false
				},
				files: [{
					expand: true,
					cwd: '<%= meta.sassPath %>pixelgraff',
					src: ['*.scss'],
					dest: '<%= meta.cssPath %>',
					ext: '.css'
				}]
			},
			highlight: {
				files: [{
					expand: true,
					cwd: '<%= meta.sassPath %>highlight',
					src: ['*.scss'],
					dest: '<%= meta.cssPath %>',
					ext: '.css'
				}]
			},
			octicons: {
				files: [{
					expand: true,
					cwd: '<%= meta.sassPath %>fonts/octicons',
					src: ['*.scss'],
					dest: '<%= meta.cssPath %>',
					ext: '.css'
				}]
			}
		},
		//___________________________________________________________________________
		//                                                                 minify css
		cssmin: {
			compress: {
				files: {
					"<%= meta.cssPath %>app.css":
					[
						"<%= meta.cssPath %>bootstrap.css",
						"<%= meta.cssPath %>pixelgraff.css",
						"<%= meta.cssPath %>highlight.css",
						"<%= meta.cssPath %>octicons.css"
					]
				}
			}
		},
		//___________________________________________________________________________
		//                                                          remove temp files
		clean: {
			css: {
				src: [
					"<%= meta.cssPath %>bootstrap.css",
					"<%= meta.cssPath %>pixelgraff.css",
					"<%= meta.cssPath %>highlight.css",
					"<%= meta.cssPath %>octicons.css"
				]
			}
		},
		//___________________________________________________________________________
		//                                                                 auto-build
		watch: {
			js: {
				files: [
					'<%= meta.jsPath %>**/*.js',
					'<%= meta.jsPath %>**/**/*.js'
				],
				tasks: ['uglify'],
			},
			handlebars: {
				files: [
					'<%= meta.jsStachesPath %>*.handlebars'
				],
				tasks: ['handlebars'],
			},
			sass: {
				files: ['<%= meta.sassPath %>**/*.scss'],
				tasks: [
					'sass',
					'cssmin',
					'clean'
				],
			}
		}
	});
	//_______________________________________________________________________________
	//                                                                          tasks
	grunt.registerTask('css', [
		'sass',
		'cssmin',
		'clean'
	]);
	grunt.registerTask('js', [
		'handlebars',
		'uglify'
	]);
	grunt.registerTask('default', [
		'js',
		'css'
	]);
	grunt.event.on('watch', function(action, filepath) {
		grunt.log.writeln('changes detected!');
	});
	//_______________________________________________________________________________
	//                                                                   load modules
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-handlebars-compiler');
};
//___________________________________________________________________________________
//                                                                                eof    