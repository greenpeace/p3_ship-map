module.exports = function(grunt) {
    'use strict';

    var config = {
        src: 'src',
        app: 'app',
        dist: 'dist'
    };


    // Project configuration.
    grunt.initConfig({
        config: config,
        pkg: grunt.file.readJSON('package.json'),
        bower: grunt.file.readJSON('./.bowerrc'),
//        compass: {
//            src: {
//                options: {
//                    config: 'config.rb'
//                }
//            }
//        },
        concat: {
            options: {
                separator: '\n;',
                // Remove duplicate 'use strict' declarations
                banner: "'use strict';\n",
                process: function(src, filepath) {
                    return '// Source: ' + filepath + '\n' +
                        src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                }
            },
            plugins: {
                files: {
                    '<%= config.app %>/js/plugins.js': [
                        config.src + '/js/vendor/plugins/*.js',
                        config.src + '/js/vendor/jquery/plugins/*.js'
                    ],
                    '<%= config.app %>/js/leaflet.js': [
                        config.src + '/js/vendor/leaflet/leaflet.js',
                        config.src + '/js/vendor/leaflet/plugins/*.js'
                    ]
                }
            }
        },
        copy: {
            bowerCSS: {
                files: [
                    {
                        "<%= config.src %>/scss/vendor/_normalize.scss": "<%= bower.directory %>/normalize-scss/_normalize.scss"
                    },
                    {
                        expand: true,
                        cwd: '<%= bower.directory %>/bourbon/app/assets/stylesheets/',
                        src: ['**'],
                        dest: '<%= config.src %>/scss/vendor/bourbon/'
                    }
                ]
            },
            bowerJS: {
                files: {
                    "<%= config.src %>/js/vendor/jsrender.js": "<%= bower.directory %>/jsrender/jsrender.js",
                    "<%= config.src %>/js/vendor/compat/json.min.js": "<%= bower.directory %>/json3/lib/json3.min.js",
                    "<%= config.src %>/js/vendor/jquery/jquery.min.js": "<%= bower.directory %>/jquery/dist/jquery.min.js",
                    "<%= config.src %>/js/vendor/jquery/plugins/jquery.jpanelmenu.js": "<%= bower.directory %>/jpanelmenu-raywalker/jquery.jPanelMenu-raywalker-transform.js"
                }
            },
            // Copy required source files to the app folder
            srcToApp: {
                files: [
                    {// Base files
                        "<%= config.app %>/index.html": "<%= config.src %>/index.html",
                        "<%= config.app %>/robots.txt": "<%= config.src %>/robots.txt",
                        "<%= config.app %>/favicon.ico": "<%= config.src %>/favicon.ico",
                        "<%= config.app %>/css/style.css": "<%= config.src %>/css/style.css",
                        "<%= config.app %>/js/app.js": "<%= config.src %>/js/app.js",
                        "<%= config.app %>/js/jquery.min.js": "<%= config.src %>/js/vendor/jquery/jquery.min.js",
                        "<%= config.app %>/js/modernizr.js": "<%= config.src %>/js/vendor/modernizr.js"
                    },
                    {// Img directory
                        expand: true,
                        cwd: '<%= config.src %>/img/',
                        src: ['**'],
                        dest: '<%= config.app %>/img/'
                    },
                    {// Markdown
                        expand: true,
                        cwd: '<%= config.src %>/',
                        src: ['*.md'],
                        dest: '<%= config.app %>/'
                    }
                ]
            }
        },
        jshint: {// https://www.npmjs.org/package/grunt-contrib-jshint
            options: {
                curly: true,
                eqeqeq: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true,
                    Modernizr: true,
                    console: true
                }
            },
            files: ['<%= config.src %>/js/app.js', '<%= config.src %>/js/plugins/*.js', '<%= config.src %>/js/leaflet/plugins/*.js']
        },
        modernizr: {
            dist: {
                // [REQUIRED] Path to the build you're using for development.
                devFile: config.src + '/js/vendor/modernizr.js',
                // [REQUIRED] Path to save out the built file.
                outputFile: config.src + '/js/vendor/modernizr.js',
                extra: {
                    shiv: true,
                    printshiv: false,
                    load: true,
                    mq: true,
                    cssclasses: true
                },
                extensibility: {
                    addtest: false,
                    prefixed: false,
                    teststyles: false,
                    testprops: false,
                    testallprops: false,
                    hasevents: false,
                    prefixes: false,
                    domprefixes: false
                },
                // We uglify later
                uglify: false,
                // Define any tests you want to implicitly include.
                tests: [],
                // By default, this task will crawl your project for references to Modernizr tests.
                // Set to false to disable.
                parseFiles: true,
                // When parseFiles = true, this task will crawl all *.js, *.css, *.scss files, except files that are in node_modules/.
                // You can override this by defining a files array below.
                files: {
                    src: [
                        config.src + '/js/**/*.js',
                        config.src + '/scss/**/*.scss'
                    ]
                },
                // When parseFiles = true, matchCommunityTests = true will attempt to
                // match user-contributed tests.
                matchCommunityTests: false,
                // Have custom Modernizr tests? Add paths to their location here.
                customTests: []
            }
        },
        sass: {// Task
            src: {// Target
                files: {// Dictionary of files
                    '<%= config.src %>/css/style.css': '<%= config.src %>/scss/style.scss'     // 'destination': 'source'
                }
            }
        },
        // Javascript minification
        uglify: {
            options: {
                banner: '/** <%= pkg.name %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: {
                    except: ['jQuery', 'Modernizr']
                }
            },
            app: {
                files: {
                    '<%= config.dist %>/js/app.min.js': ['<%= config.app %>/js/app.js'],
                    '<%= config.dist %>/js/plugins.min.js': ['<%= config.app %>/js/plugins.js'],
                    '<%= config.dist %>/js/leaflet.min.js': ['<%= config.app %>/js/leaflet.js']
                }
            },
            modernizr: {
                options: {
                    banner: ''
                },
                files: {
                    '<%= config.dist %>/js/modernizr.min.js': '<%= config.app %>/js/modernizr.js'
                }
            },
            jquery: {
                options: {
                    compress: false,
                    banner: '/*! @source: http://jquery.com/ */'
                },
                files: {
                    '<%= config.dist %>/js/jquery.min.js': '<%= config.app %>/js/jquery.min.js'
                }
            }
        },
        watch: {
            scss: {
                files: ['src/**/*.scss'],
                tasks: ['scss'],
                options: {
                    spawn: false
                }
            },
            js: {
                files: ['src/**/*.js'],
                tasks: ['javascript'],
                options: {
                    spawn: false
                }
            }
        }
    });

    // ===========================================================================
    // Load plugins

    // Minifies javascript
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadNpmTasks('grunt-contrib-concat');

    // Copies files
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Javascript code quality assurance
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Watch for changes and exectute tasks
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Automatically builds a custom modernizr depending on the tests used
    grunt.loadNpmTasks("grunt-modernizr");

    // Compiles SCSS to CSS using Node's lib-sass instead of Ruby
    // See
    grunt.loadNpmTasks('grunt-sass');

    // ===========================================================================

    // Default task
    grunt.registerTask('default', [
        'sass',
        'modernizr',
        'jshint',
        'copy:srcToApp',
        'concat',
        'uglify'
    ]);

    grunt.registerTask('bower', [
        'copy:bowerJS',
        'copy:bowerCSS'
    ]);

    grunt.registerTask('javascript', [
//        'copy:bowerJS',
        'modernizr',
        'jshint',
        'copy:srcToApp',
        'concat',
        'uglify'
    ]);

    grunt.registerTask('scss', [
//        'copy:bowerCSS',
        'sass',
        'modernizr',
        'copy:srcToApp'
    ]);
};