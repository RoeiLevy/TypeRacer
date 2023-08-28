
const { MongoClient } = require('mongodb');

const config = require('../config')
const dbName = 'typeRacer_db';
var dbConn = null;

async function connect() {
    if (dbConn) return dbConn;
    try {
        const client = new MongoClient(config.dbURL);
		console.log("TCL: connect -> config.dbURL", config.dbURL)
        const c = await client.connect()
        const db = c.db(dbName);
        dbConn = db;
        return db;
    } catch (err) {
        console.log('Cannot Connect to DB', err)
        throw err;
    }
}

async function getCollection(collectionName) {
    const db = await connect()
    return db.collection(collectionName);
}

connect()

module.exports = {
    getCollection
}