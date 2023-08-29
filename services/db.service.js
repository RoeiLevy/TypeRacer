
const { MongoClient } = require('mongodb');
require('dotenv').config(); 

const DB_URL = process.env.DB_URL
const DB_NAME = 'typeRacer_db';
var dbConn = null;

async function connect() {
    if (dbConn) return dbConn;
    try {
        const client = new MongoClient(DB_URL);
        const c = await client.connect()
        const db = c.db(DB_NAME);
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