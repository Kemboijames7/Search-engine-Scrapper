const express = require('express');
const path = require('path');
const google = require('./googleSearch');
const axios = require('axios');
const { enqueue, getResult } = require('./queue');

const PORT = 5000;
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middlewares ──────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Home ─────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.render('index', {
        knowledgePanel: null,
        wikiSummary: null,
        image: null,
        jobId: null,
        polling: false
    });
});

// ── Search — enqueue job, show spinner ───────────────────
app.post('/search', async (req, res) => {
    const topic = req.body.topic;
    const language = req.body.language;

    try {
        // 1. Enqueue the search job for the worker to process
        const jobId = await enqueue({ topic, language });
        console.log(`Job enqueued: ${jobId} | Topic: ${topic} | Lang: ${language}`);

        // 2. Immediately render with spinner — don't wait for results
        res.render('index', {
            jobId,
            polling: true,
            knowledgePanel: null,
            wikiSummary: null,
            image: null
        });

    } catch (err) {
        console.error('Enqueue failed:', err.message);
        res.status(500).send('Search failed, please try again.');
    }
});

// ── Poll — frontend checks this every second ─────────────
app.get('/result/:jobId', async (req, res) => {
    try {
        const result = await getResult(req.params.jobId);

        if (!result) {
            return res.json({ status: 'processing' });
        }

        res.json({ status: 'done', ...result });

    } catch (err) {
        console.error('Result fetch failed:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ── Done — render final results page ─────────────────────
app.get('/done/:jobId', async (req, res) => {
    try {
        const result = await getResult(req.params.jobId);

        if (!result) {
            console.warn('No result found for jobId:', req.params.jobId);
            return res.redirect('/');
        }

        console.log('Rendering result for jobId:', req.params.jobId);

        res.render('index', {
            jobId: null,
            polling: false,
            knowledgePanel: result.knowledgePanel,
            wikiSummary: result.wikiSummary,
            image: result.image || null
        });

    } catch (err) {
        console.error('Done route failed:', err.message);
        res.redirect('/');
    }
});

// ── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`App listening at port ${PORT}`);
});