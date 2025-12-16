import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'data', 'moving.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_path TEXT,
    decision TEXT CHECK(decision IN ('move', 'toss', 'give', 'sell', 'other', NULL)),
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS item_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    vote TEXT CHECK(vote IN ('move', 'toss', 'give', 'sell', 'other')) NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, user_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

console.log('Database initialized successfully');

// Helper functions
export function createUser(username, password, displayName, isAdmin = false) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password, display_name, is_admin) VALUES (?, ?, ?, ?)');
  return stmt.run(username, hashedPassword, displayName, isAdmin ? 1 : 0);
}

export function getUser(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

export function getAllUsers() {
  const stmt = db.prepare('SELECT id, username, display_name, is_admin, created_at FROM users');
  return stmt.all();
}

export function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

export function createItem(name, imagePath, createdBy) {
  const stmt = db.prepare('INSERT INTO items (name, image_path, created_by) VALUES (?, ?, ?)');
  return stmt.run(name, imagePath, createdBy);
}

export function getAllItems() {
  const stmt = db.prepare(`
    SELECT
      i.*,
      u.display_name as created_by_name,
      GROUP_CONCAT(
        json_object(
          'user_id', iv.user_id,
          'username', vu.display_name,
          'vote', iv.vote,
          'comment', iv.comment
        )
      ) as votes
    FROM items i
    LEFT JOIN users u ON i.created_by = u.id
    LEFT JOIN item_votes iv ON i.id = iv.item_id
    LEFT JOIN users vu ON iv.user_id = vu.id
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `);

  const items = stmt.all();
  return items.map(item => ({
    ...item,
    votes: item.votes ? JSON.parse(`[${item.votes}]`) : []
  }));
}

export function deleteItem(itemId) {
  const stmt = db.prepare('DELETE FROM items WHERE id = ?');
  return stmt.run(itemId);
}

export function voteOnItem(itemId, userId, vote, comment = null) {
  const stmt = db.prepare(`
    INSERT INTO item_votes (item_id, user_id, vote, comment)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(item_id, user_id)
    DO UPDATE SET vote = excluded.vote, comment = excluded.comment
  `);
  return stmt.run(itemId, userId, vote, comment);
}

export function updateItemDecision(itemId, decision) {
  const stmt = db.prepare('UPDATE items SET decision = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(decision, itemId);
}

export default db;
