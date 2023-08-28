const gRooms = []
const quotes = require('../data/quote.json');
const dbService = require('./db.service');

function _getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return Promise.resolve(quotes[randomIndex])
}

async function _addNewRoom() {
    // const quote = await _getRandomQuote()
    const quote = {
        "text": "Music.",
        "author": "Karl Lagerfeld",
        "tag": "music"
    }
    const room = {
        id: Math.random().toString(36).substring(2),
        players: [],
        quote,
        startTimestamp: Date.now() + 5000,
        results: []
    }
    gRooms.push(room)
}

function _getRoomById(roomId) {
    return gRooms.find(room => room.id === roomId)
}

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

function _removeRoomById(roomId) {
    const roomIdx = gRooms.findIndex(room => room.id === roomId)
    gRooms.splice(roomIdx, 1)
}

async function getRoom() {
    if (!gRooms.length) {
        await _addNewRoom()
        return gRooms[gRooms.length - 1]
    }
    else {
        const lastRoom = gRooms[gRooms.length - 1]
        if (lastRoom.players.length === 5 || (lastRoom.startTimestamp - Date.now() <= 0)) {
            await _addNewRoom()
            return gRooms[gRooms.length - 1]
        }
        return lastRoom
    }
}


function updatePlayer(player, roomId) {
    const room = _getRoomById(roomId)
    if (!room) return
    const playerIndex = room.players.findIndex(p => p.id === player.id)
    room.players.splice(playerIndex, 1, player)
    if (player.progress === 100) {
        room.results.push(player)
    }
    return room
}

async function saveRoomToDbAndDelete(roomId, timeElapsed) {
    const room = _getRoomById(roomId)
    room.timeElapsed = timeElapsed
    const rooms_logs = await dbService.getCollection('rooms_logs')
    await rooms_logs.insertOne(room);
    const scores = await dbService.getCollection('scores')
    room.players.forEach(async (p) => {
        if (!p.username.startsWith('Guest')) {
            await scores.insertOne(p);
        }
    })
    _removeRoomById(roomId)
    return room;
}

// function addBots(gIo, room) {
//     const addBotIntervalId = setInterval(async () => {
//         if (room.players.length === 5) {
//             clearInterval(addBotIntervalId)
//             return
//         }
//         const res = await fetch('https://randomuser.me/api/')
//         const { results } = await res.json();
//         const bot = {
//             id: Math.random().toString(36).substring(2),
//             username: results[0].name.first + ' ' + results[0].name.last,
//             progress: 0,
//             isBot: true
//         }
//         room.players.push(bot)
//         // if (room.players.length === 2) room.startTimestamp = Date.now() + 6000
//         gIo.to(room.id).emit('add-player', room)
//     }, 1000)
// }

module.exports = {
    getRoom,
    updatePlayer,
    saveRoomToDbAndDelete
}