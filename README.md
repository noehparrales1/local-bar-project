
# What's Happening Tonight

A full-stack web app for discovering local bars and the events happening today or right now.

## Overview

What's Happening Tonight is a nightlife discovery app built to help users quickly find nearby bars and see what is currently happening at each location. The app combines a clean, modern frontend with a backend API that serves bar and event data, prioritizing active events first and then upcoming ones.

The project focuses on building a strong foundation for local event discovery through geolocation-aware search, structured event data, and an interface designed to make browsing fast and intuitive.

## My Contributions

I worked on building this project as a full-stack local discovery platform with a strong focus on structure, usability, and data flow.

My contributions included:
- Designing and developing the app’s full-stack architecture
- Building backend API functionality for bars and events
- Working with a SQLite database to store venue and event information
- Supporting search and filtering through date, time, and location-based inputs
- Helping shape the frontend experience for browsing bars and events in a clean, modern interface

This project helped strengthen my experience in backend development, database design, API integration, and user-focused web application design.

## Next Steps

- Introduce authentication and role-based access control
- Implement recommendation logic based on user behavior
- Optimize database queries and indexing for performance at scale
- Deploy to cloud infrastructure with CI/CD integration
- Add real-time updates using websockets or polling
- Develop analytics dashboards for venue engagement insights

## Features

- Discover local bars and their events in a scrollable feed
- Prioritize active events before upcoming events
- Browse by specific date and time
- Filter results based on user location and search radius
- View venue and event details in an interactive, modern UI
- Responsive experience for both desktop and mobile

## Tech Stack

**Frontend**
- Vite
- Vanilla JavaScript
- HTML
- CSS

**Backend**
- Node.js
- Express

**Database**
- SQLite

**Concepts**
- REST APIs
- Geolocation-based filtering
- Event prioritization
- Full-stack application architecture

## Project Structure

```text
localbar/
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── seed.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── style.css
    ├── main.js
    └── package.json
