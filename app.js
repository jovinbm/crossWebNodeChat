var httpd = require('http').createServer(handler);
var io = require('socket.io').listen(httpd);
var fs = require('fs');

//defining the database
var mongoose = require('mongoose');
var dbURL = ''; //provide your mongodb url here*********************

mongoose.connect(dbURL);

//initiate the schema prototype
var Schema = mongoose.Schema

//defining the message Schema
var messageSchema = new Schema({
    sender: String,
    message: String
});

//defining the message model
var Message = mongoose.model('Message', messageSchema);


//test connection
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Succesfully connected to server");

    var newChat = new Message({
        sender: 'SERVER',
        message: 'RESTARTED SERVER'
    });

    newChat.save(function (err, newChat) {
        if (err) return console.log(err)
        console.log('saved newchat');
    });
});


var port = process.env.PORT || 4000;

httpd.listen(port, function () {
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

        var historyObject = null;
        Message.find({}, function(err, history){
            if (err) return console.log(err);
            var historyLength = history.length;
            console.log(history);

            for (var i = 0; i <= historyLength; i++){
                socket.emit('serverMessage', history[i].message);
            }

            socket.emit('serverMessage', 'RECENT HISTORY');

            //tell the user that they are logged in
            socket.emit('serverMessage', 'Currently logged in as ' + user_name);
        });

        console.log("Told " + user_name + " that they are logged in");

        //tell other users that a new user logged in
        var loggedInStatus = 'User ' + user_name + ' logged in'
        socket.broadcast.emit('serverMessage', loggedInStatus);

        //save the status
        var newChat = new Message({
            sender: user_name,
            message: loggedInStatus
        });

        newChat.save(function (err, newChat) {
            if (err) return console.log(err)
            console.log('saved newchat');
        });


        console.log("Told other users that " + username + " is logged in");
    });

    //when someone sends a message, broadcast it to oneself & all connected clients
    socket.on('clientMessage', function (content) {
        console.log("Received a 'clientMessage' event from " + user_name + ": " + content);

        socket.emit('serverMessage', user_name + ": " + content);
        console.log("Broadcasting to " + user_name + ": " + content);

        socket.broadcast.emit('serverMessage', user_name + ": " + content);
        console.log("Broadcasting to all other users except " + user_name + ": " + content);

        var newChat = new Message({
            sender: user_name,
            message: user_name + ": " + content
        });

        newChat.save(function (err, newChat) {
            if (err) return console.log(err);
            console.log('saved newchat');
        });

    });


    //watch for disconnect event when user closes window on browser
    socket.on('disconnect', function () {
        console.log("Received a 'disconnect' event from " + user_name);

        socket.broadcast.emit('serverMessage', user_name + " logged out");
        console.log("broadcasting a logout message that " + user_name + " logged out");

        var newChat = new Message({
            sender: user_name,
            message: user_name + ": logged out"
        });

        newChat.save(function (err, newChat) {
            if (err) return console.log(err);
            console.log('saved newchat');
        });
    });
});