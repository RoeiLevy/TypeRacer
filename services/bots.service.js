const { saveRoomToDbAndDelete } = require("./room.service");

function _formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

function _setBotWin(room, bot) {
    const wpm = ((60 / (Math.round(Date.now() - room.startTimestamp) / 1000)) * room.quote.text.split(' ').length)
    bot.wpm = wpm.toFixed(0)
    bot.timeToFinish = _formatTime(Date.now() - room.startTimestamp)
    bot.progress = 100
    return bot
}

async function _getBot() {
    const res = await fetch('https://randomuser.me/api/')
    const { results } = await res.json();
    return {
        id: Math.random().toString(36).substring(2),
        username: results[0].name.first + ' ' + results[0].name.last,
        progress: 0,
        isBot: true
    }
}

function _startProgressInterval(gIo, room) {
    const progressIntervalId = setInterval(() => {
        room.players.forEach(player => {
            if (player.isBot && player.progress < 100) {
                const randomIncrementProgress = Math.floor(Math.random() * (Math.floor(Math.random() * 10) + 1));
                if (player.progress + randomIncrementProgress >= 100) {
                    const bot = _setBotWin(room, player)
                    room.results.push(bot)
                } else player.progress += randomIncrementProgress
                gIo.to(room.id).emit('update-room', room)
            }
        })
        const isGameDone = room.players.every(p => p.progress === 100)
        if (isGameDone) {
            gIo.to(room.id).emit('end-game', null)
            saveRoomToDbAndDelete(room.id, Math.round((Date.now() - room.startTimestamp) / 1000))
            clearInterval(progressIntervalId)
        }
    }, 500)
}

function addBots(gIo, room) {
    const addBotIntervalId = setInterval(async () => {
        const bot = await _getBot()
        room.players.push(bot)
        gIo.to(room.id).emit('update-room', room)
        if (room.players.length === 5) clearInterval(addBotIntervalId)
    }, 2000)
    setTimeout(() => {
        _startProgressInterval(gIo, room)
    }, room.startTimestamp - Date.now())
}

module.exports = {
    addBots
}