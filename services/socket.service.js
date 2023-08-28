const { getRoom, updatePlayer, saveRoomToDbAndDelete } = require('./room.service');

function connectSockets(http) {
    const gIo = require('socket.io')(http, {
        cors: {
            origins: ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:4200', 'http://localhost:4200']
        }
    });

    function emitToAll({ type, data, roomId = null }) {
        if (roomId) gIo.to(roomId).emit(type, data)
        else gIo.emit(type, data)
    }

    gIo.on('connection', socket => {

        socket.on('play', async (player) => {
            const room = await getRoom()
            if (room.players.find(p => p.id === player.id)) {
                gIo.to(room.id).emit('update-room', room)
                return
            }
            socket.join(room.id)
            player.socketId = socket.id
            room.players.push(player)
            gIo.to(room.id).emit('update-room', room)
        })

        socket.on('update-player', async ({ player, roomId }) => {
            const room = updatePlayer(player, roomId)
            gIo.to(roomId).emit('update-room', room)
            if (room.results.length === room.players.length) {
                emitToAll({ type: 'end-game', data: null, roomId })
                await saveRoomToDbAndDelete(roomId, Math.round((Date.now() - room.startTimestamp) / 1000))
            }
        })

        // socket.on('end-game', async ({ roomId, timeElapsed }) => {
        // const room = getRoomById(roomId)
        // room.results.push(player)
        // gIo.to(room.id).emit('update-room', room)
        // })

    })
}


// const emitToAll = ({ type, data, roomId = null }) => {
//     if (roomId) gIo.to(roomId).emit(type, data)
//     else gIo.emit(type, data)
// }

// // TODO: Need to test emitToUser feature
// function emitToUser({ type, data, userId }) {
//     gIo.to(userId).emit(type, data)
// }


// // Send to all sockets BUT not the current socket 
// function broadcast({ type, data, room = null }) {
//     const store = asyncLocalStorage.getStore()
//     const { sessionId } = store
//     if (!sessionId) return logger.debug('Shoudnt happen, no sessionId in asyncLocalStorage store')
//     if (!excludedSocket) return logger.debug('Shouldnt happen, No socket in map')
//     if (room) excludedSocket.broadcast.to(room).emit(type, data)
//     else excludedSocket.broadcast.emit(type, data)
// }


module.exports = {
    connectSockets,
    // broadcast,
}



