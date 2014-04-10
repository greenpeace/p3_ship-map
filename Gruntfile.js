module.exports = function(grunt) {
    'use strict';

    var config = {
            src: 'src',
            app: 'app',
            dist: 'dist',
            tmp: 'temp',
            test: 'test',
            xlsx: 'src/xlsx'
        },
        chalk = require('chalk'),
        error = chalk.red,
        warn = chalk.yellow,
        good = chalk.blue,
        xlsx = require('node-xlsx'),
        fs = fs = require('fs');

    // Project configuration.
    grunt.initConfig({
        config: config,
        pkg: grunt.file.readJSON('package.json'),
        bower: grunt.file.readJSON('./.bowerrc'),
        variables: {
            sass: grunt.file.readJSON('./.sassrc.json')
        },
        // ====================================================================
        //
        // clean
        //
        // Clean files and folders.
        //
        // https://github.com/gruntjs/grunt-contrib-clean
        //
        clean: {
            src: ["<%= config.src %>/css"],
            app: ['<%= config.app %>/'],
            dist: ["<%= config.dist %>/"],
            tmp: ["<%= config.tmp %>/"],
            svg: [
                '<%= config.app %>/img/**/grunticon.loader.txt',
                '<%= config.app %>/img/**/preview.html',
                '<%= config.tmp/svgmin/',
                '<%= config.app/**/*.svg',
                '!<%= config.app/**/*.min.svg'
            ]
        },

        // ====================================================================
        //
        // concat
        //
        // Concatenate files
        //
        // https://github.com/gruntjs/grunt-contrib-concat
        //
        concat: {

            javascript: {
                options: {
                    separator: ';\n',
                    // Remove duplicate 'use strict' declarations
                    banner: "'use strict';\n",
                    process: function(src, filepath) {
                        return '// Source: ' + filepath + '\n' +
                            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/gm, '$1');
                    }
                },
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
            },
            css: {
                options: {
                    banner: '',
                    process: function(src, filepath) {
                        return addBanner(filepath) + src;
                    }
                },
                files: {
                    '<%= config.app %>/css/style.css': [
                        config.src + '/css/style.css'
                    ]
                }
            },
            cssBg: {
                options: {
                    banner: '',
                    process: resizeBG
                },
                files: {
                    '<%= config.app %>/css/images-png.css': [
                        config.src + '/css/*-png.css'
                    ],
                    '<%= config.app %>/css/images-url.css': [
                        config.src + '/css/*-url.css'
                    ],
                    '<%= config.app %>/css/images-svg.css': [
                        config.src + '/css/*-svg.css'
                    ]
                }
            },
            cssBgRetina: {
                options: {
                    banner: '',
                    // Add CSS background-size property to high dpi images
                    process: resizeBG
                },
                files: {
                    '<%= config.app %>/css/retina-png.css': [
                        config.src + '/css/retina/*-png.css'
                    ],
                    '<%= config.app %>/css/retina-url.css': [
                        config.src + '/css/retina/*-url.css'
                    ],
                    '<%= config.app %>/css/retina-svg.css': [
                        config.src + '/css/retina/*-svg.css'
                    ]
                }
            }
        },

        // ====================================================================
        //
        // Copy
        //
        // Copy files and folders.
        //
        // https://github.com/gruntjs/grunt-contrib-copy
        //
        copy: {
            bowerCSS: {
                files: [
                    {
                        "<%= config.src %>/scss/vendor/_normalize.scss": "<%= bower.directory %>/normalize-scss/_normalize.scss",
                        "<%= config.src %>/scss/vendor/_weather.scss": "<%= bower.directory %>/weather-icons/css/weather-icons.css"
                    },
                    {
                        expand: true,
                        cwd: '<%= bower.directory %>/bourbon/app/assets/stylesheets/',
                        src: ['**'],
                        dest: '<%= config.src %>/scss/vendor/bourbon/'
                    },
                    {
                        expand: true,
                        cwd: '<%= bower.directory %>/weather-icons/font/',
                        src: ['**'],
                        dest: '<%= config.src %>/font/'
                    }
                ]
            },
            bowerJS: {
                files: {
                    "<%= config.src %>/js/vendor/plugins/jsrender.js": "<%= bower.directory %>/jsrender/jsrender.js",
                    "<%= config.src %>/js/vendor/plugins/oridomi.js": "<%= bower.directory %>/oridomi/oridomi.js",
                    "<%= config.src %>/js/vendor/compat/json.min.js": "<%= bower.directory %>/json3/lib/json3.min.js",
                    "<%= config.src %>/js/vendor/jquery/jquery.min.js": "<%= bower.directory %>/jquery/dist/jquery.min.js",
                    "<%= config.src %>/js/vendor/jquery/plugins/jquery.jpanelmenu.js": "<%= bower.directory %>/jpanelmenu-raywalker/jquery.jPanelMenu-raywalker-transform.js",
                    "<%= config.src %>/js/vendor/leaflet/leaflet.js": "<%= bower.directory %>/leaflet/dist/leaflet-src.js",
                    "<%= config.src %>/js/vendor/leaflet/plugins/leaflet.edgeMarker-raywalker.js": "<%= bower.directory %>/leaflet-edgemarker-raywalker/leaflet.edgeMarker-raywalker.js"
                }
            },
            // Copy required source files to the app folder
            base: {
                files: [

                    {// Markdown
                        expand: true,
                        cwd: '<%= config.src %>/',
                        src: ['*.md'],
                        dest: '<%= config.app %>/'
                    },{// Base files
                        "<%= config.app %>/robots.txt": "<%= config.src %>/robots.txt",
                        "<%= config.app %>/favicon.ico": "<%= config.src %>/favicon.ico"
                    },
                    {// Fonts
                        expand: true,
                        cwd: '<%= config.src %>/font/',
                        src: ['**'],
                        dest: '<%= config.app %>/font/'
                    }
                ]
            },

            images: {
                files: [
                    {// Img directory
                        expand: true,
                        cwd: '<%= config.src %>/img/',
                        src: ['**', '!**/svg/', '!**/*.svg', '!**/*.txt', '!**/*.html'],
                        dest: '<%= config.app %>/img/'
                    }
                ]
            },
//            css: {
//                files: [
//                    {
//                        "<%= config.app %>/css/style.css": "<%= config.src %>/css/style.css",
//                    }
//                ]
//            },
            js: {
                files: [
                    {
                        "<%= config.app %>/js/app.js": "<%= config.src %>/js/app.js",
                        "<%= config.app %>/js/jquery.min.js": "<%= config.src %>/js/vendor/jquery/jquery.min.js",
                        "<%= config.app %>/js/modernizr.js": "<%= config.src %>/js/vendor/modernizr/modernizr.js"
                    }
                ]
            },
            html: {
                files: [
                    {
                        "<%= config.app %>/index.html": "<%= config.src %>/index.html"
                    }
                ]
            },
            tmpsvg: {
                files: [
                    {// Img directory
                        expand: true,
                        cwd: '<%= config.tmp %>/svgmin/img/',
                        src: ['**'],
                        dest: '<%= config.app %>/img/'
                    }
                ]
            }
        },

        // ====================================================================
        //
        // Copy
        //
        // Compress CSS files.
        //
        // https://github.com/gruntjs/grunt-contrib-cssmin
        //
        cssmin: {
            style: {
                options: {
                    banner: ''
                },
                files: {
                    // Combine all /src/*.css files and output them to
                    '<%= config.dist %>/css/style.min.css': ['<%= config.app %>/css/style.css']
                }
            }
        },
        // ====================================================================
        //
        // Grunticon
        //
        // A Grunt.js task that makes it easy to manage icons and
        // background images for all devices, preferring HD (retina) SVG icons
        // but also provides fallback support for standard definition browsers,
        // and old browsers alike.
        //
        // https://github.com/filamentgroup/grunticon
        //
        grunticon: {
            svgLegend: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.tmp %>/svgmin/img/icon/legend/svg/',
                        src: ['*.min.svg'],
                        dest: '<%= config.app %>/img/icon/legend/'
                    }
                ],
                options: {
                    pngfolder: 'png',
                    defaultWidth: '<%= variables.sass.icon.legend.width %>px',
                    defaultHeight:'<%= variables.sass.icon.legend.height %>px',
                    urlpngcss: '../../../../<%= config.src %>/css/icon-legend-url.css',
                    datasvgcss: '../../../../<%= config.src %>/css/icon-legend-data-svg.css',
                    datapngcss: '../../../../<%= config.src %>/css/icon-legend-data-png.css'
                }
            },
            svgLegendRetina: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.tmp %>/svgmin/img/icon/legend/svg/',
                        src: ['*.min.svg'],
                        dest: '<%= config.app %>/img/icon/legend/'
                    }
                ],
                options: {
                    pngfolder: 'png/retina',
                    defaultWidth: '<%= variables.sass.icon.legend.retina.width %>px',
                    defaultHeight:'<%= variables.sass.icon.legend.retina.height %>px',
                    datasvgcss: '../../../../<%= config.src %>/css/retina/icon-legend-data-svg.css',
                    datapngcss: '../../../../<%= config.src %>/css/retina/icon-legend-data-png.css',
                    urlpngcss: '../../../../<%= config.src %>/css/retina/icon-legend-url.css'
                }
            },
            svgMap: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.tmp %>/svgmin/img/icon/map/svg/',
                        src: ['*.min.svg'],
                        dest: '<%= config.app %>/img/icon/map/'
                    }
                ],
                options: {
                    pngFolder: 'png',
                    defaultWidth: '<%= variables.sass.icon.map.width %>px',
                    defaultHeight:'<%= variables.sass.icon.map.height %>px',
                    datasvgcss: '../../../../<%= config.src %>/css/icon-map-data-svg.css',
                    datapngcss: '../../../../<%= config.src %>/css/icon-map-data-png.css',
                    urlpngcss: '../../../../<%= config.src %>/css/icon-map-url.css'
                }
            },
            svgMapRetina: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.tmp %>/svgmin/img/icon/map/svg/',
                        src: ['*.min.svg'],
                        dest: '<%= config.app %>/img/icon/map'
                    }
                ],
                options: {
                    pngfolder: 'png/retina',
                    defaultWidth: '<%= variables.sass.icon.map.retina.width %>px',
                    defaultHeight:'<%= variables.sass.icon.map.retina.height %>px',
                    datasvgcss: '../../../../<%= config.src %>/css/retina/icon-map-data-svg.css',
                    datapngcss: '../../../../<%= config.src %>/css/retina/icon-map-data-png.css',
                    urlpngcss: '../../../../<%= config.src %>/css/retina/icon-map-url.css'
                }
            },
            svgPopup: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.tmp %>/svgmin/img/popup/svg/',
                        src: ['*.min.svg'],
                        dest: '<%= config.app %>/img/popup/'
                    }
                ],
                options: {
                    pngFolder: 'png',
                    cssprefix: '.popup-',
                    defaultWidth: '<%= variables.sass.popup.width %>px',
                    defaultHeight: '<%= variables.sass.popup.height %>px',
                    datasvgcss: '../../../<%= config.src %>/css/bg-popup-data-svg.css',
                    datapngcss: '../../../<%= config.src %>/css/bg-popup-data-png.css',
                    urlpngcss: '../../../<%= config.src %>/css/bg-popup-url.css'
                }
            },
            svgPopupRetina: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.tmp %>/svgmin/img/popup/svg/',
                        src: ['*.min.svg'],
                        dest: '<%= config.app %>/img/popup/'
                    }
                ],
                options: {
                    pngFolder: 'png/retina',
                    cssprefix: '.popup-',
                    defaultWidth: '<%= variables.sass.popup.retina.width %>px',
                    defaultHeight: '<%= variables.sass.popup.retina.height %>px',
                    datasvgcss: '../../../<%= config.src %>/css/retina/bg-popup-data-svg.css',
                    datapngcss: '../../../<%= config.src %>/css/retina/bg-popup-data-png.css',
                    urlpngcss: '../../../<%= config.src %>/css/retina/bg-popup-url.css'
                }
            },
            svgTexture: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.tmp %>/svgmin/img/pattern/svg/',
                        src: ['*.min.svg'],
                        dest: '<%= config.app %>/img/pattern/'
                    }
                ],
                options: {
                    pngfolder: 'png',
                    cssprefix: '.pattern-',
                    defaultWidth:'40px',
                    defaultHeight:'40px',
                    datasvgcss: '../../../<%= config.src %>/css/bg-pattern-data-svg.css',
                    datapngcss: '../../../<%= config.src %>/css/bg-pattern-data-png.css',
                    urlpngcss: '../../../<%= config.src %>/css/bg-pattern-url.css'
                }
            }
        },

        // ====================================================================
        //
        // HTMLmin
        //
        // Minifies HTML using html-minifier
        //
        // https://github.com/gruntjs/grunt-contrib-htmlmin
        //
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    '<%= config.dist %>/index.html': '<%= config.src %>/index.html', // 'destination': 'source'
                }
            }
        },

        // ====================================================================
        //
        // JSHint
        //
        // Validate files with JSHint.
        //
        // https://github.com/gruntjs/grunt-contrib-jshint
        //
        jshint: {
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

        // ====================================================================
        //
        // Modernizr
        //
        // Build out a lean, mean Modernizr machine.
        //
        // https://github.com/Modernizr/grunt-modernizr
        //
        modernizr: {
            dist: {
                // [REQUIRED] Path to the build you're using for development.
                devFile: config.src + '/js/vendor/modernizr/modernizr.js',
                // [REQUIRED] Path to save out the built file.
                outputFile: config.src + '/js/vendor/modernizr/modernizr.js',
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
                customTests: [config.src + '/js/vendor/modernizr/tests/*.js']
            }
        },

// ====================================================================
        //
        // Text-replace
        //
        // Replace text in files using strings, regexs or functions.
        //
        // https://github.com/yoniholmes/grunt-text-replace
        //
        replace: {
            // Remove width and height from SVGs
            // See http://www.w3.org/Graphics/SVG/WG/wiki/Intrinsic_Sizing
            svg: {
                replacements: [
                    {
                        from: /(\s(?:width|height)="\d+(?:\.\d+?)?px")/g,
                        to: ''
                    }
                ],
                src: ['<%= config.src %>/img/**/*.svg'],
                overwrite: true
            },
            // Fix path names for background images generated by Grunticon
            svgcss: {
                replacements: [
                    {
                        from: /\.(\w+)(.*?background-image: url\(')(png\/.*?;)/g,
                        to: '.$1$2../img/$1/$3'
                    },
                    {
                        from: /\.(\w+)(.*?background-image: url\(')(retina\/)(.*?;)/g,
                        to: '.$1$2../img/$1/png/$3$4'
                    }
                ],
                src: ['<%= config.src %>/css/*-url.css'],
                overwrite: true
            },
            // Fix classnames from grunticon generated to remove .min
            svgcss2: {
                replacements: [
                    {
                        from: /^\.(\w+)(.*)?(\.min) {/g,
                        to: '.$1$2 {'
                    }
                ],
                src: [
                    '<%= config.src %>/css/*-url.css',
                    '<%= config.src %>/css/*-svg.css',
                    '<%= config.src %>/css/*-png.css'
                ],
                overwrite: true
            },
            // Override SCSS variables with contents of /.sassrc
            scss: {
                replacements: [
                    {
                        from: /(\$popupWidth:\s*?)(?:\d+)(px;)/g,
                        to: "$1<%= variables.sass.popup.width %>$2"
                    },
                    {
                        from: /(\$popupHeight:\s*?)(?:\d+)(px;)/g,
                        to: "$1<%= variables.sass.popup.height %>$2"
                    },
                    {
                        from: /(\$figureHeight:\s*?)(?:\d+)(px;)/g,
                        to: "$1<%= variables.sass.popup.figureHeight %>$2"
                    }
                ],
                src: ['<%= config.src %>/scss/config/_variables.scss'],
                overwrite: true
            }
        },

        // ====================================================================
        //
        // SASS
        //
        // Compile Sass to CSS.
        //
        // https://github.com/gruntjs/grunt-contrib-sass
        //
        sass: {
            src: {
                files: {
                    '<%= config.src %>/css/style.css': '<%= config.src %>/scss/style.scss'     // 'destination': 'source'
                }
            }
        },

        svgmin: {                       // Task
            options: {                  // Configuration that will be passed directly to SVGO
                plugins: [{
                    removeViewBox: false
                }, {
                    removeUselessStrokeAndFill: true
                }, {
                    convertPathData: {
                        straightCurves: false // advanced SVGO plugin option
                    }
                }]
            },
            dist: {                     // Target
                files: [{               // Dictionary of files
                    expand: true,       // Enable dynamic expansion.
                    cwd: '<%= config.src %>/img/',// Src matches are relative to this path.
                    src: ['**/*.svg'],              // Actual pattern(s) to match.
                    dest: '<%= config.tmp %>/svgmin/img/',     // Destination path prefix.
                    ext: '.min.svg'                 // Dest filepaths will have this extension.
                    // ie: optimise img/src/branding/logo.svg and store it in img/branding/logo.min.svg
                }]
            }
        },



        // ====================================================================
        //
        // Uglify
        //
        // Minify files with UglifyJS.
        //
        // https://github.com/gruntjs/grunt-contrib-uglify
        //
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

        // ====================================================================
        //
        // Watch
        //
        // Run tasks whenever watched files change.
        //
        // https://github.com/gruntjs/grunt-contrib-watch
        //
        watch: {
            grunt: {
                files: ['/Gruntfile.js'],
                tasks: ['default'],
                options: {
                    spawn: false
                }
            },
            // Watch for SCSS changes
            scss: {
                files: ['<%= config.src %>/**/*.scss'],
                tasks: ['scss'],
                options: {
                    spawn: false
                }
            },
            // Watch for javascript changes
            js: {
                files: ['<%= config.src %>/**/*.js'],
                tasks: ['javascript'],
                options: {
                    spawn: false
                }
            },
            // HTML files
            html: {
                files: ["<%= config.src %>/index.html"],
                tasks: ['html'],
                options: {
                    spawn: false
                }
            },
            // Everything else
            base: {
                files: ['<%= config.src %>*.md', '<%= config.src %>/*.ico', '<%= config.src %>/*.txt'],
                tasks: ['copy:base'],
                options: {
                    spawn: false
                }
            }
        }
    });

    // ===========================================================================
    // Load plugins

    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.loadNpmTasks('grunt-contrib-htmlmin');

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.loadNpmTasks('grunt-grunticon');

    grunt.loadNpmTasks("grunt-modernizr");

    grunt.loadNpmTasks('grunt-sass');

    grunt.loadNpmTasks('grunt-svgmin');

    grunt.loadNpmTasks('grunt-text-replace');

    // ===========================================================================

    // Default task
    grunt.registerTask('default', [
        'clean',
        'replace:scss',
        'sass',
        'replace:svg',
        'svgmin',
        'grunticon',
        'replace:svgcss',
//        'replace:svgcss2',
        'concat:css',
        'concat:cssBg',
        'concat:cssBgRetina',
        'jshint',
        'modernizr',
        'concat:javascript',
        'copy:base',
        'copy:tmpsvg',
        'clean:svg',
        'copy:images',
        'copy:js',
        'copy:html',
    ]);

    grunt.registerTask('bower', [
        'copy:bowerJS',
        'copy:bowerCSS'
    ]);

    grunt.registerTask('svg', [
        'replace:svg',
        'svgmin',
        'grunticon',
        'copy:tmpsvg',
        'clean:svg',
        'replace:svgcss',
//        'replace:svgcss2',
        'concat:cssBg',
        'concat:cssBgRetina'
    ]);

    grunt.registerTask('javascript', [
        'jshint',
        'copy:js',
        'concat:javascript',
//        'uglify'
    ]);

    grunt.registerTask('scss', [
        'replace:scss',
        'sass',
        'concat:css',
    ]);

    grunt.registerTask('html', [
        'copy:html'
    ]);

    // Prepares final distribution folder
    grunt.registerTask('dist', [
        'cssmin',
        'concat:javascript',
        'uglify',
        'copy:dist'
    ]);

    grunt.registerTask('buildjson', [
        'xlsjson',
        'features'
    ]);

    grunt.registerTask('xlsjson', 'Converts XLS to JSON', function() {
        console.log( chalk.blue('Crawling ' + config.xlsx) );
        var path = config.tmp + '/json/';

        grunt.file.mkdir(path , '0750');

        grunt.file.recurse(config.xlsx, function(abspath, rootdir, subdir, filename) {
            xlsxToJson(abspath, path + filename + '.json');
        });

    });

    grunt.registerTask('features', 'Builds the features JSON', function() {
        var outfile,
            _ = require('lodash'),
            _s = require('underscore.string');


        if (!Number.toFixed) {
            // Round float values to n decimal points
            Number.prototype.toFixed=function(n){
                return Math.round(this*Math.pow(10, n)) / Math.pow(10, n);
            };
        }

        // Converts degrees to decimal
        function convertDegreesToDecimal(deg) {
            var reg = /(\d+).?(\d+)?.?(\d+)?/,
                split = reg.exec(deg);

            if (split.length) {
                return +split[1] + (split[2] ? +split[2]/60 : 0) + (split[3] ? +split[3]/3600 : 0);
            } else {
                console.error(error('Not a valid long/lat: ', deg));
            }

        }

        function getFeatureTypeString(val) {
            switch(val) {
                case 'Noon':
                    return {
                        identifier: 'noon',
                        name: 'Noon update'
                    };
                default: {
                    return {
                        identifier: val.toLowerCase().replace(/\s/g, '-'),
                        name: val
                    };
                }
            }
        }

        function getShipIndex(json, id) {
            var index = 0,
                found = false,
                id = _s.trim(id);

            _.forEach(json.ships, function(ship) {
                if (_s.trim(ship.shipID) === id) {
                    console.log("\n" + good(' >> ') + 'parsing sheet [' + ship.shipID + '] - ' + ship.name);
                    found = index;
                }
                index++;
            });

            if (found !== false) {
                return found;
            }

            console.error(error('Ship data not found, styles not yet set'));
            return -1;
        }

        if (arguments.length < 1) {
            console.log(warn('No output file specified, using default'));
            outfile = config.test + '/json/test-generated.json';
        } else {
            outfile = config.test + '/json/' + arguments[0];
        }

        grunt.file.recurse(config.tmp + '/json/', function(infile) {
            var source = grunt.file.readJSON(infile),
                output = grunt.file.readJSON(outfile),
                sheetIndex = 0;

            console.log(chalk.bold(infile) + ' >> ' + chalk.bold(outfile));

            // Iterate over each sheet of the file
            _.forEach(source.worksheets, function (sheet) {


                var shipIndex = getShipIndex(output, sheet.name),
                    geoJSON = {
                        paths: [
                            {
                                "type": "LineString",
                                "properties": {
                                    "name": "",
                                    "period": {
                                        "identifier": "default",
                                        "name": "Default"
                                    }
                                },
                                "coordinates": []
                            }
                        ],
                        features: []
                    },
                    rowIndex=0;

                if (shipIndex === -1) {
                    shipIndex = sheet.ships.length;
//                    outfile.ships[shipIndex] = {
//                        "name": sheet.name,
//                        "nameSimple": "rainbow-warrior",
//                        "shipID": "RW",
//                        "style": {
//                          "icon": {
//                            "map": {
//                              "className": "icon-RW-map"
//                            },
//                            "menu": {
//                              "className": "icon-RW-legend"
//                            }
//                          }
//                        },
//                    }
                }

                // =============================================================
                // Iterate over each row of the sheet
                // Each row of the sheet indicates a new feature

                _.forEach(sheet.data, function(row) {

                    var itemIndex = 0,
                        f = {
                            type: "Feature",
                            id: "",
                            properties: {
                                "name": "",
                                "timestamp": "",
                                "type": {
                                    "identifier": "",
                                    "name": ""
                                },
                                "summary": "",
                                "url": "",
                                "location": "",
                                "image": {
                                    "src": "",
                                    "width": 'auto',
                                    "height": 'auto',
                                    "caption": ""
                                }
                            },
                            "geometry": {
                                "type": "Point",
                                "coordinates": []
                            }
                        };

                    // =========================================================
                    // Iterate over each item of the row
                    // Each item of the row indicates a field in the feature

                    _.forEach(row, function(item) {

                        // skip header row;
                        if (rowIndex === 0 ) {
                            return;
                        }

                        if (item && typeof item.value !== 'undefined') {

                            var val = (item.value && item.value !== 'null') ? _s.trim(item.value) : false;

                            if (val) {
                                switch (itemIndex) {
                                    case 0:
                                        // date
                                        f.properties.timestamp = val ? new Date(val).toISOString() : '';
                                        break;
                                    case 1:
                                        // lat
                                        f.geometry.coordinates[1] = convertDegreesToDecimal(val).toFixed(5);
                                        break;
                                    case 2:
                                        // north/south
                                        if (val.toUpperCase() === 'S') {
                                            f.geometry.coordinates[1] = -f.geometry.coordinates[1];
                                        }
                                        break;
                                    case 3:
                                        // long
                                        f.geometry.coordinates[0] = convertDegreesToDecimal(val).toFixed(5);
                                        break;
                                    case 4:
                                        // east/west
                                        if (val.toUpperCase() === 'W') {
                                            f.geometry.coordinates[0] = -f.geometry.coordinates[0];
                                        }
                                        break;
                                    case 5:
                                        // location
                                        f.properties.location = val;
                                        break;
                                    case 6:
                                        // update-type
                                        f.properties.type = getFeatureTypeString(val);
                                        break;
                                    case 7:
                                        if (val !== 'null') {
                                            // weather
                                            f.properties.weather = {
                                                text: val
                                            };
                                            switch (val.toUpperCase()) {
                                                case 'SUNNY':
                                                    f.properties.weather.icon = 'wi-day-sunny';
                                                    break;
                                                case 'CLOUDY':
                                                    f.properties.weather.icon = 'wi-cloudy';
                                                    break;
                                                case 'RAINY':
                                                    f.properties.weather.icon = 'wi-rain';
                                                    break;
                                                default:
                                                    console.log(warn('Weather value not handled: '), val);
                                                    f.properties.weather.icon = 'wi-cloud';
                                            }
                                        }

                                        break;
                                    case 8:
                                        // temperature
                                        f.properties.temp = val;
                                        break;
                                    case 9:
                                        // image
                                        if (val !== 'null' && val.length && val !== '/') {
                                            f.properties.image.src = 'img/features/' + val + '.jpg';
                                        }
                                        break;
                                    case 10:
                                        // port
                                        f.properties.port = val.toUpperCase() === 'YES' ? true : false;
                                        break;
                                    case 11:
                                        // text
                                        f.properties.summary = val === 'null' ? '' : val;
                                        break;
                                    default:
                                        console.log(warn('Unhandled column: ' + itemIndex, val));
                                }
                            } else {
                                console.warn(warn(sheetIndex, rowIndex, itemIndex, 'no value'));
                            }
                        } else {
//                            console.warn(warn(sheetIndex, rowIndex, itemIndex, 'no value'));
                        }

                        // Finished item
                        itemIndex++;

                    });

                    if (f.geometry.coordinates.length) {
                        // Post processing
                        console.log(good(' >> ' ) + rowIndex + ' '+ f.properties.timestamp, f.geometry.coordinates, f.properties.location);

                        geoJSON.features.push(f);
                        geoJSON.paths[0].coordinates.push(f.geometry.coordinates);

                    } else {
                        if (rowIndex > 0) {
                            console.log(warn(' >> ' + rowIndex + ' Row skipped, no coordinates found'));
                        }
                    }


                    // Finished row
                    rowIndex++;

                });

                // Finished Sheet
                sheetIndex++;

                console.log("\nAdding geoJSON to ship: " + geoJSON.features.length + " features");
                // Add geoJSON object to output.ship
                output.ships[shipIndex].geojson = geoJSON;
                delete(output.ships[shipIndex].geoJSON);
            });

            // Finished processing this file
            fs.writeFileSync(outfile, JSON.stringify(output, null, 2) );

        });

    });

    function xlsxToJson (input, output) {
        fs.writeFileSync(output, JSON.stringify(xlsx.parse(input),null, 2));
//        return JSON.stringify(xlsx.parse(abspath),null, 2);
    };

    function addBanner(filepath) {
        return '/* Source: ' + filepath + ' */\n';
    }

    function resizeBG (src, filepath) {
        var output = addBanner(filepath),
            width,
            height;

        // Specify regular image dimensions in the background-size
        // Note - not the retina image
        if (filepath.match(/icon-legend/)) {
            console.log(chalk.blue('icon-legend: ') + filepath);
            width = grunt.template.process('<%= variables.sass.icon.legend.width %>');
            height = grunt.template.process('<%= variables.sass.icon.legend.height %>');
            // Fix missing path information from grunticon
            output += src.replace(/'(img\/icon\/)(png\/)/gm, "'../$1legend/$2");
        } else if (filepath.match(/icon-map/)) {
            console.log(chalk.blue('icon-map: ') + filepath);
            width = grunt.template.process('<%= variables.sass.icon.map.width %>');
            height = grunt.template.process('<%= variables.sass.icon.map.height %>');
            // Fix missing path information from grunticon
            output += src.replace(/'(img\/icon\/)(png\/)/gm, "'../$1map/$2");
        } else if (filepath.match(/bg-popup/)) {
            console.log(chalk.blue('bg-popup: ') + filepath);
            width = grunt.template.process('<%= variables.sass.popup.width %>');
            height = grunt.template.process('<%= variables.sass.popup.height %>');
            return output = src
                // Strip .min from classnames
                .replace(/^.*?\.([\w-]+)?(\.min)\s{/gm, '.$1 {')
                // Add dimension information
                // @todo test for background-size support and implement differently
                .replace(/}/g, 'width: ' + width + 'px; height: ' + height + 'px; background-size: ' + width + 'px ' + height + 'px; }');
        } else if (filepath.match(/bg-pattern/)) {
            return output + src.replace(/^.*?\.([\w-]+)?(\.min)\s{/gm, '.$1 {');
        } else {
            console.log(warn('other: ') + filepath);
            return output + src.replace(/^.*?\.([\w-]+)?(\.min)\s{/gm, '.$1 {');
        }

        output = output
            // Strip .min from classnames
            .replace(/^.*?\.([\w-]+)?(\.min)\s{/gm, '.$1 {')
            // Add dimension information
            // @todo test for background-size support and implement differently
            .replace(/}/g, 'width: ' + width + 'px; height: ' + height + 'px; background-size: contain }');
//            .replace(/}/g, 'width: ' + width + 'px; height: ' + height + 'px; background-size: ' + width + 'px ' + height + 'px; }');

    //                        console.log(filepath + ' - ' + grunt.template.process(width) + ' ' + grunt.template.process(height));

        return output;
    }





};
