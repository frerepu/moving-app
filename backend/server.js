import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  createUser,
  getUser,
  getAllUsers,
  verifyPassword,
  createItem,
  getAllItems,
  deleteItem,
  voteOnItem,
  updateItemDecision
} from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Create necessary directories
const dataDir = join(__dirname, 'data');
const uploadsDir = join(dataDir, 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register (admin only - you'll run this manually to create users)
app.post('/api/admin/create-user', (req, res) => {
  try {
    const { username, password, displayName, adminKey, isAdmin } = req.body;

    // Simple admin key check - change this in your .env
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Invalid admin key' });
    }

    const result = createUser(username, password, displayName, isAdmin);
    res.json({ message: 'User created successfully', userId: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Login
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = getUser(username);

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, displayName: user.display_name, isAdmin: user.is_admin === 1 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        isAdmin: user.is_admin === 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user info
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Get all users (for display purposes)
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all items
app.get('/api/items', authenticateToken, (req, res) => {
  try {
    const items = getAllItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create item with optional image
app.post('/api/items', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { name } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = createItem(name, imagePath, req.user.id);
    res.json({ 
      message: 'Item created successfully', 
      itemId: result.lastInsertRowid,
      imagePath 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete item (admin only)
app.delete('/api/items/:id', authenticateToken, (req, res) => {
  try {
    // Only admins can delete items
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can delete items' });
    }

    const result = deleteItem(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on item
app.post('/api/items/:id/vote', authenticateToken, (req, res) => {
  try {
    const { vote, comment } = req.body;

    if (!['move', 'toss', 'give', 'sell', 'other'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote. Must be move, toss, give, sell, or other' });
    }

    voteOnItem(req.params.id, req.user.id, vote, comment);
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update final decision (optional - mark item as decided)
app.patch('/api/items/:id/decision', authenticateToken, (req, res) => {
  try {
    const { decision } = req.body;
    updateItemDecision(req.params.id, decision);
    res.json({ message: 'Decision updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
