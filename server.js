const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// SQLite database
const db = new sqlite3.Database('./islamic_books.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT,
    language TEXT DEFAULT 'Arabic',
    pages INTEGER,
    reading_status TEXT DEFAULT 'not_started',
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  )`);

  // Insert some sample Islamic books
  const sampleBooks = [
    {
      title: "Sahih al-Bukhari",
      author: "Imam al-Bukhari",
      description: "The most authentic collection of hadith compiled by Imam Muhammad al-Bukhari",
      category: "Hadith",
      language: "Arabic",
      pages: 2000
    },
    {
      title: "Sahih Muslim",
      author: "Imam Muslim",
      description: "One of the six major hadith collections in Sunni Islam",
      category: "Hadith",
      language: "Arabic",
      pages: 1500
    },
    {
      title: "Tafsir Ibn Kathir",
      author: "Ibn Kathir",
      description: "A classical Sunni tafsir (commentary) of the Quran",
      category: "Tafsir",
      language: "Arabic",
      pages: 3000
    },
    {
      title: "The Sealed Nectar",
      author: "Safi-ur-Rahman al-Mubarakpuri",
      description: "Biography of Prophet Muhammad (PBUH)",
      category: "Seerah",
      language: "English",
      pages: 600
    },
    {
      title: "Riyadh as-Salihin",
      author: "Imam an-Nawawi",
      description: "Collection of hadith for the training of beginners",
      category: "Hadith",
      language: "Arabic",
      pages: 400
    }
  ];

  // Check if books already exist to avoid duplicates
  db.get("SELECT COUNT(*) as count FROM books", (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO books (title, author, description, category, language, pages) 
                              VALUES (?, ?, ?, ?, ?, ?)`);
      
      sampleBooks.forEach(book => {
        stmt.run(book.title, book.author, book.description, book.category, book.language, book.pages);
      });
      
      stmt.finalize();
      console.log('Sample books inserted successfully');
    }
  });
});

// Routes

// Get all books with optional search and filter
app.get('/api/books', (req, res) => {
  const { search, category, status, language } = req.query;
  
  let query = 'SELECT * FROM books WHERE 1=1';
  let params = [];
  
  if (search) {
    query += ' AND (title LIKE ? OR author LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (status) {
    query += ' AND reading_status = ?';
    params.push(status);
  }
  
  if (language) {
    query += ' AND language = ?';
    params.push(language);
  }
  
  query += ' ORDER BY date_added DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get a single book by ID
app.get('/api/books/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json(row);
  });
});

// Add a new book
app.post('/api/books', (req, res) => {
  const { title, author, description, category, language, pages, notes } = req.body;
  
  if (!title || !author) {
    res.status(400).json({ error: 'Title and author are required' });
    return;
  }
  
  const query = `INSERT INTO books (title, author, description, category, language, pages, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [title, author, description, category, language || 'Arabic', pages, notes], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Book added successfully' });
  });
});

// Update reading status
app.patch('/api/books/:id/status', (req, res) => {
  const { id } = req.params;
  const { reading_status } = req.body;
  
  const validStatuses = ['not_started', 'in_progress', 'completed'];
  if (!validStatuses.includes(reading_status)) {
    res.status(400).json({ error: 'Invalid reading status' });
    return;
  }
  
  db.run('UPDATE books SET reading_status = ? WHERE id = ?', [reading_status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json({ message: 'Reading status updated successfully' });
  });
});

// Update book details
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, description, category, language, pages, notes } = req.body;
  
  if (!title || !author) {
    res.status(400).json({ error: 'Title and author are required' });
    return;
  }
  
  const query = `UPDATE books SET title = ?, author = ?, description = ?, category = ?, 
                 language = ?, pages = ?, notes = ? WHERE id = ?`;
  
  db.run(query, [title, author, description, category, language, pages, notes, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json({ message: 'Book updated successfully' });
  });
});

// Delete a book
app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json({ message: 'Book deleted successfully' });
  });
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM books',
    'SELECT COUNT(*) as completed FROM books WHERE reading_status = "completed"',
    'SELECT COUNT(*) as in_progress FROM books WHERE reading_status = "in_progress"',
    'SELECT COUNT(*) as not_started FROM books WHERE reading_status = "not_started"'
  ];
  
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    })
  )).then(results => {
    res.json({
      total: results[0].total,
      completed: results[1].completed,
      in_progress: results[2].in_progress,
      not_started: results[3].not_started
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Islamic Books Database server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});

module.exports = app;
