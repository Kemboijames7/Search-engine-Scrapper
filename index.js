const express = require('express')
const path = require('path')
const google = require('./googleSearch');
const wiki = require('wikipedia');
const app = express();
const axios = require('axios')
    PORT = 5000

app.set('view engine', 'ejs')
app.set("views", path.join(__dirname, 'views'))



//middlewares

app.use(express.urlencoded({extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
   res.render('index', { knowledgePanel: undefined, wikiSummary: undefined });
})

app.post('/search', async (req, res) => {
    const topic = req.body.topic;
    const language = req.body.language;

    const options = {
        page: 0,
        safe: false,
        parse_ads: false,
        additional_params: {
            hl: language
        }
    };

    let knowledgePanel;
    let wikiSummary;

    try {
        const response = await google.search(topic, options);
        knowledgePanel = response.knowledge_panel;
       
    } catch (err) {
        console.error(err);
        return res.status(500).send("Search failed");
    }

  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const { data } = await axios.get(wikiUrl);
    
    if (data.extract) {
        wikiSummary = {
            title: data.title,
            extract: data.extract,
            url: data.content_urls?.desktop?.page
        };
    }
} catch (e) {
    console.warn('Wikipedia not found for topic:', topic);
}

    res.render('index', { knowledgePanel, wikiSummary, image: knowledgePanel.image || null });
});




app.listen(PORT, () => {
    console.log(`App listeneing at port ${PORT}`);
    
})