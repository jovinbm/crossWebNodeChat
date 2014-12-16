var httpd = require('http').createServer(handler);
var io = require('socket.io').listen(httpd);
var fs = require('fs');

var port = process.env.PORT || 4000;

httpd.listen(port, function(){
    console.log("Server listening at port " + port);
});

//function to route the request to the index.html
function handler(req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {                 //handle the error
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
    var user_name;


    //listen for a log in event
    socket.on('login', function (username) {
        //use the users provided name
        if (username) {
            socket.username = username; 
        } else {
            //if no username provided, use socket.id
            socket.username = socket.id 
        }

        user_name = socket.username;

        //tell the user that they are logged in
        socket.emit('serverMessage', 'Currently logged in as ' + user_name); 

        //tell other users that a new user logged in
        socket.broadcast.emit('serverMessage', 'User ' + user_name +
        ' logged in');
    });

    //when someone sends a message, broadcast it to oneself & all connected clients
    socket.on('clientMessage', function (content) {
        socket.emit('serverMessage', user_name + ": " + content);

        socket.broadcast.emit('serverMessage', user_name + ": " + content);
    });
});