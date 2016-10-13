/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

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
 * Plug for forwarding HTTP requests.
 *
 *
 * @name caf_react/plug_react
 * @namespace
 * @augments gen_plug
 *
 */
var assert = require('assert');
var caf_core = require('caf_core');
var caf_comp = caf_core.caf_components;
var caf_transport = caf_core.caf_transport;
var json_rpc = caf_transport.json_rpc;
var genPlug = caf_comp.gen_plug;
var async = caf_comp.async;
var myUtils = caf_comp.myUtils;

/**
 * Factory method to forward HTTP requests.
 *
 * @see caf_components/supervisor
 */
exports.newInstance = function($, spec, cb) {
    try {
        var that = genPlug.constructor($, spec);

        $._.$.log && $._.$.log.debug('New forward plug');

        assert.equal(typeof spec.env.adminCA, 'string',
                     "'spec.env.adminCA' is not a string");

        assert.equal(typeof spec.env.forwardingTable, 'string',
                     "'spec.env.forwardingTable' is not a string");

        var mapCache = {};

        /*
         * Looks up a key in SharedMap <owner>-<adminCA>-<forwardingTable>
         *
         * key syntax is <owner>-<localname>
         */
        that.lookup = function(key, cb0) {
            try {
                var mapKey = json_rpc.joinName(json_rpc.splitName(key)[0],
                                               spec.env.adminCA,
                                               spec.env.forwardingTable);
                var lookupImpl = function() {
                    var ref = mapCache[mapKey].ref(true);
                    var prefixURL = ref.get(key);
                    if (prefixURL) {
                        cb0(null, prefixURL);
                    } else {
                        var err = new Error('Key not found');
                        err.key = key;
                        cb0(err);
                    }
                };

                if (mapCache[mapKey]) {
                    lookupImpl();
                } else {
                    $._.$.sharing.slaveOf(mapKey, {}, function(err, map) {
                        if (err) {
                            cb0(err);
                        } else {
                            mapCache[mapKey] = map;
                            lookupImpl();
                        }
                    });
                }
            } catch (ex) {
                cb0(ex);
            }
        };

        var super__ca_shutdown__ = myUtils.superior(that, '__ca_shutdown__');
        that.__ca_shutdown__ = function(data, cb0) {
            if (that.__ca_isShutdown__) {
                cb0(null);
            } else {
                async.each(Object.keys(mapCache),
                           function(name, cb1) {
                               try {
                                   $._.$.sharing.unregisterSlave(name,
                                                                 mapCache[name],
                                                                 cb1);
                               } catch (ex) {
                                   cb1(ex);
                               }
                           }, function(err) {
                               if (err) {
                                   $._.$.log &&
                                       $._.$.log.debug('Ignoring ' + myUtils
                                                       .errToPrettyStr(err));
                               }
                               mapCache = {};
                               super__ca_shutdown__(data, cb0);
                           });
            }
        };

        cb(null, that);
    } catch (err) {
        cb(err);
    }
};
