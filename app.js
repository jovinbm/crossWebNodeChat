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


//listen to the connection event
io.sockets.on('connection', function (socket) {
    console.log("Received a new 'connection' event");

    //emit login event to client.js to prompt for username
    socket.emit('login');
    console.log("Emitted 'login' event to the new connection");

    //variable to save users username
    var user_name;


    //listen for a log in event
    socket.on('login', function (username) {
        console.log("Got a 'login' event from the new connection");

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
        console.log("Told " + user_name + " that they are logged in");

        //tell other users that a new user logged in
        socket.broadcast.emit('serverMessage', 'User ' + user_name +
        ' logged in');
        console.log("Told other users that " + username + " is logged in");
    });

    //when someone sends a message, broadcast it to oneself & all connected clients
    socket.on('clientMessage', function (content) {
        console.log("Received a 'clientMessage' event from " + user_name + ": " + content);

        socket.emit('serverMessage', user_name + ": " + content);
        console.log("Broadcasting to " + user_name + ": " + content)

        socket.broadcast.emit('serverMessage', user_name + ": " + content);
        console.log("Broadcasting to all other users except " + user_name + ": " + content);
    });


    //watch for disconnect event when user closes window on browser
    socket.on('disconnect', function(){
        console.log("Received a 'disconnect' event from " + user_name);

        socket.broadcast.emit('serverMessage', user_name + " logged out");
        console.log("broadcasting a logout message that " + user_name + " logged out");
    });
});