var express = require('express')

var app = express.createServer();

app.get('/', function(req, res) {
    res.send('Hello World\n');
});

app.get('/rand/:max', function(req, res) {
    var max = parseInt(req.params.max);
    var rand = Math.floor(Math.random() * (max + 1));
    res.send('random: ' + rand + '\n');
});

app.listen(3000);

console.log('Server running at http://127.0.0.1:3000/');
