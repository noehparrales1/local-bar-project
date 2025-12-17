import db from './database.js';

// Clear existing data
db.exec('DELETE FROM events');
db.exec('DELETE FROM bars');

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

// Sample events
const events = [
    // The Golden Hour - Multiple events
    {
        id: 'evt_001',
        bar_id: 'bar_001',
        title: 'Happy Hour Special',
        description: '$5 cocktails and $3 beers',
        day_of_week: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        start_time: '17:00',
        end_time: '19:00',
        tags: JSON.stringify(['happy-hour', 'drinks'])
    },
    {
        id: 'evt_002',
        bar_id: 'bar_001',
        title: 'Live Jazz',
        description: 'Local jazz ensemble performs',
        day_of_week: JSON.stringify(['Friday', 'Saturday']),
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
        day_of_week: JSON.stringify(['Monday']),
        start_time: '19:00',
        end_time: '21:00',
        tags: JSON.stringify(['trivia', 'games'])
    },
    {
        id: 'evt_004',
        bar_id: 'bar_002',
        title: 'DJ Night',
        description: 'Electronic and house music',
        day_of_week: JSON.stringify(['Friday', 'Saturday']),
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
        day_of_week: JSON.stringify(['Thursday']),
        start_time: '18:00',
        end_time: '20:00',
        tags: JSON.stringify(['tasting', 'whiskey', 'premium'])
    },
    {
        id: 'evt_006',
        bar_id: 'bar_003',
        title: 'Open Mic Night',
        description: 'Showcase your talent',
        day_of_week: JSON.stringify(['Wednesday']),
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
        day_of_week: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
        start_time: '16:30',
        end_time: '18:30',
        tags: JSON.stringify(['happy-hour', 'food', 'drinks'])
    },
    {
        id: 'evt_008',
        bar_id: 'bar_004',
        title: 'Karaoke Night',
        description: 'Sing your heart out!',
        day_of_week: JSON.stringify(['Tuesday', 'Saturday']),
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
        day_of_week: JSON.stringify(['Friday', 'Saturday']),
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
        day_of_week: JSON.stringify(['Thursday', 'Sunday']),
        start_time: '19:30',
        end_time: '22:00',
        tags: JSON.stringify(['live-music', 'acoustic'])
    },
    {
        id: 'evt_011',
        bar_id: 'bar_006',
        title: 'Craft Beer Monday',
        description: '$2 off all craft beers',
        day_of_week: JSON.stringify(['Monday']),
        start_time: '17:00',
        end_time: '22:00',
        tags: JSON.stringify(['beer', 'craft-beer', 'deals'])
    }
];

// Insert bars
const insertBar = db.prepare(`
  INSERT INTO bars (id, name, latitude, longitude, address, photo_url, source)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const bar of bars) {
    insertBar.run(
        bar.id,
        bar.name,
        bar.latitude,
        bar.longitude,
        bar.address,
        bar.photo_url,
        bar.source
    );
}

// Insert events
const insertEvent = db.prepare(`
  INSERT INTO events (id, bar_id, title, description, day_of_week, start_time, end_time, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const event of events) {
    insertEvent.run(
        event.id,
        event.bar_id,
        event.title,
        event.description,
        event.day_of_week,
        event.start_time,
        event.end_time,
        event.tags
    );
}

console.log('✅ Database seeded successfully!');
console.log(`📊 Inserted ${bars.length} bars and ${events.length} events`);

db.close();
