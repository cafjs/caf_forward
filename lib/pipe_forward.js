/*!
Copyright 2014 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
'use strict';
/**
 * Processing pipeline for forwarding HTTP requests.
 *
 *
 * @module caf_forward/pipe_forward
 * @augments external:caf_platform/gen_pipe
 */

var caf_core = require('caf_core');
var caf_comp = caf_core.caf_components;
var myUtils = caf_comp.myUtils;
var caf_platform = caf_core.caf_platform;
var gen_pipe = caf_platform.gen_pipe;
var request = require('request');
var url = require('url');

exports.newInstance = function($, spec, cb) {
    try {

        var that = gen_pipe.constructor($, spec);

        $._.$.log && $._.$.log.debug('New forward pipe');

        that.__ca_connectSetup__ = function(app) {
            app.use(spec.env.path, function(req, res, next) {
                var pathName = req.url && url.parse(req.url).pathname || '';
                if ($._.$.forward && pathName) {
                    pathName = pathName.split('/');
                    var prefix = pathName[1]; // e.g., foo-ca1
                    var suffix = pathName.slice(2).join('/'); // e.g., path/x.md
                    $._.$.forward.lookup(prefix, function(err, newURL) {
                        if (err) {
                            $._.$.log &&
                                $._.$.log.debug('Error in lookup ' +
                                                myUtils.errToPrettyStr(err));
                            next();
                        } else {
                            var newReq = request(newURL + '/' + suffix);
                            newReq.on('error', function(err) {
                                if (err) {
                                    $._.$.log &&
                                        $._.$.log.debug('Request error ' +
                                                        myUtils
                                                        .errToPrettyStr(err));
                                }
                                next();
                            });
                            req.pipe(newReq).pipe(res);
                        }
                    });
                } else {
                    next();
                }
            });
        };

        cb(null, that);

    } catch (err) {
        cb(err);
    }
};
