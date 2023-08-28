const { getCollection } = require("./db.service")

async function getScoresByUserId(userId) {
    const rooms_collection = await getCollection('rooms_logs')
    const rooms = await rooms_collection.aggregate([
        {
            $unwind: "$players"
        },
        {
            $match: {
                "players.id": userId
            }
        }
    ]).toArray();
    rooms.forEach(room=>{
        delete room._id
    })
    return rooms
}

module.exports = {
    getScoresByUserId
}