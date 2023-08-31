const gRooms = []
const quotes = require('../data/quote.json');
const dbService = require('./db.service');

function _getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return Promise.resolve(quotes[randomIndex])
}

async function _addNewRoom() {
    let quote
    if (process.env.NODE_ENV === 'production') {
        quote = await _getRandomQuote()
    } else {
        quote = {
            "text": "Music.",
            "author": "Karl Lagerfeld",
            "tag": "music"
        }
    }
    const room = {
        id: Math.random().toString(36).substring(2),
        players: [],
        quote,
        startTimestamp: Date.now() + 10000,
        results: []
    }
    gRooms.push(room)
}

function _getRoomById(roomId) {
    return gRooms.find(room => room.id === roomId)
}

function removePlayer(player, roomId) {
    const room = _getRoomById(roomId)
    if (room) {
        const playerIndex = room.players.findIndex(p => p.id === player.id)
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1)
            return { room, isPlayerRemoved: true }
        }
    }
    return { room, isPlayerRemoved: false }
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
    if (!room) return
    room.timeElapsed = timeElapsed
    const rooms_logs = await dbService.getCollection('rooms_logs')
    await rooms_logs.insertOne(room);
    const scores = await dbService.getCollection('scores')
    room.players.forEach(async (p) => {
        if (!p.username.startsWith('Guest') && !p.isBot) {
            await scores.insertOne(p);
        }
    })
    _removeRoomById(roomId)
    return room;
}

function getPlayerRoom(player) {
    for (let i = 0; i < gRooms.length; i++) {
        const currRoom = gRooms[i];
        for (let i = 0; i < currRoom.players.length; i++) {
            const currPlayer = currRoom.players[i];
            if (currPlayer.id === player.id) return currRoom
        }
    }
    return false
}


module.exports = {
    getRoom,
    updatePlayer,
    saveRoomToDbAndDelete,
    getPlayerRoom,
    removePlayer
}