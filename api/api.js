const express = require('express');
const { getScoresByUserId } = require('../services/scores.service');
const router = express.Router()

router.get('/', (req, res) => {
    res.send('Health check!');
});

router.get('/scores', async (req, res) => {
    const scores = await getScoresByUserId(req.query.userId)
    res.json(scores)
})

module.exports = router