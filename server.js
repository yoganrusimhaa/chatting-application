var express = require('express');
var app = express();
var server = require('http').Server(app);
var client = require('socket.io')(server).sockets;
var path = require('path');
var ip = require('ip');
//const { Db } = require('mongodb');
//const { dirname } = require('path');
var mongo = require('mongodb').MongoClient;
var port= process.env.PORT || '8080' ;

//connect to mongo
mongo.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatdb' ,function(err,db){
    
    if(err){
        throw err;
    }

    console.log('MongoDB Connected.');
    //var db =client.db('chatdb')


    //connect to socket.io
    client.on('connection',function(socket){
        console.log('A new user is connected.')
        let chat = db.collection('chats');

        //create function to send status
        SendStatus = function(s){
            socket.emit('status', s)
        }

        //get chats from mongo collection
        chat.find().limit(100).sort({_id: 1}).toArray(function(err,res){
            if(err){
                throw(err);
            }

            //emit the messages
            socket.emit('output',res);
           
        })

        //handle input event
        socket.on('input',function(data){
            let name = data.name;
            let message = data.message;
            //check for name and message
            if(name==''|| message ==''){
                //send Error status
                SendStatus('Please enter a name and message.')
            }else{
                //insert messages
                chat.insert({name: name, message: message}, function(){
                    client.emit('output',[data]);
                    //send status objects
                    SendStatus({
                        message: "Message sent",
                        clear: true
                    })
                })
            }
        })

        //Handle clear
        socket.on('clear', function(data){
            //remove all chats from collection
            chat.remove({},function(){
                socket.emit('cleared');
            })
        })
        
        socket.on('disconnect',function(){
            console.log('A user is disconnected.')
        })
    })
})

app.get('/', function(req,res){
    res.sendfile('index.html');
})

server.listen(port,function(){
    console.log('The server is listening at http://' + ip.address()+":"+ port);
})