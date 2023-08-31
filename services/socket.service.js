const { addBots } = require('./bots.service');
const { getRoom, updatePlayer, saveRoomToDbAndDelete, getPlayerRoom, removePlayer } = require('./room.service');

function connectSockets(http) {
    const gIo = require('socket.io')(http, {
        cors: {
            origins: ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:4200', 'http://localhost:4200']
        }
    });

    gIo.on('connection', socket => {

        socket.on('ping', () => {
            console.log('activate server');
        })

        socket.on('play', async (player) => {
                if (getPlayerRoom(player)) {
                    const room = getPlayerRoom(player)
                    gIo.to(room.id).emit('update-room', room)
                }
                else {
                    const room = await getRoom()
                    addBots(gIo, room)
                    socket.join(room.id)
                    player.socketId = socket.id
                    room.players.push(player)
                    gIo.to(room.id).emit('update-room', room)
                }
        })

        socket.on('update-player', async ({ player, roomId }) => {
            const room = updatePlayer(player, roomId)
            gIo.to(roomId).emit('update-room', room)
            if (room.results.length === room.players.length) {
                gIo.to(roomId).emit('end-game', null)
                await saveRoomToDbAndDelete(roomId, Math.round((Date.now() - room.startTimestamp) / 1000))
            }
        })

        socket.on('leave', async ({ player, roomId }) => {
            const { room, isPlayerRemoved } = removePlayer(player, roomId)
            socket.leave(roomId)
            if (isPlayerRemoved) {
                gIo.to(roomId).emit('update-room', room)
            }
        })

        // socket.on('end-game', async ({ roomId, timeElapsed }) => {
        // const room = getRoomById(roomId)
        // room.results.push(player)
        // gIo.to(room.id).emit('update-room', room)
        // })

    })
}


module.exports = {
    connectSockets,
}



