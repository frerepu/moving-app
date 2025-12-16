# Moving Decisions App

A full-stack web application to help families decide what to do with items during a move. Features authentication, image uploads, and collaborative voting.

## Features

✅ **User Authentication** - Simple username/password login with JWT tokens
✅ **Image Support** - Take photos of items directly from your phone
✅ **Collaborative Voting** - Everyone can vote on each item
✅ **Vote Tracking** - See who voted for what
✅ **Admin Controls** - Admin users can make final decisions on items
✅ **Decision Tracking** - Stats show how many items are moving, tossing, or giving away
✅ **Persistent Storage** - SQLite database, survives restarts
✅ **Responsive Design** - Works great on phones and desktop
✅ **Self-Hosted** - Full control of your data  

## Quick Start

### 1. Setup Environment

Copy the example env file and edit it:

```bash
cp .env.example .env
nano .env
```

**Important:** Change the JWT_SECRET and ADMIN_KEY to random strings!

Example `.env`:
```env
JWT_SECRET=super-random-string-xyz123abc456
ADMIN_KEY=another-random-key-def789ghi012
```

### 2. Start the Application

```bash
docker-compose up -d
```

The app will be available at: `http://your-server-ip:8080`

### 3. Create User Accounts

Use curl or Postman to create accounts for yourself and the kids:

```bash
# Create admin account for yourself
curl -X POST http://localhost:8080/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dad",
    "password": "your-password",
    "displayName": "Dad",
    "adminKey": "your-admin-key-from-env",
    "isAdmin": true
  }'

# Create account for kid 1
curl -X POST http://localhost:8080/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kid1",
    "password": "their-password",
    "displayName": "Sarah",
    "adminKey": "your-admin-key-from-env"
  }'

# Create account for kid 2
curl -X POST http://localhost:8080/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kid2",
    "password": "their-password",
    "displayName": "Tom",
    "adminKey": "your-admin-key-from-env"
  }'
```

**Note:** Set `"isAdmin": true` for users who should have the power to make final decisions on items.

### 4. Share Access

Send the kids:
- The URL: `http://your-server-ip:8080` (or your domain)
- Their username and password

## How It Works

1. **Add an Item**: Type the name and optionally take a photo
2. **Everyone Votes**: Each person votes Move/Toss/Give
3. **See Results**: Vote counts show on each item
4. **Admin Finalizes**: Admin users see "Finalize Decision" buttons to make the final call
5. **Track Progress**: The stats at the top show how many items are decided (Move/Toss/Give)

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (in `backend/data/moving.db`)
- **Images**: Stored in `backend/data/uploads/`
- **Auth**: JWT tokens (7-day expiry)

## Data Persistence

All data is stored in `./backend/data/`:
- `moving.db` - SQLite database with users, items, and votes
- `uploads/` - Uploaded images

This folder is mounted as a volume, so data persists across container restarts.

## Port Configuration

By default, the app runs on port 8080. To change this, edit `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "YOUR_PORT:80"  # Change YOUR_PORT
```

## Reverse Proxy Setup (Optional)

### With Nginx

```nginx
server {
    listen 80;
    server_name moving.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;  # Allow image uploads
}
```

### With Traefik

Add labels to the frontend service in `docker-compose.yml`:

```yaml
frontend:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.moving.rule=Host(`moving.yourdomain.com`)"
    - "traefik.http.routers.moving.entrypoints=web"
```

## Backup Your Data

```bash
# Backup database and images
tar -czf moving-backup-$(date +%Y%m%d).tar.gz backend/data/

# Restore
tar -xzf moving-backup-20241207.tar.gz
```

## Troubleshooting

### Can't create users?
Make sure you're using the correct ADMIN_KEY from your `.env` file.

### Images not showing?
Check that `backend/data/uploads/` exists and has proper permissions:
```bash
mkdir -p backend/data/uploads
chmod 755 backend/data/uploads
```

### Container won't start?
Check logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Reset everything?
```bash
docker-compose down
rm -rf backend/data/*
docker-compose up -d
# Then create users again
```

## Security Notes

- Keep your `.env` file private (it's in `.gitignore`)
- Use strong passwords for user accounts
- The ADMIN_KEY is only for creating users - keep it secret
- If exposing to internet, use HTTPS (setup with Let's Encrypt/Certbot)
- Consider firewall rules to limit access

## Updating

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Development Mode

To run without Docker for development:

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your keys
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend will be at `http://localhost:3000`, backend at `http://localhost:3001`

## API Endpoints

See the full API documentation in `backend/server.js` for all available endpoints.

Key endpoints:
- `POST /api/login` - Login
- `GET /api/items` - Get all items
- `POST /api/items` - Create item (with image)
- `POST /api/items/:id/vote` - Vote on item
- `DELETE /api/items/:id` - Delete item

## License

MIT - Use however you want!

## Support

If you have issues, check:
1. Docker logs: `docker-compose logs`
2. Database exists: `ls -la backend/data/`
3. Containers running: `docker-compose ps`
