const { dequeue, storeResult } = require('./queue');
const google = require('./googleSearch');
const axios = require('axios');

console.log('Worker started, waiting for jobs...');

async function processJob(job) {
    const { topic, language, id } = job;

    const options = {
        additional_params: { hl: language }
    };

    // Run your existing search logic
    const { knowledge_panel } = await google.search(topic, options);

    let wikiSummary = null;
    try {
        const wikiLangs = ['en', 'fr', 'de', 'es', 'sw', 'zh', 'sq', 'am', 'af'];
        const wikiLang = wikiLangs.includes(language) ? language : 'en';
        const wikiUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
        const { data } = await axios.get(wikiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MySearchApp/1.0; educational project)'
            }
        });
        if (data.extract) {
            wikiSummary = {
                title: data.title,
                extract: data.extract,
                url: data.content_urls?.desktop?.page
            };
        }
    } catch (e) {
        console.warn('Wikipedia failed for:', topic);
    }

    // Store the completed result in Redis
    await storeResult(id, {
        knowledgePanel: knowledge_panel,
        wikiSummary,
        image: knowledge_panel.image || null
    });

    console.log('Job complete:', id);
}

// Poll queue every second
async function startWorker() {
    setInterval(async () => {
        try {
            const job = await dequeue();
            if (job) {
                console.log('Processing job:', job.id, '| Topic:', job.topic);
                await processJob(job);
            }
        } catch (err) {
            console.error('Worker error:', err.message);
        }
    }, 1000);
}

startWorker();