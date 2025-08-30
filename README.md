# Islamic Books Database

A modern web application for organizing and tracking your Islamic book collection. Built with Node.js, Express, SQLite, and vanilla JavaScript.

## Features

- **Book Management**: Add, view, and organize Islamic books
- **Search & Filter**: Search by title, author, or description with category, status, and language filters
- **Reading Progress**: Track reading status (Not Started, In Progress, Completed)
- **Modern UI**: Beautiful, responsive design with gradient backgrounds and smooth animations
- **Statistics Dashboard**: View your reading progress at a glance
- **Sample Data**: Pre-loaded with popular Islamic books

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. For development with auto-restart:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Database Schema

The application uses SQLite with the following book structure:
- **id**: Unique identifier
- **title**: Book title (required)
- **author**: Book author (required)
- **description**: Book description
- **category**: Book category (Hadith, Tafsir, Seerah, etc.)
- **language**: Book language (Arabic, English, Urdu, etc.)
- **pages**: Number of pages
- **reading_status**: Current reading status
- **date_added**: When the book was added
- **notes**: Personal notes about the book

## API Endpoints

- `GET /api/books` - Get all books with optional search and filters
- `GET /api/books/:id` - Get a specific book
- `POST /api/books` - Add a new book
- `PATCH /api/books/:id/status` - Update reading status
- `PUT /api/books/:id` - Update book details
- `DELETE /api/books/:id` - Delete a book
- `GET /api/stats` - Get reading statistics

## Technologies Used

- **Backend**: Node.js, Express.js, SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **UI**: Font Awesome icons, CSS Grid/Flexbox
- **Database**: SQLite (file-based, no setup required)

## Sample Books Included

- Sahih al-Bukhari
- Sahih Muslim
- Tafsir Ibn Kathir
- The Sealed Nectar
- Riyadh as-Salihin

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License
