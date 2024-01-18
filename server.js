const express = require('express');
const cors = require('cors');
const { connectSockets } = require('./services/socket.service');

const app = express();
const http = require('http').createServer(app)
const port = process.env.PORT || 8080;
connectSockets(http);

const corsOptions = {
    origins: ['http://127.0.0.1:3000', 'http://localhost:3000', 'https://type-racer-game.netlify.app'],
    credentials: true
}
app.use(cors(corsOptions))

const api = require('./api/api.js')
app.use('/api/', api)
app.get('/keep-warm', (req, res) => {
    console.log("server warmed at:" + new Date().toLocaleString());
    return res.status(200).end()
})

http.listen(port, () => {
    console.log('listening on http://localhost:8080');
});