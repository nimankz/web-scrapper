const express = require('express');
const {fetchPostComments,fetchProfileConnections,HttpError} = require('./services/instagramService');

const router = express.Router();

router.post('/post-comments', async (req, res, next) => {
    try {

        const { postUrl, sessionPath } = req.body;

        if (!postUrl) {return res.status(400).json({ error: 'postUrl is required' });}

        const comments = await fetchPostComments(postUrl, sessionPath);

        res.json({ postUrl, comments });

    } catch (error) {
        if (error instanceof HttpError) {return res.status(error.status).json({ error: error.message });}
        next(error);
    }
});

router.post('/profile-connections', async (req, res, next) => {
    try {
        const { profileUrl, sessionPath } = req.body;
        if (!profileUrl) {return res.status(400).json({ error: 'profileUrl is required' });}

        const connections = await fetchProfileConnections(profileUrl, sessionPath);

        res.json({ profileUrl, ...connections });
        
    } catch (error) {
        if (error instanceof HttpError) {return res.status(error.status).json({ error: error.message });}
        next(error);
    }
});

module.exports = router;
