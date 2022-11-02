# NodeRED/Freeboard internals

## Overview

This document provides notes on some internal design aspects of the [NodeRED/Freeboard](../README.md) extension.

## Design approach

[Node-RED](https://nodered.org/) in combination with a [self-hosted Freeboard](https://github.com/Freeboard/freeboard) dashboard is used as baseline for realizing an IOT dashboard. Both NodeRED and Freeboard are [Node.js](https://nodejs.org/en/) apps.

The [NodeRED/Freeboard](https://flows.nodered.org/node/node-red-contrib-freeboard) extension provides the glue logic for connecting NodeRED data flows to Freeboard dashboards. This is achieved by (a) extending the NodeRED app with a `Freeboard datasink` node, and (b) extending the Freeboard app with a new `NodeRED datasource` adapter.

The `Freeboard datasink` node is used to expose NodeRED flows as dataservice through the REST-based `<nodered>/freeboard_api/` endpoint.

The `NodeRED datasource` adapter is used to add NodeRED flows provided via `<nodered>/freeboard_api/` endpoint as dashboard datasources, and consuming these flows in one or more dashboard widgets.

In this design approach, the NodeRED app constitutes the datasource part comprising one or more flows exposed through the `<nodered>/freeboard_api/` via `Freeboard sink` nodes. The Freeboard dashboard app constitutes the datasink part comprising one or more dashboard widgets consuming flows from `<nodered>/freeboard_api/` via `NodeRED datasource` adapter.

### NodeRED app

- NodeRED is an [express.js](https://expressjs.com/) based web application which can be either deployed and used as standlone web service or embedded as module into larger Node.js application
- When using NodeRED as standalone web service it has to be started on the Node.js console via

  `#> cd ~/.node-red && node-red`

- After startup, NodeRED will be served by default on <http://localhost:1880>
- NodeRED comprises a `runtime` (backend) component and an `editor` (fontend) component
- The NodeRED editor is accessible in the browser through `<nodered>/index.html`
- The NodeRED editor is used here for defining flows targeting a Freeboard dashboard via `Freeboard datasink` node provided by NodeRED/Freeboard extension

- When `deploying` flows in NodeRED editor, these flows are saved to `~/.node-red/flows.json` and added to NodeRED runtime
- Deployed flows, i.e. their flow nodes, can interact with NodeRED runtime through the [component APIs](https://nodered.org/docs/api/modules/v/1.3/node-red.html), using in particular the [RED.nodes](https://nodered.org/docs/api/modules/v/1.3/node-red.html#.nodes) and [RED.httpNode](https://nodered.org/docs/api/modules/v/1.3/node-red.html#.httpNode) interfaces

### NodeRED/Freeboard extension

- The NodeRED/Freeboard extension registers itself as custom NodeRED node named `freeboard` through the [package.json](../package.json)/node-red section; see also <https://nodered.org/docs/creating-nodes/first-node#package-json>
- The [package.json](../package.json)/node-red section defines [freeboard.js](../freeboard.js), which is a [Node.js module](https://nodejs.org/api/modules.html#the-module-wrapper), as implementation for the custom `freeboard` node
- When NodeRED is started, it loads registered nodes through the Node.js `module.exports` mechanism; see <https://www.tutorialsteacher.com/nodejs/nodejs-module-exports> for details  
- In case of NodeRED/Freeboard extension and its implementation in `freeboard.js`, the `module.exports` object is realized as anonymous function "that gets called when the runtime loads the node on start-up"; see also the notes provided [here](https://nodered.org/docs/creating-nodes/first-node#lower-casejs)
- At the end of the `freeboard.js/module.exeports` implementation one can find the `RED.nodes.registerType("freeboard",Freeboard);` API call
  - The second parameter the of this call refers to `freeboard.js/Freeboard` node constructor, which is called for each `freeboard` node when a flow is deployed; see [here](https://nodered.org/docs/creating-nodes/node-js#node-constructor) for further information
- Along with `freeboard.js` module the [freeboard.html](../freeboard.html) is provided which is used to register the custom `freeboard` node in NodeRED editor; see [here](https://nodered.org/docs/creating-nodes/node-html) for further information
- In addition to that one can also see in `freeboard.js/module.exports` implementation that when the NodeRED/Freeboard extension is loaded into NodeRED it performs a `RED.httpNode.use("/freeboard",express.static(__dirname + '/node_modules/freeboard'));`
  - This call actually load the [freeboard dashboard](../node_modules/freeboard/) module and exposes it as local web service which is hosted by NodeRED and which is accessible in the browser as `<nodered>/freeboard`
- For the interaction between NodeRED runtime and the local freeboard dashboard, such as requesting available Freeboard datasources and polling for updates, the `freeboard.js/module.exports` implementation reagisters various REST services and associated handler functions under `<nodered>/freeboard_api/`
  - The `<nodered>/freeboard_api/` REST services are then used from within the [freeboard dashboard](../node_modules/freeboard/index.html) client code; see the corresponding notes further down in the documents

### Freeboard dashboard service

- The self-hosted Freeboard app is used for dashboarding and dataflow visualization
- The self-hosted Freeboard app is open-source and available [here](https://github.com/Freeboard/freeboard) for download
- For development and testing purposes the Freeboard app will be hosted locally on the same machine as the NodeRED
- The code of the self-hosted Freeboard app is provided as part of the [NodeRED/Freeboard](../README.md) extension package and contained in [../node_modules/freeboard](../node_modules/freeboard)
- The self-hosted Freeboard app will be installed as NodeRED-local dependency under `~/.node-red/node_modules/node-red-contrib-freeboard/node_modules/freeboard`
- The self-hosted Freeboard dashboard app added to NodeRED HTTP service using the ``httpNode`` interface. This is done once when the NodeRED/Freeboard extension is loaded into NodeRED; see also [freeboard.js](../freeboard.js) code
- The running Freeboard dashboard service is hosted under ``<nodered>/freeboard``

## Design details

The NodeRED/Freeboard extension provides two parts:

- A [Custom NodeRED node](https://nodered.org/docs/creating-nodes/) implementation
- A [Custom Freeboard datasource](https://github.com/Freeboard/plugins/blob/master/datasources/plugin_example.js) template

The custom NodeRED/Freeboard node is integrated into NodeRED using the following files

- [package.json](../package.json), defines amongst other things the NodeRED node `freeboard` and its Node.js module `freeboard.js`
- [freeboard.js](../freeboard.js), implements the NodeRED node registration, freeboard dashboard setup and NodeRED <> Freeboard interaction via REST handlers hosted at `<nodered>/freeboard_api/`
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

The `node-red` section in package.json registers the `freeboard` node as part of NodeRED and tells the NodeRED runtime to load the `freeboard.js` script which contains the freeboard node implementation. In fact, the above lines register the new node type `freeboard` and it's implementing Node.js module. When using the nodered-freeboard node in the NodeRED editor, then the registration happens through the following lines from [freeboard.html](../freeboard.html).

```html
<script type="text/javascript">
    RED.nodes.registerType('freeboard',{
        category: 'advanced-function',
    // ...
</script>
```

By naming convention, the entrypoint in `freeboard.js` is `function Freeboard(config)` which is called by NodeRED runtime when a new `freeboard` node is added to a flow NodeRED editor. The `config` argument contains the node's configuration parameters set in NodeRED editor. For the `freeboard` node there is only a single configuration parameter, which is the assigned datasource *name*.

```js
function Freeboard(n) {
    RED.nodes.createNode(this,n);
    this.name = n.name.trim();
    // ...
}
```

## `freeboard.js` implementation details

This module implements the required NodeRED node registration and the node constructor function. Furthermore, this module performs the setup of `<nodered>/freeboard` dashboard service and the registration of `<nodered>/freeboard_api` REST services; see also section "Design apporach / NodeRED/Freeboard extension"

### Node-RED node constructor

- `function Freeboard(n)`
- Called by NodeRED runtime for `freeboard` nodes when a flow is deployed
- Creates a new `freeboard` node instance named *n.name*
- Adds the new node to the list of Freeboard datasources here realized as *nodes* array)
- Registers an `input` event handler of this node for handling msg.payload updates
- Registers a `close` event handler which removes the `freeboard` node instance from the Freeboard datasources list

```js
    function Freeboard(n) {
        RED.nodes.createNode(this,n); // create a new freeboard node instance
        this.name = n.name.trim();    // set the name attribute for this instance
        nodes.push(this);             // add new instance to internal 'nodes' list
        var that = this;
        this.on("input", function(msg) {  // register 'input' event handler which updates
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

### REST-API handler `/freeboard_api/datasourceupdate`

- Implemented in `freeboard.js`
- Handles `/freeboard_api/datasourceupdate` requests from Freeboard dashboard clients

```js
    RED.httpNode.get("/freeboard_api/datasourceupdate",
    function (req,res){
        var ret={};
        for (var i in nodes){
            ret[nodes[i].id]=nodes[i].lastValue;
        }
        es.end(JSON.stringify(ret));
    });
```

- This handler code is periodically invoked (polled) from [Freeboard dashboard](../node_modules/freeboard/index.html); see also [datasource.jsheader](../datasource.jsheader), which contains the following embedded JS script that polls for datasource updates.

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

- The client-side `poll()` function, as defined in the above code snippet, is added to the
  `ux.freeboard` object which manages all configured NodeRED/Freeboard datasources of a particular Freeboard dashboard instance
- The `ux.freeboard` object and associated functions are defined in [datasource.jsheader](../datasource.jsheader), which is injected into the Freeboard dashboard instance, when a new datasource is added. This is explained in more detail further down in this document.  

### REST-API handler `/freeboard_api/datasources`

- Implemented in `freeboard.js`
- Handles `/freeboard_api/datasources` requests from Freeboard dashboard clients

```js
    RED.httpNode.get("/freeboard_api/datasources",
        function (req,res){
            // Write common definitions from 'datasource.jsheader' files 
            // These defintions were loaded into dslib variable; see freeboard.js for details.
            res.write(dslib); 
            // For each nodered-freeboard node defined by active NodeRED flows, generate the
            // corresponding datasource descriptor to be send to the requesting Freeboard 
            // dashboard. The Freeboard datasource descriptors are generated using
            // the Mustache template 'datasource.template' which is part of the 
            // nodered-freeboad package.  
            for (var i in nodes){
                res.write(mustache.render(dstemplate,{name:nodes[i].name,display_name:nodes[i].name,description:'',id:nodes[i].id}));
            }
            res.end();
        });
```

- This handler is invoked from [Freeboard dashboard](../node_modules/freeboard/index.html) as part of the page initialization script. Hence, the definitions of available NodeRED/Freeboard datasources are dynamically injected into the calling Freeboard dashboard instance when the dashboard is loaded or refreshed (using CTRL+F5 in Chrome browser).

### REST-API handler `/freeboard_api/dashboard`

- Implemented in `freeboard.js`
- Handles `/freeboard_api/dashboard` requests from Freeboard dashboard clients

```js
    RED.httpNode.post("/freeboard_api/dashboard",
        function (req,res){
            // Load the Freeboard dashboard content from file 'freeboard_<dasboard-name>.json'
            // which is located in the Node-RED user directory '~/.node-red'.
            fs.writeFile(userDir+"freeboard_"+req.body.name+".json", req.body.content, function (err, data) {
                if (err) throw err;
                res.end();
            });
        });
```

- The above handler is invoked from [Freeboard dashboard](../node_modules/freeboard/index.html) as part of the dashboard initialization script as follows.

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

- The above client-side dashboard initialitation code loads the `datasources` descriptors from NodeRED/Freeboard extension via `<nodered>/freeboard_api/datasources` REST service. This is done at the very beginning of the page loading process, before the DOM-Ready event.
- Afterwards, the dashboard initialization code calls `freeboard.initialize()` which initializes the Freeboard backend; see [here](https://github.com/Freeboard/freeboard#api) for details.
- Next, the dashboard initialization code checks to see wheter the page URL contains a trailing `#<dashboad-name>` token. If so, it tries to load the file `freeboard_<dashboard-name>.json` from the NodeRED user directory `~/.node-red`. The dashboard objects are then added to the Freeboard backend by calling `freeboard.loadDashboard()`; see [here](https://github.com/Freeboard/freeboard#api) for details.

## Freeboard ``datasource.template`` and ``datasource.jsheader``

- The nodered-freeboard [datasource.template](../datasource.template) defines a custom Freeboard datasource plugin for adding and using NodeRED datasources in Freeboard dashboards.
- For details about how this works in detail, see [this link](http://freeboard.github.io/freeboard/docs/plugin_example.html), which provides an example for writing a custom Freeboard datasource plugin.
- The template is applied within [freeboard.js](../freeboard.js) in the REST-API handler `/freeboard_api/datasources`, as described in the previous section
- The management objects and functions for all loaded NodeRED/Freeboard datasources inside a Freeboard dashboard are implemented in [datasource.jsheader](../datasource.jsheader)
- The script code contained in the `datasource.jsheader` file is injected into Freeboard client by calling via REST service `/freeboard_api/datasources`
- In particular, the datasource polling function is defined in `datasource.jsheader`
