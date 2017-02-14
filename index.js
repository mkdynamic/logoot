var http = require('http');
var fileSystem = require('fs');
var pathLib = require('path');
var events = [];
var cursors = {};

function serve(res, file) {
    var filePath = pathLib.join(__dirname, file);
    var stat = fileSystem.statSync(filePath);

    var contentType = 'text/html';
    if (file.endsWith('.js')) {
      contentType = 'text/js'
    }

    res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size
    });

    var readStream = fileSystem.createReadStream(filePath);
    readStream.pipe(res);
}

var server = http.createServer(function(req, res) {
  var path = req.url;
  var reqBody = '';

  req.on('data', function(data) {
    reqBody += data;
  });

  req.on('end', function() {
    if (path == '/') {
      serve(res, 'index.html');
      return;
    }
    if (path.endsWith('.js')) {
      serve(res, path);
      return;
    }

    var params = JSON.parse(reqBody);

    if (path === '/snd') {
      events.push(params);
      console.log('/snd', reqBody);
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('ok');
    } else if (path === '/rcv') {
      console.log('/rcv', reqBody);
      var clientId = params.clientId;
      var data = [];
      if (typeof cursors[clientId] === 'undefined') cursors[clientId] = 0;
      for (var idx = cursors[clientId]; idx < events.length; idx++) {
        var event = events[idx];
        data.push(event);
      }
      cursors[clientId] = events.length;
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(data));
    } else {
      console.log('404');
      res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('not found');
    }
  });
});

server.listen(8080);
