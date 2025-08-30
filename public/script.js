let books = [];
let filteredBooks = [];

const booksGrid = document.getElementById('booksGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const languageFilter = document.getElementById('languageFilter');
const loading = document.getElementById('loading');
const addBookModal = document.getElementById('addBookModal');
const bookDetailsModal = document.getElementById('bookDetailsModal');
const addBookForm = document.getElementById('addBookForm');

document.addEventListener('DOMContentLoaded', function() {
    loadBooks();
    loadStats();
    setupEventListeners();
});

function setupEventListeners() {
    searchInput.addEventListener('input', debounce(filterBooks, 300));
    categoryFilter.addEventListener('change', filterBooks);
    statusFilter.addEventListener('change', filterBooks);
    languageFilter.addEventListener('change', filterBooks);
    
    addBookForm.addEventListener('submit', handleAddBook);
    
    window.addEventListener('click', function(event) {
        if (event.target === addBookModal) {
            closeAddBookModal();
        }
        if (event.target === bookDetailsModal) {
            closeBookDetailsModal();
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadBooks() {
    try {
        showLoading(true);
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        
        books = await response.json();
        filteredBooks = [...books];
        renderBooks();
    } catch (error) {
        console.error('Error loading books:', error);
        showError('Failed to load books. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const stats = await response.json();
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatsDisplay(stats) {
    document.getElementById('totalBooks').textContent = stats.total;
    document.getElementById('completedBooks').textContent = stats.completed;
    document.getElementById('inProgressBooks').textContent = stats.in_progress;
    document.getElementById('notStartedBooks').textContent = stats.not_started;
}

function filterBooks() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    const statusValue = statusFilter.value;
    const languageValue = languageFilter.value;
    
    filteredBooks = books.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            (book.description && book.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryValue || book.category === categoryValue;
        const matchesStatus = !statusValue || book.reading_status === statusValue;
        const matchesLanguage = !languageValue || book.language === languageValue;
        
        return matchesSearch && matchesCategory && matchesStatus && matchesLanguage;
    });
    
    renderBooks();
}

function renderBooks() {
    if (filteredBooks.length === 0) {
        booksGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: rgba(255,255,255,0.8);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                <h3>No books found</h3>
                <p>Try adjusting your search criteria or add a new book.</p>
            </div>
        `;
        return;
    }
    
    booksGrid.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
}

function createBookCard(book) {
    const statusClass = `status-${book.reading_status.replace('_', '-')}`;
    const statusText = book.reading_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `
        <div class="book-card" onclick="showBookDetails(${book.id})">
            <div class="book-header">
                <div>
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-author">by ${escapeHtml(book.author)}</div>
                </div>
            </div>
            
            ${book.description ? `<div class="book-description">${escapeHtml(book.description)}</div>` : ''}
            
            <div class="book-meta">
                ${book.category ? `<span class="meta-tag"><i class="fas fa-tag"></i> ${book.category}</span>` : ''}
                ${book.language ? `<span class="meta-tag"><i class="fas fa-language"></i> ${book.language}</span>` : ''}
                ${book.pages ? `<span class="meta-tag"><i class="fas fa-file-alt"></i> ${book.pages} pages</span>` : ''}
            </div>
            
            <div class="status-selector" onclick="event.stopPropagation()">
                <label>Status:</label>
                <select class="${statusClass}" onchange="updateBookStatus(${book.id}, this.value)">
                    <option value="not_started" ${book.reading_status === 'not_started' ? 'selected' : ''}>Not Started</option>
                    <option value="in_progress" ${book.reading_status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${book.reading_status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        </div>
    `;
}

async function showBookDetails(bookId) {
    try {
        const response = await fetch(`/api/books/${bookId}`);
        if (!response.ok) throw new Error('Failed to fetch book details');
        
        const book = await response.json();
        
        document.getElementById('bookDetailsTitle').innerHTML = `
            <i class="fas fa-book"></i> ${escapeHtml(book.title)}
        `;
        
        document.getElementById('bookDetailsContent').innerHTML = `
            <div style="padding: 30px;">
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #4a90e2; margin-bottom: 10px;">Author</h3>
                    <p>${escapeHtml(book.author)}</p>
                </div>
                
                ${book.description ? `
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #4a90e2; margin-bottom: 10px;">Description</h3>
                        <p style="line-height: 1.6;">${escapeHtml(book.description)}</p>
                    </div>
                ` : ''}
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    ${book.category ? `
                        <div>
                            <h4 style="color: #718096; margin-bottom: 5px;">Category</h4>
                            <p>${book.category}</p>
                        </div>
                    ` : ''}
                    
                    ${book.language ? `
                        <div>
                            <h4 style="color: #718096; margin-bottom: 5px;">Language</h4>
                            <p>${book.language}</p>
                        </div>
                    ` : ''}
                    
                    ${book.pages ? `
                        <div>
                            <h4 style="color: #718096; margin-bottom: 5px;">Pages</h4>
                            <p>${book.pages}</p>
                        </div>
                    ` : ''}
                    
                    <div>
                        <h4 style="color: #718096; margin-bottom: 5px;">Reading Status</h4>
                        <p style="text-transform: capitalize;">${book.reading_status.replace('_', ' ')}</p>
                    </div>
                </div>
                
                ${book.notes ? `
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #4a90e2; margin-bottom: 10px;">Notes</h3>
                        <p style="line-height: 1.6; background: #f7fafc; padding: 15px; border-radius: 8px;">${escapeHtml(book.notes)}</p>
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #718096; margin-bottom: 5px;">Date Added</h4>
                    <p>${new Date(book.date_added).toLocaleDateString()}</p>
                </div>
            </div>
        `;
        
        bookDetailsModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading book details:', error);
        showError('Failed to load book details.');
    }
}

async function updateBookStatus(bookId, newStatus) {
    try {
        const response = await fetch(`/api/books/${bookId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reading_status: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update status');
        
=        const bookIndex = books.findIndex(book => book.id === bookId);
        if (bookIndex !== -1) {
            books[bookIndex].reading_status = newStatus;
        }
        
=        filterBooks();
        loadStats();
        
        showSuccess('Reading status updated successfully!');
    } catch (error) {
        console.error('Error updating book status:', error);
        showError('Failed to update reading status.');
    }
}

async function handleAddBook(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('bookTitle').value.trim(),
        author: document.getElementById('bookAuthor').value.trim(),
        description: document.getElementById('bookDescription').value.trim(),
        category: document.getElementById('bookCategory').value,
        language: document.getElementById('bookLanguage').value,
        pages: parseInt(document.getElementById('bookPages').value) || null,
        notes: document.getElementById('bookNotes').value.trim()
    };
    
    if (!formData.title || !formData.author) {
        showError('Title and author are required.');
        return;
    }
    
    try {
        const response = await fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to add book');
        
        const result = await response.json();
        
        closeAddBookModal();
        addBookForm.reset();
        loadBooks();
        loadStats();
        
        showSuccess('Book added successfully!');
    } catch (error) {
        console.error('Error adding book:', error);
        showError('Failed to add book. Please try again.');
    }
}

function openAddBookModal() {
    addBookModal.style.display = 'block';
    document.getElementById('bookTitle').focus();
}

function closeAddBookModal() {
    addBookModal.style.display = 'none';
    addBookForm.reset();
}

function closeBookDetailsModal() {
    bookDetailsModal.style.display = 'none';
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    booksGrid.style.display = show ? 'none' : 'grid';
}

function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    alert('Success: ' + message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
