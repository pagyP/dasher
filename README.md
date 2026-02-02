# Dasher 🏠

A simple, dark-themed home lab dashboard for managing links to your self-hosted services.  This was inspired by my need for a lightweight, customizable dashboard to quickly access my various home lab services. If you need a more feature-rich solution, consider [Heimdall](https://heimdall.site/) or [Dashy](https://demo.dashy.to/).

## Features

- 🎨 Dark mode UI inspired by GitHub's design
- 📱 Responsive grid layout
- ➕ Add/edit/delete services through the UI
- 🔍 Search and filter services
- 📂 Automatic grouping by categories
- 💾 Persistent storage via JSON file
- 🐳 Docker Compose deployment

## Quick Start

### Using Docker Compose (Recommended)

Clone the repository and navigate to the project directory:

```bash
# Start the dashboard
docker compose up -d

# View logs
docker compose logs -f

# Stop the dashboard
docker compose down
```

Access the dashboard at `http://localhost:3000`

### Development Mode (optional)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Note: npm install is only needed for local development. Docker builds install dependencies inside the image.

## Configuration

Services are stored in `data/services.json`. The file is automatically created on first run with sample data.

### Service Schema

```json
{
  "id": "unique-id",
  "name": "Service Name",
  "url": "http://service.local",
  "category": "Category Name",
  "icon": "🎬",
  "description": "Optional description"
}
```

## Usage

1. **Add a Service**: Click the "+ Add Service" button in the top right
2. **Edit a Service**: Click the ✏️ icon on any service card
3. **Delete a Service**: Click the 🗑️ icon on any service card
4. **Search**: Use the search bar to filter services by name, category, or description
5. **Quick Access**: Click any service card to open the service in a new tab

## Customization

### Icons

You can use:
- Emojis: `🎬`, `☁️`, `📊`
- Image URLs: `https://example.com/icon.png`
- Local images: Place in `public/assets/` and reference as `/assets/icon.png`

### Styling

Edit `public/style.css` to customize colors, spacing, or layout. CSS variables are defined at the top for easy theming.

## Port Configuration

To change the default port (3000), update:
- `docker-compose.yml`: Change the port mapping
- `server.js`: Set the `PORT` environment variable

## Data Persistence

Service data is stored in the `./data` directory, which is mounted as a volume in Docker. This ensures your services persist across container restarts.

## License

MIT
