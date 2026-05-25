import React, { useState, useEffect } from 'react';

export default function NewsApp() {
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('Politik');
  const [showSettings, setShowSettings] = useState(false);

  const API_URL = 'https://svenska-nyheter.onrender.com';

  // Hämta tillgängliga nyhetskällor
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch(`${API_URL}/api/feeds/sources`);
        if (response.ok) {
          const data = await response.json();
          setSources(data.sources);
          setSelectedSources(data.sources);
          setError(null);
        }
      } catch (err) {
        console.error('Fel vid hämtning av källor:', err);
        setError('Kunde inte ansluta till servern');
      }
    };

    fetchSources();
  }, []);

  // Hämta nyheter
  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const sourcesParam = selectedSources.join(',');
      const response = await fetch(
        `${API_URL}/api/feeds?sources=${sourcesParam}&search=${encodeURIComponent(search)}`
      );

      if (!response.ok) {
        throw new Error(`Server svarade med status ${response.status}`);
      }

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(`Fel: ${err.message}`);
      console.error('API-fel:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hämta nyheter automatiskt när inställningar ändras
  useEffect(() => {
    if (selectedSources.length > 0 && !showSettings) {
      const timer = setTimeout(fetchNews, 500);
      return () => clearTimeout(timer);
    }
  }, [search, selectedSources, showSettings]);

  const handleSourceToggle = (source) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Igår';
    } else {
      return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Svenska Nyheter</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={styles.settingsBtn}
        >
          ⚙️
        </button>
      </div>

      {/* Inställningar */}
      {showSettings && (
        <div style={styles.settingsPanel}>
          <h2 style={styles.sectionTitle}>Nyhetskällor</h2>
          <div style={styles.sourcesList}>
            {sources.map(source => (
              <label key={source} style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source)}
                  onChange={() => handleSourceToggle(source)}
                />
                <span>{source}</span>
              </label>
            ))}
          </div>

          <h2 style={styles.sectionTitle}>Sökfilter</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök efter t.ex. Politik, Sport..."
            style={styles.input}
          />

          <button 
            onClick={() => setShowSettings(false)}
            style={styles.closeBtn}
          >
            Stäng
          </button>
        </div>
      )}

      {/* Fel-meddelande */}
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* Laddar */}
      {loading && (
        <div style={styles.loading}>
          Hämtar nyheter...
        </div>
      )}

      {/* Nyhetsflöde */}
      {!showSettings && (
        <div style={styles.articlesList}>
          {articles.length === 0 && !loading && (
            <p style={styles.noArticles}>
              Inga nyheter funna. Prova ett annat sökord.
            </p>
          )}

          {articles.map((article, index) => (
            <a
              key={index}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.articleCard}
            >
              {article.image && (
                <img
                  src={article.image}
                  alt=""
                  style={styles.articleImage}
                  onError={(e) => (e.target.style.display = 'none')}
                />
              )}
              <div style={styles.articleContent}>
                <h3 style={styles.articleTitle}>{article.title}</h3>
                <p style={styles.articleDescription}>{article.description}</p>
                <div style={styles.articleMeta}>
                  <span style={styles.source}>{article.source}</span>
                  <span style={styles.date}>{formatDate(article.pubDate)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#fff',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
  },
  settingsBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
  },
  settingsPanel: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '16px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  closeBtn: {
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
  sourcesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#FFE0E0',
    color: '#c00',
    borderBottom: '1px solid #FFB3B3',
    fontSize: '14px',
  },
  loading: {
    padding: '16px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },
  articlesList: {
    padding: '0',
  },
  noArticles: {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#999',
  },
  articleCard: {
    display: 'block',
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background-color 0.2s',
  },
  articleImage: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  articleContent: {
    padding: '0',
  },
  articleTitle: {
    margin: '0 0 6px 0',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.3',
    color: '#111',
  },
  articleDescription: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4',
  },
  articleMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#999',
  },
  source: {
    fontWeight: '600',
    color: '#007AFF',
  },
  date: {
    color: '#999',
  },
};
