const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const parser = new Parser();

// Svenska nyhetskällor
const newsFeeds = {
  'SVT Nyheter': 'https://www.svt.se/nyheter/rss.xml',
  'DN': 'https://www.dn.se/rss/',
  'TT': 'https://www.tt.se/rss',
  'Aftonbladet': 'https://www.aftonbladet.se/rss',
  'Expressen': 'https://www.expressen.se/rss',
  'SR Nyheter': 'https://www.sr.se/rss/all/'
};

// Cache för att minska API-anrop
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 minuter

// Huvudsida - visar att servern körs
app.get('/', (req, res) => {
  res.send(`
    <h1>Svenska Nyheter Server</h1>
    <p>Servern körs!</p>
    <p>Prova: <a href="/api/feeds/sources">/api/feeds/sources</a></p>
  `);
});

app.get('/api/feeds/sources', (req, res) => {
  res.json({
    sources: Object.keys(newsFeeds)
  });
});

app.get('/api/feeds', async (req, res) => {
  try {
    const { sources, search } = req.query;
    const selectedSources = sources ? sources.split(',') : Object.keys(newsFeeds);
    
    let allArticles = [];
    
    for (const source of selectedSources) {
      if (!newsFeeds[source]) continue;
      
      try {
        // Kontrollera cache
        const cacheKey = `feed-${source}`;
        const cached = cache.get(cacheKey);
        
        let feed;
        if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
          feed = cached.data;
        } else {
          feed = await parser.parseURL(newsFeeds[source]);
          cache.set(cacheKey, { data: feed, timestamp: Date.now() });
        }
        
        // Extrahera artiklar och filtrera på sökord
        const articles = feed.items.map(item => ({
          title: item.title,
          description: item.contentSnippet || item.summary || '',
          link: item.link,
          pubDate: new Date(item.pubDate),
          source: source,
          image: item.image?.url || null
        }));
        
        // Filtrera på sökord (Politik) om det anges
        const filtered = articles.filter(article => {
          if (!search) return true;
          const searchLower = search.toLowerCase();
          return article.title.toLowerCase().includes(searchLower) || 
                 article.description.toLowerCase().includes(searchLower);
        });
        
        allArticles = allArticles.concat(filtered);
      } catch (err) {
        console.error(`Fel vid hämtning från ${source}:`, err.message);
      }
    }
    
    // Sortera efter datum (nyaste först)
    allArticles.sort((a, b) => b.pubDate - a.pubDate);
    
    // Begränsa till 100 senaste artiklar
    const result = allArticles.slice(0, 100);
    
    res.json({
      success: true,
      count: result.length,
      articles: result
    });
  } catch (error) {
    console.error('API-fel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server körs på port ${PORT}`);
});
