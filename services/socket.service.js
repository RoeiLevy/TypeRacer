const quotes = require('../data/quote.json')
const gRooms = []

function getRandomQuote() {
    const quote = {
        text: "Music is.",
        author: "Karl Lagerfeld",
        tag: "music"
    }
    return Promise.resolve(quote)
    // const randomIndex = Math.floor(Math.random() * quotes.length)
    // return Promise.resolve(quotes[randomIndex])
}

async function addNewRoom() {
    const quote = await getRandomQuote()
    gRooms.push({
        id: Math.random().toString(36).substring(2),
        players: [],
        quote,
        startTimestamp: null,
        results: []
    })
}

async function getRoom() {
    if (!gRooms.length) {
        await addNewRoom()
        return gRooms[gRooms.length - 1]
    }
    else {
        const lastRoom = gRooms[gRooms.length - 1]
        if (lastRoom.players.length === 5 || (lastRoom.startTimestamp && Date.now() > lastRoom.startTimestamp)) {
            await addNewRoom()
            return gRooms[gRooms.length - 1]
        }
        return lastRoom
    }
}
function connectSockets(http) {
    const gIo = require('socket.io')(http, {
        cors: {
            origins: ['http://127.0.0.1:4200', 'http://localhost:4200']
        }
    });
    gIo.on('connection', socket => {
        console.log('Socket connected')

        socket.on('play', async (player) => {
            const room = await getRoom()
            socket.join(room.id)
            player.socketId = socket.id
            room.players.push(player)
            if (room.players.length === 2) room.startTimestamp = Date.now() + 5000
            gIo.to(room.id).emit('add-player', room)
        })

        socket.on('update-progress', ({ player, roomId }) => {
            const room = gRooms.find(room => room.id === roomId)
            const playerIndex = room.players.findIndex(p => p.id === player.id)
            room.players.splice(playerIndex, 1, player)
            gIo.to(roomId).emit('update-progress', room)
        })

        socket.on('end-game', ({ player, roomId }) => {
            const room = gRooms.find(room => room.id === roomId)
            room.results.push(player)
            gIo.to(roomId).emit('show-winners', room)
        })

        socket.on('leave', () => {
            console.log('Someone leaved')
            _removePlayer(socket)
        })

        socket.on('disconnect', () => {
            console.log('Someone disconnected')
            _removePlayer(socket)
        })

        function _removePlayer(socket) {
            const room = gRooms.find(room => room.players.find(player => player.socketId === socket.id))
            if (room) {
                const playerIndex = room.players.findIndex(player => player.socketId === socket.id)
                if (playerIndex !== -1) {
                    room.players.splice(playerIndex, 1)
                    gIo.to(room.id).emit('remove-player', room)
                }
            }
        }
    })
}

function emitToAll({ type, data, room = null }) {
    if (room) gIo.to(room).emit(type, data)
    else gIo.emit(type, data)
}

// TODO: Need to test emitToUser feature
function emitToUser({ type, data, userId }) {
    gIo.to(userId).emit(type, data)
}


// Send to all sockets BUT not the current socket 
function broadcast({ type, data, room = null }) {
    const store = asyncLocalStorage.getStore()
    const { sessionId } = store
    if (!sessionId) return logger.debug('Shoudnt happen, no sessionId in asyncLocalStorage store')
    if (!excludedSocket) return logger.debug('Shouldnt happen, No socket in map')
    if (room) excludedSocket.broadcast.to(room).emit(type, data)
    else excludedSocket.broadcast.emit(type, data)
}


module.exports = {
    connectSockets,
    emitToAll,
    broadcast,
}



