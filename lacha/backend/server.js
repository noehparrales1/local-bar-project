import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper function to calculate distance between two coordinates (in meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Helper function to check if event is active at a given time
function isEventActive(event, currentTime, dayOfWeek) {
    const days = JSON.parse(event.day_of_week);
    if (!days.includes(dayOfWeek)) {
        return false;
    }

    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [startHour, startMinute] = event.start_time.split(':').map(Number);
    const [endHour, endMinute] = event.end_time.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // Handle events that go past midnight
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
        if (currentMinutes < startMinutes) {
            const adjustedCurrent = currentMinutes + 24 * 60;
            return adjustedCurrent >= startMinutes && adjustedCurrent <= endMinutes;
        }
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Helper function to get minutes until event starts
function getMinutesUntilStart(event, currentTime) {
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [startHour, startMinute] = event.start_time.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startHour * 60 + startMinute;

    if (startMinutes > currentMinutes) {
        return startMinutes - currentMinutes;
    } else if (startMinutes < currentMinutes) {
        // Event is tomorrow
        return (24 * 60 - currentMinutes) + startMinutes;
    }
    return 0;
}

// GET /feed endpoint
app.get('/feed', (req, res) => {
    try {
        const { lat, lng, radius = 10000, date, time } = req.query;

        // Validate required parameters
        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseInt(radius);

        // Get current date and time if not provided
        const now = new Date();
        const queryDate = date || now.toISOString().split('T')[0];
        const queryTime = time || now.toTimeString().split(' ')[0].substring(0, 5);

        // Get day of week from date
        const dateObj = new Date(queryDate + 'T00:00:00');
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = daysOfWeek[dateObj.getDay()];

        // Get all bars
        const bars = db.prepare('SELECT * FROM bars').all();

        // Filter bars within radius and get their events
        const barsWithEvents = bars
            .map(bar => {
                const distance = calculateDistance(userLat, userLng, bar.latitude, bar.longitude);

                if (distance > searchRadius) {
                    return null;
                }

                // Get events for this bar that match the day of week
                const events = db.prepare(`
          SELECT * FROM events 
          WHERE bar_id = ? AND day_of_week LIKE ?
        `).all(bar.id, `%${dayOfWeek}%`);

                // Process events to determine if active and add metadata
                const processedEvents = events.map(event => {
                    const is_active = isEventActive(event, queryTime, dayOfWeek);
                    const minutes_until_start = is_active ? 0 : getMinutesUntilStart(event, queryTime);

                    return {
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        start_time: event.start_time,
                        end_time: event.end_time,
                        tags: JSON.parse(event.tags),
                        is_active,
                        minutes_until_start
                    };
                });

                // Sort events: active first, then by how soon they start
                processedEvents.sort((a, b) => {
                    if (a.is_active && !b.is_active) return -1;
                    if (!a.is_active && b.is_active) return 1;
                    return a.minutes_until_start - b.minutes_until_start;
                });

                return {
                    bar: {
                        id: bar.id,
                        name: bar.name,
                        photo_url: bar.photo_url,
                        address: bar.address,
                        distance_meters: Math.round(distance)
                    },
                    events: processedEvents,
                    has_events: processedEvents.length > 0,
                    // Priority score for sorting
                    _priority: processedEvents.length > 0
                        ? (processedEvents[0].is_active ? 3 : (processedEvents[0].minutes_until_start < 60 ? 2 : 1))
                        : 0
                };
            })
            .filter(item => item !== null);

        // Sort bars by priority (active events first, then upcoming, then later)
        barsWithEvents.sort((a, b) => {
            if (b._priority !== a._priority) {
                return b._priority - a._priority;
            }
            // If same priority, sort by distance
            return a.bar.distance_meters - b.bar.distance_meters;
        });

        // Remove priority field before sending
        barsWithEvents.forEach(item => delete item._priority);

        res.json({
            context: {
                date: queryDate,
                time: queryTime,
                day_of_week: dayOfWeek
            },
            bars: barsWithEvents
        });
    } catch (error) {
        console.error('Error in /feed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /bars - Get all bars
app.get('/bars', (req, res) => {
    try {
        const bars = db.prepare('SELECT * FROM bars').all();
        res.json(bars);
    } catch (error) {
        console.error('Error in /bars:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /events - Add a new event (admin)
app.post('/events', (req, res) => {
    try {
        const { bar_id, title, description, day_of_week, start_time, end_time, tags } = req.body;

        if (!bar_id || !title || !day_of_week || !start_time || !end_time || !tags) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const id = `evt_${Date.now()}`;
        const insert = db.prepare(`
      INSERT INTO events (id, bar_id, title, description, day_of_week, start_time, end_time, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        insert.run(
            id,
            bar_id,
            title,
            description || '',
            JSON.stringify(day_of_week),
            start_time,
            end_time,
            JSON.stringify(tags)
        );

        res.status(201).json({ id, message: 'Event created successfully' });
    } catch (error) {
        console.error('Error in POST /events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /events/:bar_id - Get events for a specific bar
app.get('/events/:bar_id', (req, res) => {
    try {
        const { bar_id } = req.params;
        const events = db.prepare('SELECT * FROM events WHERE bar_id = ?').all(bar_id);

        const processedEvents = events.map(event => ({
            ...event,
            day_of_week: JSON.parse(event.day_of_week),
            tags: JSON.parse(event.tags)
        }));

        res.json(processedEvents);
    } catch (error) {
        console.error('Error in GET /events/:bar_id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Feed endpoint: http://localhost:${PORT}/feed?lat=37.7749&lng=-122.4194`);
});
