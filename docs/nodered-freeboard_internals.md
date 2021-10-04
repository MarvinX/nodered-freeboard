# Node-RED/Freeboard addon design notes

## Overview

This document containes notes on the basic design and internals of the nodered-freeboard addon.<br>
For a step-by-step instruction of how to setup and use the nodered-freeboard addon refer to 
[nodered-freeboard_setup_and_usage](nodered-freeboard_setup_and_usage.md).

## General approach

### Server-side part
- [Node-RED](https://nodered.org/) is used as offline editor for defining the dataflows to be visualized on a Freeboard dashboard using one or more nodered-freeboard nodes as output interface.
- Furthermore, Node-RED is used at runtime as web-based dataservice for hosting deployed data flows from which nodered-freeboard datasources of one or more Freeboard dashboards (clients) can periodically request upates through a REST-based API.
- The Node-RED dataservice is running on HTTP server port 1880 by default.
- Deployed Node-RED flows containing one or more nodered-freeboard datasources can be accessed by Freeboard dashboard clients through a dedicated REST-API which is rooted at ``<nodered>/freeboard_api/``.
- The server-side code for the ``<nodered>/freeboard_api/`` endpoints setup and handling client requests is defined in [freeboard.js](../freeboard.js) (which is part of the nodred-freeboard package) using the Node-RED [httpNode](https://nodered.org/docs/api/modules/v/0.20.0/node-red.html#.httpNode) interface.
- The Node-RED ``httpNode`` interface exposes [express.js](https://expressjs.com/en/5x/api.html#express) based middleware services to Node-RED node for extending the Node-RED dataservice with additional endpoints. 

### Client-side part
- [Freeboard dashboard](https://freeboard.io/) is used for data flow visualization.
- The self-hosted Freeboard dashboard app is open-source and available for download [here](https://github.com/Freeboard/freeboard).
- For development and testing purposes the Freeboard dashboard will be hosted locally on the same machine as the Node-RED data service.
- The code of the locally hosted Freeboard dashboard app is part of the nodered-freeboard package and installed [side-by-side](../node_modules/freeboard) with the server-side code under ``~/.node-red/node_modules/node-red-contrib-freeboard/node_modules/freeboard``.
- The Freeboard dashboard app added to the Node-RED runtime using the ``httpNode`` interface. This is done when the nodered-freeboard addon is loaded into Node-RED; see [freeboard.js](../freeboard.js); cf. notes from previous section for further information on the Node-RED ``httpNode`` interface.
- The running Freeboard dashboard service is hosted under ``<nodered>/freeboard``.   

## Basic design

The nodered-freeboard addon provides two things:
- The [Node-RED/Freeboard node](https://nodered.org/docs/creating-nodes/) for adding the custom Freeboard node to Node-RED.
- The [Freeboard/Node-RED datasource template](https://github.com/Freeboard/plugins/blob/master/datasources/plugin_example.js) for using Node-RED flows in a dashboard instance.

The custom Node-RED/Freeboard node is integrated into Node.js and Node-RED framework using the following files. See also [Creating your first node](https://nodered.org/docs/creating-nodes/first-node) from Node-RED documentation.
- [package.json](../package.json), defines the Node.js module ``freeboard`` and defines dependencies and packaging instructions for NPM.
- [freeboard.js](../freeboard.js), defines the Node-RED integration functions (Node-RED wrapper) for the freeboard node; see below for details. 
- [freeboard.html](../freeboard.html), provides the freeboard nodes's HTML file which registers the freeboard node in Node-RED editor and defines the configuration parameters for the node's Node-RED editor template and the node's help text displayed in Node-RED editor. 

The NPM installer uses the information provided by [package.json](../package.json) for registering the nodered-freeboard node as follows:
```json
"name": "node-red-contrib-freeboard",
"node-red": {
    "nodes": {
        "freeboard": "freeboard.js"
    }
}
```
The ``node-red`` section in package.json registers the ``freeboard`` node as part of Node-RED and tells the Node-RED runtime to load the ``freeboard.js`` script which contains the freeboard node implementation. In fact, the above lines register the new node type ``freeboard`` and it's implementing Node.js module. When using the nodered-freeboard node in the Node-RED editor, then the registration happens through the following lines from [freeboard.html](../freeboard.html).

```html
<script type="text/javascript">
    RED.nodes.registerType('freeboard',{
        category: 'advanced-function',
    // ...
</script>
```
By naming convention, entrypoint in ``freeboard.js`` is ``function Freeboard(params)`` which is called by Node-RED runtime when a new nodered-freeboard instance is created in the Node-RED editor. The ``params`` argument contains the node's configuration parameter from the Node-RED editor. For the nodered-freeboard node there is only a single config-param, which is the name of nodered-freeboard node instance as assigned by the user.

```js
function Freeboard(n) {
    RED.nodes.createNode(this,n);
    this.name = n.name.trim();
    // ...
}
```

## ``freeboard.js`` implementation details

This script implements the required Node.js/Node-RED function for constructing new nodered-freeboard nodes and receiving/sending messages provided by Node-RED flows. Other things such as logging and timers for the cyclic polling of incoming flows and data refresh of outgoing flows are defined here as well. See [Creating you first node/JavaScript file](https://nodered.org/docs/creating-nodes/node-js) from Node-RED documentation.

### Node-RED node constructor

- ``function Freeboard(n)``
- Create a new nodered-freeboard instance with name ``n``
- Register a listener/handler for ``input`` events of this node which receives the flow's msg.payload updates
- Register some cleanup code as listener for the ``close`` event of this node

```js
    function Freeboard(n) {
        RED.nodes.createNode(this,n); // create a new freeboard node instance
        this.name = n.name.trim();    // set the name attribute for this instance
		nodes.push(this);             // add new instance to internal 'nodes' list
        var that = this;
        this.on("input", function(msg) {  // register 'input' event listener/handler which updates
			that.lastValue=msg.payload;   // the node with msg.payload data from the incoming flow 
        });
		this.on("close",function() {         // register cleanup code for 'close' event 
			var index = nodes.indexOf(that); // which removes this node item from 'nodes' list 
			if (index > -1) {
				nodes.splice(index, 1);   
			}
		});
    }
```

### REST-API handler ``/freeboard_api/datasourceupdate`` 

- The server-side REST handler for ``/freeboard_api/datasourceupdate`` requests is found in ``freeboard.js`` and is as follows.

```js
	RED.httpNode.get("/freeboard_api/datasourceupdate",
		function (req,res){
            var ret={};
            for (var i in nodes){
                ret[nodes[i].id]=nodes[i].lastValue;
            }
            res.end(JSON.stringify(ret));
		}
	);
```
- The above handler code is periodically invoked (polled) from the Freeboard dasboard; see [datasource.jsheader](../datasource.jsheader), which contains the following embedded JS script that polls for nodered-freeboard updates.

```html
<script type="text/javascript">
    ux.freeboard.poll=function(){
        setTimeout(function(){
            $.ajax({
                // get updates from nodered-freeboard datasources
                url: "../freeboard_api/datasourceupdate?direct=true"
            }).done(function(data) {
                var pdata=JSON.parse(data);
                // iterate over received data items in 'pdata' array
                // and use the item 'name' properties to map the associated
                // data to the dashboard's nodered-freeboard datasources
                for(var name in pdata)
                {
                    if (pdata.hasOwnProperty(name))
                    {
                        // Check if this dashboard instance actually uses the 
                        // named nodered-freeboard datasource 
                        if (typeof(ux.freeboard.datasources[name])!=="undefined"){
                            // Perform datasource update
                            ux.freeboard.datasources[name].update(pdata[name]);
                        }
                    }
                }
                ux.freeboard.poll(); // restart polling the datasource ...
            });
        }, 500);                     // ... after setTimeout(.,500 msec)
    }
    ux.freeboard.poll(); // start polling for datasource updates
</script>
```
- The client-side ``poll()`` function, as defined in the above code snippet, is added to the 
  ``ux.freeboard`` object which manages all configured nodered-freeboard datasources of a particular Freeboard dashboard instance.
- The ``ux.freeboard`` object and associated functions are defined in [datasource.jsheader](../datasource.jsheader), which is injected into the Freeboard dashboard instance, when a new datasource is added. This is explained in more detail
further down in this document.  

### REST-API handler ``/freeboard_api/datasources``

- The server-side REST handler for ``/freeboard_api/datasources`` requests is found in ``freeboard.js`` and is as follows.
```js
    RED.httpNode.get("/freeboard_api/datasources",
        function (req,res){
            // Write common definitions from 'datasource.jsheader' files 
            // These defintions were loaded into dslib variable; see freeboard.js for details.
            res.write(dslib); 
            // For each nodered-freeboard node defined by active Node-RED flows, generate the
            // corresponding datasource descriptor to be send to the requesting Freeboard 
            // dashboard client. The Freeboard datasource descriptors are generated using
            // the Mustache template 'datasource.template' which is part of the 
            // nodered-freeboad package.  
            for (var i in nodes){
                res.write(mustache.render(dstemplate,{name:nodes[i].name,display_name:nodes[i].name,description:'',id:nodes[i].id}));
            }
            res.end();
        }
    );
```
- The above handler is invoked from [freeboard/index.html](../node_modules/freeboard/index.html) as part of the page initialization script. Hence, the definitions of available nodered-freeboard datasources are dynamically injected into the calling Freeboard dashboard instance when the dashboard is loaded or refreshed (using CTRL+F5 in Chrome browser). 

### REST-API handler ``/freeboard_api/dashboard``

- The server-side REST handler for ``/freeboard_api/dashboard`` requests is found in ``freeboard.js`` and is as follows.

```js
	RED.httpNode.post("/freeboard_api/dashboard",
		function (req,res){
            // Load the Freeboard dashboard content from file 'freeboard_<dasboard-name>.json'
            // which is located in the Node-RED user directory '~/.node-red'.
			fs.writeFile(userDir+"freeboard_"+req.body.name+".json", req.body.content, function (err, data) {
				if (err) throw err;
				res.end();
			});

		}
	);
```
- The above handler is invoked from [freeboard/index.html](../node_modules/freeboard/index.html) as part of the dashboard initialization script as follows.

```html
    <script type="text/javascript">
        head.js("js/freeboard.js","js/freeboard.plugins.min.js", "/freeboard_api/datasources", "plugins/thirdparty/jquery.keyframes.min.js", "plugins/thirdparty/widget.ragIndicator.js",
        function(){ 
            $(function(){ //DOM Ready
                freeboard.initialize(true);
                var hash = window.location.hash;
                if (hash !== null) {
                    $.get("/freeboard_api/dashboard/"+hash.substring(1), function(data) {
                    var datap=JSON.parse(data);
                    if (!datap.empty){
                        freeboard.loadDashboard(datap, function() {
                            freeboard.setEditing(false);
                            });
                        }
                    });
                }
            });
	    });
	</script>
```
- The above client-side dashboard initialitation code loads the nodered-freeboard ``datasources`` descriptors via the nodered-freeboard REST API, i.e. using the ""/freeboard_api/datasources" REST-API interface. This is done (together with other script loading stuff) at the very beginning of the page loading process, before the DOM-Ready event. 
- Afterwards, the dashboard initialization code calls ``freeboard.initialize()`` which initializes the Freeboard backend; see [here](https://github.com/Freeboard/freeboard#api) for details.
- Next, the dashboard initialization code checks to see wheter the page URL contains a trailing ``#<dashboad-name>`` token. If so, then it tries to load the file ``freeboard_<dashboard-name>.json`` from the Node-RED user directory (\~\/.node-red) containing a saved Freeboard dashboard. The dashboard objects are then added to the Freeboard backend by calling ``freeboard.loadDashboard()``; see [here](https://github.com/Freeboard/freeboard#api) for details.

## Freeboard ``datasource.template`` and ``datasource.jsheader``

- The nodered-freeboard [datasource.template](../datasource.template) defines a custom Freeboard Datasource plugin for adding and using Node-RED datasources in Freeboard dashboards. 
- For details about how this works in detail, see [this link](http://freeboard.github.io/freeboard/docs/plugin_example.html), which provides an example for writing a custom Freeboard Datasource plugin.
- The template is applied within [freeboard.js](../freeboard.js) by the REST-API handler ``/freeboard_api/datasources``, as described in the previous section.
- The management objects and functions for all loaded nodered-freeboard datasources inside a Freeboard dashboard instance is implemented in [datasource.jsheader](../datasource.jsheader).
- The script code contained in the ``datasource.jsheader`` file is injected into the calling client code by calling the server-side ``/freeboard_api/datasources`` REST-API.
- In particular, the datasource polling function is defined in ``datasource.jsheader``, which periodically requests updates from Node-RED by calling the server-side  ``/freeboard_api/datasourceupdate`` REST-API.



