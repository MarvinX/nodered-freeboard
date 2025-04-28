/**
 * Copyright 2015 Urbiworx
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Changes, (C) 2021 MarvinX
 * - Fixes in RED.httpNode.get("/freeboard_api/datasourceupdate" ...) handler
 *   to get rid of using obsolete express.js functions
 * - Commented out the now unused postValue() handler after changes in polling
 *   logic defined within 'datasource.jsheader'
 * - Client-side polling for datasource updates is now always done using
 *   the "direct" method with a frequency of 500msec. See also the slightly
 *   adjusted ux.freeboard.poll() implementation in 'datasource.jsheader' template.
 * - Improvements RED.httpNode.get("/freeboard_api/datasourceupdate" ...) handler
 *   to check the node's flow context for 'isValid' flag. 
 **/

var express=require("express");
var mustache=require("mustache");
var fs=require("fs");
var bodyParser = require('body-parser');
const path = require("path");
module.exports = function(RED) {
    "use strict";
    var userDir="";
    var flowFileDir="";
    if (RED.settings.userDir){
        userDir=RED.settings.userDir+"/";
    }
    if (RED.settings.flowFile){
        flowFileDir=path.dirname(RED.settings.flowFile)+"/";
    }

    var dstemplate;
    var dslib;
    // var pendingresponses=new Array();
    fs.readFile(__dirname+"/datasource.template", function (err, data) {
        if (err) throw err;
        dstemplate=data.toString();
    });
    fs.readFile(__dirname+"/datasource.jsheader", function (err, data) {
        if (err) throw err;
        dslib=data.toString();
    });

    var nodes=new Array();
    function Freeboard(n) {
        RED.nodes.createNode(this,n);
        this.name = n.name.trim();
        nodes.push(this);
        var that = this;
        this.on("input", function(msg) {
            that.lastValue=msg.payload;
            // postValue(that.id,that.lastValue);
        });
        this.on("close",function() {
            var index = nodes.indexOf(that);
            if (index > -1) {
                nodes.splice(index, 1);
            }
        });
    }

    RED.httpNode.use(bodyParser.urlencoded({
        extended: true
    }));
    RED.httpNode.use("/freeboard",express.static(__dirname + '/node_modules/freeboard'));
    RED.httpNode.get("/freeboard_api/datasources",
        function (req,res){
            res.write(dslib);
            for (var i in nodes){
                res.write(mustache.render(dstemplate,{name:nodes[i].name,display_name:nodes[i].name,description:'',id:nodes[i].id}));
            }
            res.end();
        }
    );
    RED.httpNode.post("/freeboard_api/dashboard",
        function (req,res){
            fs.writeFile(userDir+"freeboard_"+req.body.name+".json", req.body.content, function (err, data) {
                if (err) throw err;
                res.end();
            });
        }
    );
    RED.httpNode.get("/freeboard_api/datasourceupdate",
        function (req,res){
            var ret={};
            for (var node of nodes) {
                if (node.context().flow.get('isValid') === false) {
                    node.lastValue = null;
                }
                ret[node.id] = node.lastValue;
            }
            res.end(JSON.stringify(ret));
        }
    );
    RED.httpNode.get("/freeboard_api/dashboard/:name",
        function (req,res){
            // Try reading $flowFileDir/freeboard_<req.params.name>.json
            fs.readFile(flowFileDir+"freeboard_"+req.params.name+".json", function (err, data) {
                if (err) {
                    // Try reading $userDir/freeboard_<req.params.name>.json
                    fs.readFile(userDir+"freeboard_"+req.params.name+".json", function (err, data) {
                        if (err) {
                            res.end(JSON.stringify({empty:true}));
                        } else {
                            res.end(data.toString());
                        }
                    })
                } else {
                    res.end(data.toString());	
                }
            });
        }
    );
    RED.nodes.registerType("freeboard",Freeboard);
}
