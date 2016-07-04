var http = require('http');
var events = [];
var cursors = {};

var server = http.createServer(function(req, res) {
  var path = req.url;
  var reqBody = '';

  req.on('data', function(data) {
    reqBody += data;
  });

  req.on('end', function() {
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
