const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Socket } = require("dgram");
const { PORT = 3001} = process.env;

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "https://ghostgame.vercel.app/",
        methods: ["GET", "POST"],
    }
})

const players = new Map();

// first event, runs when client connects
// the socket is the client essentially, it comes from the arg
io.on("connection", (socket) => {

    console.log(`Client connected: ${socket.id}`)

    // LISTENS for a socket trying to join a room, then CONNECTS IT to the room
    socket.on("join_room", (data) =>{
        console.log('socket is trying to join a room')

        let clientsInRoom = 0;
        if (io.sockets.adapter.rooms.has(data.room)) clientsInRoom = io.sockets.adapter.rooms.get(data.room).size
        
        players.set(data.room, players.has(data.room) ? players.get(data.room).concat(data.id) : [data.id])

        socket.join(data.room)

        // Not actually using these anymore
        socket.to(data.room).emit("someone_joined", data.id, clientsInRoom+1, players.get(data.room))
        socket.emit("someone_joined", data.id, clientsInRoom+1, players.get(data.room))
    })

    // LISTENS for a socket sending a message, then emits to ALL SOCKETS IN THE ROOM
    socket.on("start_game", (room, startingLetter)=>{
        socket.to(room).emit("receive_start_game", startingLetter)
    })

    // Receive another player's turn
    socket.on("sending_letter", (room, letter)=>{
        socket.to(room).emit("receive_letter", letter)
    })

    // Receive that another player lost
    socket.on("i_lost", (room, name, formEntry)=>{
        console.log('i got the message that someone lost')
        socket.to(room).emit("someone_lost", name, formEntry)
    })

    // Receive a game reset request
    socket.on("resetting", (room, letter)=>{
        socket.to(room).emit("receive_reset", letter)
    })

    // Receiving a notice that a player left
    socket.on("leaving", (room, name, index)=>{
        socket.to(room).emit("someone_left", name, index)
    })

})

// just confirms that server is running
server.listen(PORT, ()=>{
    console.log('server is running')
})