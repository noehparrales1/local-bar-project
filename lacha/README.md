# What's Happening Tonight 🍺✨

A beautiful, modern web app for discovering local bars and their events happening today or right now.

## 🎯 Features

- **Vertical Scrolling Reel Feed** - Smooth, snappable cards showcasing one bar at a time
- **Focused & Collapsed States** - Focused bars show full details; others collapse to thin strips
- **Date & Time Controls** - Easily browse events for different dates and times
- **Event Prioritization** - Active events shown first, then upcoming, then later events
- **Premium UI Design** - Modern glassmorphism, vibrant gradients, and smooth animations
- **Responsive** - Works beautifully on desktop and mobile

## 🚀 Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **SQLite** (better-sqlite3) - Lightweight database
- Event prioritization with distance calculations
- CORS-enabled for local development

### Frontend
- **Vite** - Lightning-fast development
- **Vanilla JavaScript** - No framework overhead
- **Modern CSS** - CSS variables, gradients, animations
- **Inter Font** - Clean, professional typography

## 📁 Project Structure

```
lacha/
├── backend/
│   ├── server.js         # Express API server
│   ├── database.js       # SQLite schema & connection
│   ├── seed.js          # Sample data seeding
│   ├── data.db          # SQLite database (auto-generated)
│   └── package.json
└── frontend/
    ├── index.html        # Main HTML structure
    ├── style.css         # Complete design system
    ├── main.js          # App logic & API integration
    └── package.json
```

## 🛠️ Setup & Installation

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Seed the Database

```bash
cd backend
npm run seed
```

This creates sample data with 6 bars and 11 events in San Francisco.

### 3. Start the Servers

**Terminal 1 - Backend (Port 3000):**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

### 4. Open the App

Navigate to: **http://localhost:5173**

## 🎨 Design System

### Color Palette
- **Primary:** Purple gradient (`hsl(262, 83%, 58%)`)
- **Secondary:** Cyan (`hsl(193, 95%, 56%)`)
- **Accent:** Pink (`hsl(330, 85%, 60%)`)
- **Active Events:** Green with glow effect
- **Dark Theme:** Multiple surface layers for depth

### Key Interactions
- **Smooth Scrolling** - Cards snap to center when scrolling
- **Expand/Collapse Animation** - Smooth transitions between states
- **Hover Effects** - Subtle elevation on buttons and cards
- **Active Badges** - Pulsing indicators for live events

## 📡 API Endpoints

### GET `/feed`
Returns prioritized list of bars with events

**Query Parameters:**
- `lat` (required) - User latitude
- `lng` (required) - User longitude
- `radius` (optional, default: 10000) - Search radius in meters
- `date` (optional, default: today) - Filter date (YYYY-MM-DD)
- `time` (optional, default: now) - Filter time (HH:MM)

**Response:**
```json
{
  "context": {
    "date": "2025-12-16",
    "time": "19:30",
    "day_of_week": "Monday"
  },
  "bars": [
    {
      "bar": {
        "id": "bar_001",
        "name": "The Golden Hour",
        "photo_url": "https://...",
        "address": "123 Market St, San Francisco, CA",
        "distance_meters": 420
      },
      "events": [
        {
          "id": "evt_001",
          "title": "Happy Hour Special",
          "start_time": "17:00",
          "end_time": "19:00",
          "tags": ["happy-hour", "drinks"],
          "is_active": true
        }
      ],
      "has_events": true
    }
  ]
}
```

### GET `/bars`
Returns all bars in the database

### GET `/events/:bar_id`
Returns all events for a specific bar

### POST `/events`
Add a new event (admin endpoint)

**Body:**
```json
{
  "bar_id": "bar_001",
  "title": "Trivia Night",
  "description": "Test your knowledge!",
  "day_of_week": ["Monday", "Wednesday"],
  "start_time": "19:00",
  "end_time": "21:00",
  "tags": ["trivia", "games"]
}
```

## 📊 Data Model

### Bar
```javascript
{
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  address: string,
  photo_url: string | null,
  source: "yelp" | "google" | "manual"
}
```

### Event
```javascript
{
  id: string,
  bar_id: string,
  title: string,
  description: string,
  day_of_week: string[], // JSON array
  start_time: string,    // "HH:MM"
  end_time: string,      // "HH:MM"
  tags: string[]         // JSON array
}
```

## 🎯 Event Prioritization Logic

Bars are sorted by:
1. **Active events now** - Events currently happening
2. **Starting soon** - Events starting within the hour
3. **Later today** - Events later in the day
4. **Distance** - Closer bars ranked higher within same priority

## ✨ Future Enhancements

- [ ] User geolocation (browser API)
- [ ] Bar owner self-service portal
- [ ] Push notifications for favorite bars
- [ ] User authentication & favorites
- [ ] Event reminders
- [ ] Social features (check-ins, reviews)
- [ ] Map view integration
- [ ] Sponsored placements

## 🐛 Troubleshooting

**Backend won't start:**
- Ensure port 3000 is available
- Check that `data.db` exists (run `npm run seed`)

**Frontend shows errors:**
- Verify backend is running on port 3000
- Check browser console for CORS issues
- Clear cache and reload

**No events showing:**
- Check the date/time - sample data includes specific weekday events
- Try Monday at 7PM for most events
- Adjust location to San Francisco coordinates

## 📝 License

MIT

## 👥 Contributing

This is a demonstration project built from a technical specification. Feel free to use it as a starting point for your own local discovery app!

---

Built with ❤️ using modern web technologies
