var sys         = require('sys')
,   http        = require('http')
,   io          = require('socket.io')
,   paperboy    = require('paperboy')
,   path        = require('path')
,   PORT        = 8125
,   WEBROOT     = path.join(path.dirname(__filename), 'webroot')

paperboy.contentTypes['ico'] = 'image/x-icon';

var server = http.createServer(function(req, res){
    var ip = req.connection.remoteAddress;
    paperboy
        .deliver(WEBROOT, req, res)
        .addHeader('Expires', 300)
        .addHeader('X-PaperRoute', 'Node')
        .addHeader('Content-Type', 'image/x-icon')
        .before(function(){
//            sys.log('received request for ' + req.url);
        })
        .after(function(statCode){
//            console.log('delivered: ' + req.url);
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
var clients = {};
socket.on('connection', function(client) {
    var id = ++clientId;
    console.log('new client id: ' + id);
    var firstX = 3;
    var firstY = 3;
    for (var i = 0; ; i++) {
        var is_empty = true;
        for ( cid in clients ) {
            if ( clients[cid].x == firstX && clients[cid].y == firstY ) {
                is_empty = false;
                break;
            }
        }
        if (is_empty) {
            break;
        }
        firstX += 13;
        firstX %= 20;
        firstY += 1;
    }
    console.log('firstX: ' + firstX + ', firstY: ' + firstY);
    console.log("opponents:");
    console.dir(clients);
    client.send({
        'type': 'init',
        'clientId': id,
        'x': firstX,
        'y': firstY,
        'opponents': clients,
    });
    socket.broadcast({
        'type': 'new_client',
        'clientId': id,
        'x': firstX,
        'y': firstY,
    });
    clients[id] = { x: firstX, y: firstY };

    client.on('message', function(data) {
//        console.log('message from client');
        clients[id] = { x: data.x, y: data.y };
        for ( cid in clients ) {
            if ( id == cid ) continue;
            if ( clients[cid].x == data.x && clients[cid].y == data.y ) {
                delete clients[cid];
                console.log('lose: client ' + cid);
                socket.broadcast({
                    'type': 'disappear',
                    'clientId': cid,
                });
            }
        }
        socket.broadcast({
            'type': 'move',
            'clientId': id,
//            'time': new Date().toLocaleTimeString(),
            'x': data.x,
            'y': data.y,
        });
    })
    client.on('disconnect', function(){
        console.log('disconnect on server: ' + id);
        delete clients[id];
        console.log('current clients:');
        console.dir(clients);
        socket.broadcast({
            'type': 'disappear',
            'clientId': id,
        });
    })
});

console.log('Server running at http://127.0.0.1:' + PORT + '/');

function log(statCode, url, ip, err) {
    var logStr = statCode + ' - ' + url + ' - ' + ip;
    if (err)
        logStr += ' - ' + err;
    sys.log(logStr);
}
