var interval = 20;
var xCells = 30;
var yCells = 30;
var colorCycle = [
    '#fcf', '#ffc', '#cff', '#ccf', '#fcc', '#f33', '#9ff',
    '#33f', '#999', '#000', '#46a7b8', '#6c46b8', '#9a750e', '#d6298a'
];
var myColor = '#bfb';

var socket = new io.Socket('localhost', {'port': 8125});
var clientId;
var opponents = {};
socket.on('message', function(data) {
//    console.dir(data);
    if ( data.type == 'init' ) {
//        console.log('my client id: ' + clientId);
//        console.dir(data);
        var i = 0;
        for (id in data.opponents) {
            var model = new Position({
                x: data.opponents[id].x,
                y: data.opponents[id].y
            });
//            console.log('opponent: ' + model.get('x') + ', ' + model.get('y'));
            cells[data.opponents[id].x][data.opponents[id].y] = colorCycle[id % colorCycle.length];
            opponents[id] = model;
            opponents[id].bind('change', function() {
                cells[model.previous('x')][model.previous('y')] = null;
                cells[model.get('x')][model.get('y')] = colorCycle[id % colorCycle.length];
            });
        }
        clientId = data.clientId;
        mypos.set({ x: data.x, y: data.y });
    } else if ( data.type == 'move' ) {
        if ( data.clientId == clientId ) {
            return;
        } else {
            opponents[data.clientId].set({
                x: data.x,
                y: data.y
            });
        }
    } else if ( data.type == 'new_client' ) {
//        console.log('new client');
        if ( data.clientId == clientId ) {
//            console.log("is me");
            return;
        }
        var model = new Position({ x: data.x, y: data.y });
        opponents[data.clientId] = model;
        opponents[data.clientId].bind('change', function() {
            cells[model.previous('x')][model.previous('y')] = null;
            cells[model.get('x')][model.get('y')] = colorCycle[data.clientId % colorCycle.length];
        });
        cells[data.x][data.y] = colorCycle[data.clientId % colorCycle.length];
    } else if ( data.type == 'disappear' ) {
        if ( data.clientId == clientId ) {
//            console.log("you lose");
            clientId = null;
        } else {
            var model = opponents[data.clientId];
            if (model) {
                if ( model.get('x') != mypos.get('x')
                     || model.get('y') != mypos.get('y') ) {
                    cells[model.get('x')][model.get('y')] = null;
                }
            }
            delete opponents[data.clientId];
        }
    } else {
        throw 'Unknown message: ' + data.type;
    }
});
socket.connect();

$(function(){
    drawGrid();
    setTimeout(function(){
        update();
    }, interval);
});

var width = xCells * 20 + 1;
var height = yCells * 20 + 1;
var cells = [];
for (var i = 0; i < xCells; i++) {
    for (var j = 0; j < yCells; j++) {
        if ( j == 0 ) {
            cells[i] = [];
        }
        cells[i][j] = null;
    }
}
var opponents = [];
var Position = Backbone.Model.extend();
var mypos = new Position({
    x: 0,
    y: 0
});
mypos.bind('change', function() {
    var x = mypos.get('x');
    var y = mypos.get('y');
    cells[mypos.previous('x')][mypos.previous('y')] = null;
    cells[x][y] = myColor;
    socket.send({
        'type': 'move',
        'x': x,
        'y': y
    });
});
var ctx;

$(document).keydown(function(e) {
    switch (e.keyCode) {
        // left
        case 72: // h
        case 65: // a
        case 37: // left arrow
            move(-1, 0);
            e.preventDefault();
            break;
        // down
        case 74: // j
        case 83: // s
        case 40: // down arrow
            move(0, 1);
            e.preventDefault();
            break;
        // up
        case 75: // k
        case 87: // w
        case 38: // up arrow
            move(0, -1);
            e.preventDefault();
            break;
        // right
        case 76: // l
        case 68: // d
        case 39: // right arrow
            move(1, 0);
            e.preventDefault();
            break;
        default:
            break;
    }
});

function move(xd, yd) {
    if ( clientId == null ) {
        return;
    }
    var newx = mypos.get('x') + xd;
    var newy = mypos.get('y') + yd;
    if (newx < 0) newx = 0;
    if (newx >= xCells) newx = xCells-1;
    if (newy < 0) newy = 0;
    if (newy >= yCells) newy = yCells-1;
    mypos.set({
        x: newx,
        y: newy
    });
}

function update() {
    for (var i = 0; i < xCells; i++) {
        for (var j = 0; j < yCells; j++) {
            if (cells[i][j]) {
                ctx.fillStyle = cells[i][j];
                ctx.fillRect(20*i+1, 20*j+1, 19, 19);
            } else {
                ctx.clearRect(20*i+1, 20*j+1, 19, 19);
            }
        }
    }
    setTimeout(arguments.callee, interval);
}

function drawGrid() {
    var canvas = $('#canvas').get(0);
    if (!canvas.getContext) return;
    ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ccc';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    for (var i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.lineTo(i+1, height);
        ctx.lineTo(i+1, 0);
        ctx.fill();
    }

    for (var j = 0; j < height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.lineTo(width, j+1);
        ctx.lineTo(0, j+1);
        ctx.fill();
    }
}
