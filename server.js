const express = require('express');
const cors = require('cors');
const { connectSockets } = require('./services/socket.service');

const path = require('path');
const app = express();
const http = require('http').createServer(app)
const port = process.env.PORT || 8080;
connectSockets(http);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
} else {
    const corsOptions = {
        origin: ['http://127.0.0.1:3000', 'http://localhost:3000', 'https://type-racer-sandy.vercel.app/'],
        credentials: true
    }
    app.use(cors(corsOptions))
}

const api = require('./api/api.js')
app.use('/api/', api)

app.get('/**', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

http.listen(port, () => {
    console.log('listening on http://localhost:8080');
});