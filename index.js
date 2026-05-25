const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const NEWSAPI_KEY = '341a225897694b7391db6a31ab178f85';
const NEWSAPI_URL = 'https://newsapi.org/v2';

// Cache för att minska API-anrop
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 minuter

// Svenska nyhetskällor för NewsAPI
const swedishSources = [
  'svt',
  'expressen',
  'aftonbladet',
  'dagens-nyheter'
];

// Kategorier
const categories = [
  'business',
  'entertainment',
  'general',
  'health',
  'science',
  'sports',
  'technology'
];

// Huvudsida
app.get('/', (req, res) => {
  res.send(`
    <h1>Svenska Nyheter Server (NewsAPI)</h1>
    <p>Servern körs!</p>
    <p>API endpoints:</p>
    <ul>
      <li><a href="/api/categories">/api/categories</a> - Lista kategorier</li>
      <li><a href="/api/news?category=general">/api/news?category=general</a> - Nyheter efter kategori</li>
      <li><a href="/api/search?q=politik">/api/search?q=politik</a> - Sök nyheter</li>
    </ul>
  `);
});

// Få alla kategorier
app.get('/api/categories', (req, res) => {
  res.json({
    categories: [
      { id: 'general', name: 'Allmänt' },
      { id: 'business', name: 'Affärer' },
      { id: 'entertainment', name: 'Underhållning' },
      { id: 'health', name: 'Hälsa' },
      { id: 'science', name: 'Vetenskap' },
      { id: 'sports', name: 'Sport' },
      { id: 'technology', name: 'Teknik' }
    ]
  });
});

// Hämta nyheter efter kategori
app.get('/api/news', async (req, res) => {
  try {
    const { category = 'general', page = 1 } = req.query;
    
    const cacheKey = `news-${category}-${page}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
      return res.json(cached.data);
    }

    const url = `${NEWSAPI_URL}/top-headlines?country=se&category=${category}&page=${page}&apiKey=${NEWSAPI_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    const articles = (data.articles || []).map(article => ({
      title: article.title,
      description: article.description || '',
      link: article.url,
      pubDate: new Date(article.publishedAt),
      source: article.source.name,
      image: article.urlToImage,
      author: article.author
    }));

    const result = {
      success: true,
      count: articles.length,
      totalResults: data.totalResults,
      articles: articles
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);

  } catch (error) {
    console.error('API-fel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Sök nyheter
app.get('/api/search', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sökterm krävs (q parameter)' 
      });
    }

    const cacheKey = `search-${q}-${page}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
      return res.json(cached.data);
    }

    const url = `${NEWSAPI_URL}/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&language=sv&page=${page}&apiKey=${NEWSAPI_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    const articles = (data.articles || []).map(article => ({
      title: article.title,
      description: article.description || '',
      link: article.url,
      pubDate: new Date(article.publishedAt),
      source: article.source.name,
      image: article.urlToImage,
      author: article.author
    }));

    const result = {
      success: true,
      count: articles.length,
      totalResults: data.totalResults,
      articles: articles
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);

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
