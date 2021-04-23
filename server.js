const connectionString = 'mongodb://chat-room-baza-mongodb-accout:sHeS0KcRZ0nEPNAybQqPFtWKFarfz3Iot5oeqx36wBLMkqprrbDPB2EhJit7y8UVLzozQ6l55f3zC6wUi0XcKw==@chat-room-baza-mongodb-accout.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@chat-room-baza-mongodb-accout@'
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const mongo = require('mongodb').MongoClient;
const formatMessage = require('./utils/messages');
const formatMessageDB = require('./utils/messagesDB');
const moment = require('moment');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatroomBot';

// Connect to Mongo
// mongo.connect('mongodb://127.0.0.1/', (err, db) => {
mongo.connect(connectionString, (err, db) => {
  if (err){
    throw err
  }

  // Set DB
  db = db.db('chatroom')
  console.log('DB Connected...')


  // Run when client connects
  io.on('connection', socket => {

    
    // User join
    socket.on('joinRoom', ({ username, room }) => {
      
      // Connect to room
      const collection = db.collection(`${room}`);

      // Check if the room exists         
      collection.find().toArray((err, res) => {
        if(res != null){

          // Get messages from DB
          res.forEach(element => {
            socket.emit('message', formatMessageDB(element.username, element.text, element.time))
          })
        }
      })

      const user = userJoin(socket.id, username, room);
      socket.join(user.room);

      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Witaj w Chatroomie!'));


      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} dołączył/a do czatu`)
        );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    });

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
      const user = getCurrentUser(socket.id);

      // Send message to DB
      const collection = db.collection(`${user.room}`) 
      collection.insertOne({username: user.username, text: msg, time: moment().format('h:mm a')},() => {
        io.to(user.room).emit('message', formatMessage(user.username, msg));
      })

      
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      if (user) {
        io.to(user.room).emit(
          'message',
          formatMessage(botName, `${user.username} opuścił/a czat`)
        );

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }
    });
  });

})
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`));
