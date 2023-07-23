const express = require('express');
const app = express();
const cors = require('cors');

// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static('public'))
// } else {
const corsOptions = {
    origins: ['http://127.0.0.1:4200', 'http://localhost:4200'],
    credentials: true
}
app.use(cors(corsOptions))
// }

const http = require('http').createServer(app)


app.get('/', (req, res) => {
    res.send('Hello World!');
});

const { connectSockets } = require('./services/socket.service');
connectSockets(http);

const port = process.env.PORT || 3000;

http.listen(port, () => {
    console.log('listening on http://localhost:3000');
});
