const express = require('express');
const cors = require('cors');
const { connectSockets } = require('./services/socket.service');
const { getScoresByUserId } = require('./services/scores.service');

const path = require('path');
const app = express();
const http = require('http').createServer(app)
const port = process.env.PORT || 8080;
connectSockets(http);

const corsOptions = {
    origins: ['http://127.0.0.1:4200', 'http://localhost:4200'],
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.send('Health check!');
});

app.get('/scores', async (req, res) => {
    const scores = await getScoresByUserId(req.query.userId)
    res.json(scores)
})

http.listen(port, () => {
    console.log('listening on http://localhost:8080');
});