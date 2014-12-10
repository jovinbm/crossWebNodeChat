var httpd = require('http').createServer(handler);
var io = require('socket.io').listen(httpd);
var fs = require('fs');
var port = 4000; //this should be any specific port you want to use
httpd.listen(4000);

//function to route the request to the index.html
function handler(req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        }
    );
}


//listen to the coonection event
io.sockets.on('connection', function (socket) {
    //emit login event to client.js to prompt for username
    socket.emit('login');
    //variable to save users username
    var userjina;


    socket.on('login', function (username) {
        if (username) {
            socket.username = username;
        } else {
            socket.username = socket.id
        }
        userjina = socket.username;
        socket.emit('serverMessage', 'Currently logged in as ' + userjina);
        socket.broadcast.emit('serverMessage', 'User ' + userjina +
        ' logged in');
    });

//when someone sends a message, broadcast it to all connected clients
    socket.on('clientMessage', function (content) {
        socket.emit('serverMessage', content);

        socket.broadcast.emit('serverMessage', content);
    });
});