const axios = require('axios');

const ddgLangMap = {
    'en': 'en-us',
    'fr': 'fr-fr',
    'de': 'de-de',
    'es': 'es-es',
    'zh': 'zh-cn',
    'sq': 'sq-al',
    'af': 'af-za',
    'am': 'en-us',
    'sw': 'en-us'
};

const search = async (topic, options = {}) => {
    const lang = options.additional_params?.hl || 'en';
    
    let knowledge_panel = {
        title: '',
        description: '',
        metadata: []
    };

    
// DuckDuckGo first ──────────────────────────────


const ddgLang = ddgLangMap[lang] || 'en-us'; 
    try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_html=1`;
        const { data } = await axios.get(ddgUrl);

    if (data.Heading) {
            knowledge_panel.title = data.Heading || '';
            knowledge_panel.description =
                data.AbstractText ||
                data.Answer ||
                data.Definition ||
                data.RelatedTopics?.[0]?.Text || '';

  // DDG does return an image sometimes
            knowledge_panel.image = data.Image
                ? `https://duckduckgo.com${data.Image}`
                : '';

            knowledge_panel.metadata = (data.Infobox?.content || [])
                .filter(item => item.label && item.value)
                .map(item => ({
                    title: item.label,
   // flatten nested objects/arrays to a readable string
                    value: typeof item.value === 'object'
                        ? JSON.stringify(item.value)
                        : String(item.value)
                }));
        }
    } catch (e) {
        console.warn('DuckDuckGo failed:', e.message);
    }

    //  If DDG gave no description, try Wikipedia REST API ─
    if (!knowledge_panel.description) {
        try {
            const wikiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
            const { data } = await axios.get(wikiUrl);

            if (data.extract) {
                knowledge_panel.title = knowledge_panel.title || data.title;
                knowledge_panel.description = data.extract;
                // pull thumbnail as extra metadata if available
                if (data.thumbnail?.source) {
                    knowledge_panel.image = data.thumbnail.source;
                }
            }
        } catch (e) {
            console.warn('Wikipedia REST failed:', e.message);
        }
    }

    //   If still no title/description, try Open Library (for books) 
    //      or just flag it as not found  
    if (!knowledge_panel.title && !knowledge_panel.description) {
        try {
            const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(topic)}&limit=1`;
            const { data } = await axios.get(olUrl);
            const book = data.docs?.[0];

            if (book) {
                knowledge_panel.title = book.title || '';
                knowledge_panel.description = `Book by ${book.author_name?.join(', ') || 'Unknown'}. First published ${book.first_publish_year || 'N/A'}.`;
                knowledge_panel.metadata = [
                    { title: 'Author', value: book.author_name?.join(', ') || 'N/A' },
                    { title: 'First Published', value: book.first_publish_year || 'N/A' },
                    { title: 'Publisher', value: book.publisher?.[0] || 'N/A' }
                ];
            }
        } catch (e) {
            console.warn('Open Library failed:', e.message);
        }
    }

    console.log(knowledge_panel);
    return { knowledge_panel };
};

module.exports = { search };