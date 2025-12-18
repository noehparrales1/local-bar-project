import db, { saveDatabase } from './database.js';

// Clear existing data
db.run('DELETE FROM event_days');
db.run('DELETE FROM events');
db.run('DELETE FROM bars');

// Sample bars in San Francisco
const bars = [
    {
        id: 'bar_001',
        name: 'The Golden Hour',
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Market St, San Francisco, CA',
        photo_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
        source: 'manual'
    },
    {
        id: 'bar_002',
        name: 'Neon Nights',
        latitude: 37.7849,
        longitude: -122.4094,
        address: '456 Mission St, San Francisco, CA',
        photo_url: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800',
        source: 'manual'
    },
    {
        id: 'bar_003',
        name: 'The Whiskey Room',
        latitude: 37.7649,
        longitude: -122.4294,
        address: '789 Valencia St, San Francisco, CA',
        photo_url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800',
        source: 'manual'
    },
    {
        id: 'bar_004',
        name: 'Marina Social',
        latitude: 37.8049,
        longitude: -122.4394,
        address: '321 Chestnut St, San Francisco, CA',
        photo_url: 'https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=800',
        source: 'manual'
    },
    {
        id: 'bar_005',
        name: 'Castro Corner',
        latitude: 37.7609,
        longitude: -122.4350,
        address: '567 Castro St, San Francisco, CA',
        photo_url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
        source: 'manual'
    },
    {
        id: 'bar_006',
        name: 'North Beach Tavern',
        latitude: 37.8008,
        longitude: -122.4104,
        address: '890 Columbus Ave, San Francisco, CA',
        photo_url: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800',
        source: 'manual'
    }
];

// Sample events (now with days array instead of day_of_week)
const events = [
    // The Golden Hour - Multiple events
    {
        id: 'evt_001',
        bar_id: 'bar_001',
        title: 'Happy Hour Special',
        description: '$5 cocktails and $3 beers',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        start_time: '17:00',
        end_time: '19:00',
        tags: JSON.stringify(['happy-hour', 'drinks'])
    },
    {
        id: 'evt_002',
        bar_id: 'bar_001',
        title: 'Live Jazz',
        description: 'Local jazz ensemble performs',
        days: ['Friday', 'Saturday'],
        start_time: '20:00',
        end_time: '23:00',
        tags: JSON.stringify(['live-music', 'jazz'])
    },

    // Neon Nights
    {
        id: 'evt_003',
        bar_id: 'bar_002',
        title: 'Trivia Night',
        description: 'Test your knowledge, win prizes!',
        days: ['Monday'],
        start_time: '19:00',
        end_time: '21:00',
        tags: JSON.stringify(['trivia', 'games'])
    },
    {
        id: 'evt_004',
        bar_id: 'bar_002',
        title: 'DJ Night',
        description: 'Electronic and house music',
        days: ['Friday', 'Saturday'],
        start_time: '21:00',
        end_time: '02:00',
        tags: JSON.stringify(['dj', 'dancing', 'nightlife'])
    },

    // The Whiskey Room
    {
        id: 'evt_005',
        bar_id: 'bar_003',
        title: 'Whiskey Tasting',
        description: 'Sample premium whiskeys from around the world',
        days: ['Thursday'],
        start_time: '18:00',
        end_time: '20:00',
        tags: JSON.stringify(['tasting', 'whiskey', 'premium'])
    },
    {
        id: 'evt_006',
        bar_id: 'bar_003',
        title: 'Open Mic Night',
        description: 'Showcase your talent',
        days: ['Wednesday'],
        start_time: '20:00',
        end_time: '23:00',
        tags: JSON.stringify(['live-music', 'open-mic'])
    },

    // Marina Social
    {
        id: 'evt_007',
        bar_id: 'bar_004',
        title: 'Sunset Happy Hour',
        description: 'Half-price appetizers and drinks',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        start_time: '16:30',
        end_time: '18:30',
        tags: JSON.stringify(['happy-hour', 'food', 'drinks'])
    },
    {
        id: 'evt_008',
        bar_id: 'bar_004',
        title: 'Karaoke Night',
        description: 'Sing your heart out!',
        days: ['Tuesday', 'Saturday'],
        start_time: '21:00',
        end_time: '01:00',
        tags: JSON.stringify(['karaoke', 'entertainment'])
    },

    // Castro Corner
    {
        id: 'evt_009',
        bar_id: 'bar_005',
        title: 'Drag Show Spectacular',
        description: 'Amazing performances by local queens',
        days: ['Friday', 'Saturday'],
        start_time: '22:00',
        end_time: '00:30',
        tags: JSON.stringify(['drag-show', 'entertainment', 'lgbtq'])
    },

    // North Beach Tavern
    {
        id: 'evt_010',
        bar_id: 'bar_006',
        title: 'Acoustic Sessions',
        description: 'Intimate acoustic performances',
        days: ['Thursday', 'Sunday'],
        start_time: '19:30',
        end_time: '22:00',
        tags: JSON.stringify(['live-music', 'acoustic'])
    },
    {
        id: 'evt_011',
        bar_id: 'bar_006',
        title: 'Craft Beer Monday',
        description: '$2 off all craft beers',
        days: ['Monday'],
        start_time: '17:00',
        end_time: '22:00',
        tags: JSON.stringify(['beer', 'craft-beer', 'deals'])
    }
];

// Helper function to convert day name to number
function dayNameToNumber(dayName) {
    const days = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
    };
    return days[dayName];
}

// Insert bars using sql.js API
for (const bar of bars) {
    db.run(
        `INSERT INTO bars (id, name, latitude, longitude, address, photo_url, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bar.id, bar.name, bar.latitude, bar.longitude, bar.address, bar.photo_url, bar.source]
    );
}

// Insert events and event_days using sql.js API
for (const event of events) {
    // Insert event (without day_of_week)
    db.run(
        `INSERT INTO events (id, bar_id, title, description, start_time, end_time, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [event.id, event.bar_id, event.title, event.description, event.start_time, event.end_time, event.tags]
    );

    // Insert event_days for each day this event occurs
    for (const dayName of event.days) {
        const dayNumber = dayNameToNumber(dayName);
        db.run(
            `INSERT INTO event_days (event_id, day_number)
             VALUES (?, ?)`,
            [event.id, dayNumber]
        );
    }
}

// Save the database to file
saveDatabase();

console.log('✅ Database seeded successfully!');
console.log(`📊 Inserted ${bars.length} bars and ${events.length} events`);
console.log(`🗓️  Created ${events.reduce((sum, e) => sum + e.days.length, 0)} event-day mappings`);
