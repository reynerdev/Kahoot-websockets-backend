const express = require('express');
const app = express();
const http = require('http')
const server = http.createServer(app)

// port 
const port = 3030;

// create our socket server
const { Server } = require("socket.io")

const rooms = {}
const users = []

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

//configuration of our data base in firebase
const db = require('./config-firebase')


io.on("connection", (socket) => {

  console.log("a user connected")
  console.log('rooms', io.sockets.adapter.rooms)

  // when the user create a room for the firstime
  socket.on('create-new-room', (arg, callback) => {
    // create a randon room 

    const gamePin = Math.floor(Math.random() * 90000) + 10000;

    // associate the socket with a room
    socket.join(gamePin)

    // add the room to the array
    // rooms.push({gamePin:gamePin, socketId: socket.id})
    rooms[gamePin] = [{ userName: '', socketId: socket.id, type: 'host' }]

    console.log('socketrooms', socket.rooms)
    // use the callback function to respond the client with room Name
    callback({ 'game-pin': gamePin, 'users': rooms[gamePin] })

  })


  socket.on('checkRoomExistAndJoin', (data, callback) => {

    console.log('checkRoomExistAndJoin', io.sockets.adapter.rooms, data)

    const { gamePin } = data;

    console.log('roomslected', gamePin, io.sockets.adapter.rooms.has(parseInt(gamePin)))

    const isValid = io.sockets.adapter.rooms.has(parseInt(gamePin))

    // if its valid, join the user to the room
    if (isValid) {
      socket.join(parseInt(gamePin))
    }

    console.log("isValid", isValid)

    callback({ isValid })

  })

  socket.on('addUser', (data) => {
    console.log('addUsers', data)

    console.log('rooms', rooms)

    // find index in rooms array of the user which connectes to the socket
    const userFoundIndex = rooms[data.gamePin].findIndex(element => element.socketId === socket.id)

    console.log('userFoundIndex', userFoundIndex)

    // if userFoundIndex is -1 means that a user was already found in the room, this user is the host that created the user, so far we havent added the  userName, in this event that will happen
    if (userFoundIndex !== -1) {

      rooms[data.gamePin][userFoundIndex] = { ...rooms[data.gamePin][userFoundIndex], 'userName': data.user, 'socketId': socket.id }
      console.log('socket addUser', rooms)

    } else {
      // in case it wasnt found we create a user 
      rooms[data.gamePin].push({ 'userName': data.user, 'socketId': socket.id })

      console.log('addUser', rooms)

    }

    console.log('gamePin', parseInt(data.gamePin))
    // emit to all the user of the room the new users
    io.in(parseInt(data.gamePin)).emit('updateUsers', { users: rooms[data.gamePin] })


  })

  // handle when all leave the room, check is its the last user in the room antes de cerrar

})


server.listen(port, () => {
  console.log('server connected on port 3030')
})


