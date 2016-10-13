"use strict"

var hello = require('./hello/main.js');
var app = hello;
var caf_core = require('caf_core');
var myUtils = caf_core.caf_components.myUtils;
var async = caf_core.async;
var cli = caf_core.caf_cli;
var request = require('request');

var CA_OWNER_1='forwardother1';
var CA_LOCAL_NAME_1='admin';
var CA_LOCAL_NAME_2='foo';
var FROM_1 =  CA_OWNER_1 + '-' + CA_LOCAL_NAME_1;
var FROM_2 =  CA_OWNER_1 + '-' + CA_LOCAL_NAME_2;


process.on('uncaughtException', function (err) {
               console.log("Uncaught Exception: " + err);
               console.log(myUtils.errToPrettyStr(err));
               process.exit(1);

});

var getIt = function(test, path, num, cb) {
    request.get('http://127.0.0.1:3000/' + path, {},
                function (error, response, body) {
                    test.ifError(error);
                    if (isNaN(num)) {
                        test.equal(response.statusCode, 404);
                    } else {
                        test.equal(num, parseInt(body));
                    }
                    cb(null);
                });
};

module.exports = {
    setUp: function (cb) {
       var self = this;
        app.init( {name: 'top'}, 'framework.json', null,
                      function(err, $) {
                          if (err) {
                              console.log('setUP Error' + err);
                              console.log('setUP Error $' + $);
                              // ignore errors here, check in method
                              cb(null);
                          } else {
                              self.$ = $;
                               cb(err, $);
                          }
                      });
    },
    tearDown: function (cb) {
        var self = this;
        if (!this.$) {
            cb(null);
        } else {
	    console.log('********');
            this.$.top.__ca_graceful_shutdown__(null, cb);
        }
    },
    forward: function (test) {
        test.expect(10);
        var s1;
        var from1 = FROM_1;
        var from2 = FROM_2;
        async.series([
            function(cb) {
                s1 = new cli.Session('ws://foo-xx.vcap.me:3000', from1, {
                    from : from1
                });
                s1.onopen = function() {
                    getIt(test, 'one', 1, cb);
                };
            },
            function(cb) {
                var cb1 = function(err) {
                    test.ifError(err);
                    cb(null);
                };
                s1.setBinding(from2, 'http://foo-xx.vcap.me:3000/forwardother1-bar1',
                              cb1);
            },
            function(cb) {
                getIt(test, from2 + '/three', 3, cb);
            },
            function(cb) {
                var cb1 = function(err) {
                    test.ifError(err);
                    cb(null);
                };
                s1.deleteBinding(from2, cb1);
            },
            function(cb) {
                getIt(test, from2 + '/three', NaN, cb);
            },

            function(cb) {
                s1.onclose = function(err) {
                    test.ifError(err);
                    cb(null, null);
                };
                s1.close();
            }
        ], function(err, res) {
            test.ifError(err);
            test.done();
        });
    }
};
