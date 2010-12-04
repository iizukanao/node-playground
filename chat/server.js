var TwitterNode = require('twitter-node').TwitterNode
,   sys         = require('sys')
,   http        = require('http')
,   io          = require('socket.io')
,   paperboy    = require('paperboy')
,   path        = require('path')
,   PORT        = 8124
,   WEBROOT     = path.join(path.dirname(__filename), 'webroot');

paperboy.contentTypes['ico'] = 'image/x-icon';

var server = http.createServer(function(req, res){
    var ip = req.connection.remoteAddress;
    paperboy
        .deliver(WEBROOT, req, res)
        .addHeader('Expires', 300)
        .addHeader('X-PaperRoute', 'Node')
        .before(function(){
            sys.log('Received Request');
        })
        .after(function(statCode){
            log(statCode, req.url, ip);
        })
        .error(function(statCode, msg) {
            res.writeHead(statCode, {'Content-Type': 'text/plain'});
            res.end('Error ' + statCode);
            log(statCode, req.url, ip, msg);
        })
        .otherwise(function(err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Error 404: File not found');
            log(404, req.url, ip, err);
        });
});
server.listen(PORT);

var clientId = 0;
var socket = io.listen(server);
socket.on('connection', function(client) {
    client.send({
        'type': 'system',
        'clientId':   ++clientId,
    });

    client.on('message', function(data) {
        console.log('message from client: ' + data.text);
        socket.broadcast({
            'type': 'message',
            'time': new Date().toLocaleTimeString(),
            'user': data.user,
            'text': data.text,
        });
    })
    client.on('disconnect', function(){
        console.log('disconnect on server');
    })
});

console.log('Server running at http://127.0.0.1:8124/');

function log(statCode, url, ip, err) {
    var logStr = statCode + ' - ' + url + ' - ' + ip;
    if (err)
        logStr += ' - ' + err;
    sys.log(logStr);
}
