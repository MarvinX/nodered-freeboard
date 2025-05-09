const path = require('path');
const fs = require('fs');

let fbPath = path.dirname(require.resolve("freeboard/package.json"))+"/";

// Define modified dashboard init script for freeboard/index.html
var head=
    '       head.js("js/freeboard.js","js/freeboard.plugins.min.js", "../freeboard_api/datasources", "plugins/thirdparty/jquery.keyframes.min.js", "plugins/thirdparty/widget.ragIndicator.js",\n'+
    '           function() {\n'+
    '               $(function() { //DOM Ready\n'+
    '                   freeboard.initialize(true);\n'+
    '                   var hash = window.location.hash;\n'+
    '                   if (hash !== null) {\n'+
    '                       $.get("/freeboard_api/dashboard/"+hash.substring(1), function(data) {\n'+
    '                           var datap=JSON.parse(data);\n'+
    '                           if (!datap.empty) {\n'+
    '                               freeboard.loadDashboard(datap, function() {\n'+
    '                                   freeboard.setEditing(false);\n'+
    '                               });\n'+
    '                           }\n'+
    '                       });\n'+
    '                       document.title="freeboard/"+hash.substring(1);\n'+
    '                   }\n'+
    '               });\n'+
    '           });\n'+
    '   </script>\n';

// Apply init script patch in freeboard/index.html
fs.readFile(path.normalize(fbPath+'index.html'), 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    var result = data.replace(/head.js[\s\S]*?<\/script>/g, head);
    fs.writeFile(path.normalize(fbPath+'index.html'), result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});

// Define modified saveDashboard function for freeboard/js/freeboard.js
var saveDashboard=
    'this.saveDashboard = function(_thisref, event) {\n'+
    '    var pretty = $(event.currentTarget).data("pretty");\n'+
    '	   var hash=window.location.hash;\n'+
    '    if (typeof(hash)=="undefined"||hash==null||hash=="") {\n'+
    '        hash="start-"+Math.floor(Math.random()*99999);\n'+
    '        window.location.hash=hash;\n'+
    '    } else {\n'+
    '        hash=hash.substring(1);\n'+
    '    }\n'+
    '    var contentType = "application/octet-stream";\n'+
    '    var a = document.createElement("a");\n'+
    '    $.ajax({\n'+
    '        type: "POST",\n'+
    '        url: "../freeboard_api/dashboard",\n'+
    '        data: {\n'+
    '            content: pretty?JSON.stringify(self.serialize(), null, "\t"):JSON.stringify(self.serialize()),\n'+
    '            name:hash\n'+
    '        }\n'+
    '    }).done(function() {\n'+
    '        new DialogBox("Dashboard is saved, make sure to bookmark the URL.", "Info", "OK");\n'+
    '    });\n'+
    '}\n';

// Apply saveDashboard patch in freeboard/js/freeboard.js
fs.readFile(path.normalize(fbPath+'js/freeboard.js'), 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    var result = data.replace(/this\.saveDashboard =[\s\S]*?a\.click[\s\S]*?\}/g, saveDashboard);
    fs.writeFile(path.normalize(fbPath+'js/freeboard.js'), result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});

// Copy the dashboard plugins from freeboard-widget-rag-files/ to freeboard/plugins/
fs.createReadStream(path.normalize('freeboard-widget-rag-files/jquery.keyframes.min.js')).pipe(
    fs.createWriteStream(path.normalize(fbPath+'plugins/thirdparty/jquery.keyframes.min.js')));
fs.createReadStream(path.normalize('freeboard-widget-rag-files/widget.ragIndicator.js')).pipe(
    fs.createWriteStream(path.normalize(fbPath+'plugins/thirdparty/widget.ragIndicator.js')));
  