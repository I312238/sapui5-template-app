module.exports = function(grunt) {
    "use strict";

    require('load-grunt-tasks')(grunt); // = grunt.loadNpmTasks('*');

    let serveStatic = require("serve-static");

    let path = "";
    let ui5Version = ""; // start with '/'
    let ui5Url = "https://sapui5.hana.ondemand.com" + ui5Version;
    let ui5BootstrapUrl = ui5Url + "/resources/sap-ui-core.js";
    let bChangeDir = false;
    let apppath = path || '';
    let basepath = apppath ?  apppath : './';

    if (grunt.option('gruntfile') != null || grunt.option('gruntfile') != undefined) {
        let filePath = grunt.option('gruntfile').slice(0, -"Gruntfile.js".length);
        basepath = filePath;
        apppath = filePath;
        bChangeDir = true;
    }

    let manifest = grunt.file.readJSON(apppath ? apppath + 'webapp/manifest.json' : './webapp/manifest.json');
    let componentName = manifest["sap.app"].id;
    let componentPath = componentName.replace(/\./g, "/");
    let testName = componentName + ".test";

    const KARMA_PORT = 9876;
    const FRONT_END_SERVER_PORT = 3000;
    const BACK_END_SERVER_PORT = 8080;
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            options: {
                // options will be applied when running test and as a server
                port: FRONT_END_SERVER_PORT,
                hostname: "localhost",
                middleware: function(connect, options) {
                    // use "serve-static" to point resources loaded by the application to local file paths
                    return [
                        connect().use("/resources", serveStatic("bower_components/sapui5/resources", { hidden: true })),
                        connect().use("/", serveStatic((path)? path : "webapp", { hidden: true })),
                        connect().use("/test-resources", serveStatic("test", { hidden: true })),
                    ];
                }
            },

            // proxy configurations
            proxies: [{
                context: [                  // The context(s) to match requests against. Matching requests will be proxied
                    // '/sap/opu/odata/whatever_SRV'
                ],
                host: "localhost",          // backend server's host
                port: BACK_END_SERVER_PORT, // backend service's port
                rewrite: {                  // rewrite rules
                    // "^/FrontEnd/SRV/REQUEST/RegExp": "/api/v1/backend"  // do like this
                },      
                headers: {                  // header informations need to be added to the requests
                    //'Authorization': jwtToken
                },
                hideHeaders: ['x-removed-header']
            }],

            default: {
                // leave this option for karma test task
            },

            // applying "grunt-connect-proxy"
            proxy: {
                options: {
                    middleware: function(connect, options) {
                        var middlewares = [
                            require('grunt-connect-proxy/lib/utils').proxyRequest, // add the "grunt-connect-proxy" to the middleware
                            connect().use("/resources", serveStatic("bower_components/sapui5/resources", { hidden: true })),
                            connect().use("/", serveStatic((path)? path : "webapp", { hidden: true })),
                            connect().use("/test-resources", serveStatic("test", { hidden: true }))
                        ];
                        return middlewares;
                    }
                }
            }
        },

        clean: {
            options: {
                force: false
            },
            reports: ['reports/']
        },

        karma: {
            options: {
                basePath: "",
                frameworks: ["openui5", "qunit", "phantomjs-shim"], // add frameworks for the task
                preprocessors: {
                    "webapp/**/!(Component|App.controller).js": ["coverage"],
                    "src/**/**/**/!(external)/!(Component|App.controller).js": ["coverage"]
                },
                files: [{
                    pattern: "test/karma-qunit.js",
                    included: true
                }, {
                    pattern: "src/**/**/**/**/*",
                    included: false
                }, {
                    pattern: "webapp/**/*",
                    included: false
                }, {
                    pattern: "test/**/!(*Test.js|*Journey.js)",
                    included: false
                }],
                port: KARMA_PORT,
                colors: true,
                logLevel: "INFO",
                // browsers supported by default: [ "Chrome", "PhantomJS" ]
                // browsers also supported but need extra extensions loaded: [ "Firefox", "Safari", "Opera", "IE" ]
                browsers: ["Chrome"], // grunt.option("browsers") || "PhantomJS"
                junitReporter: {
                    outputDir: "reports", // results will be saved as $outputDir/$browserName.xml
                    outputFile: "allTests.xml",
                    useBrowserName: false // add browser name to report and classes names
                },
                customLaunchers: {
                    "Chrome_custom": {
                        base: "ChromeHeadless",
                        // We must disable the Chrome sandbox when running Chrome inside Docker (Chrome's sandbox needs
                        // more permissions than Docker allows by default)
                        flags: ["--no-sandbox"]
                    }
                }
            },
            LocalUnitTests: {
                openui5: {
                    path: "http://localhost:" + KARMA_PORT + "/resources/sap-ui-core.js"
                },
                client: {
                    openui5: {
                        config: {
                            bindingSyntax: "complex",
                            language: "en-US",
                            theme: "sap_bluecrystal",
                            libs: "sap.m",
                            resourceroots: { // karma serves files with the root path of "/base"
                                [componentName]: "/base/" + (apppath || "webapp"),
                                [testName]: "/base/test"
                            }
                        }
                    }
                },
                // files will be ran during the task, RegExp is supported such as "test/**/*Test.js"
                files: [{
                    src: ["test/unit/allTest.js"],
                    included: true
                }],
                reporters: [ "progress", "coverage" ],
                coverageReporter: {
                    type : 'html',
                    dir : 'reports/',
                    reporters: [
                        // reporters not supporting the `file` property
                        { type: 'html', subdir: 'report-html' },
                        { type: 'lcov', subdir: 'report-lcov' },
                        // reporters supporting the `file` property, use `subdir` to directly
                        // output them in the `dir` directory
                        { type: 'cobertura', subdir: '.', file: 'cobertura.txt' },
                        { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' },
                        { type: 'teamcity', subdir: '.', file: 'teamcity.txt' },
                        { type: 'text', subdir: '.', file: 'text.txt' },
                        { type: 'text-summary', subdir: '.', file: 'text-summary.txt' },
                    ]
                },
                autoWatch: true,
                singleRun: false,
                proxies: { // config proxies to load local static files
                    "/resources/test/": "http://localhost:" + FRONT_END_SERVER_PORT + "/test-resources/",
                    "/resources/": "http://localhost:" + FRONT_END_SERVER_PORT + "/resources/",
                    "/test/": "http://localhost:" + FRONT_END_SERVER_PORT + "/test-resources/",
                },
            },
            OnlineUnitTests: {
                logLevel: "DEBUG",
                openui5: {
                    path: ui5BootstrapUrl
                },
                client: {
                    openui5: {
                        config: {
                            bindingSyntax: "complex",
                            language: "en-US",
                            theme: "sap_bluecrystal",
                            libs: "sap.m",
                            resourceroots: { // karma serves files with the root path of "/base"
                                [componentName]: "/base/" + (apppath || "webapp"),
                                [testName]: "/base/test",
                                "test": "/base/test/"
                            }
                        }
                    }
                },
                files: [{
                    src: ["test/unit/allTest.js"],
                    included: true
                }],
                reporters: ["progress", "junit", "coverage"],
                coverageReporter: {
                    type: "lcovonly",
                    dir: "reports",
                    subdir: "coverage",
                    file: "lcov.info",
                    includeAllSources: true
                },
                autoWatch: true,
                singleRun: true,
                browserNoActivityTimeout: 300000,
                browsers: ["Chrome_custom"]
            },
        },

        openui5_preload: {
            component: {
                options: {
                    resources: {
                        cwd: "webapp",
                        prefix: componentPath
                    },
                    dest: "webapp"
                },
                components: {
                    [componentPath]: {
                        src: [componentPath + "/**",
                            "!" + componentPath + "/test/**",
                            "!" + componentPath + "/Component-preload.js"]
                    }
                }
            },
        }
    });

    grunt.loadNpmTasks("grunt-openui5");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks("grunt-contrib-connect");

    grunt.registerTask("default", ["openui5_preload"]);

    grunt.registerTask("unitTests", [
        "connect:default",
        "karma:LocalUnitTests"
    ]);

    grunt.registerTask("onlineUnitTests", [
        "clean",
        "karma:OnlineUnitTests",
    ]);

    grunt.registerTask("serve", function(target) {
        grunt.task.run([
            'configureProxies:server',
            'connect:proxy:keepalive',
        ]);
    });
};