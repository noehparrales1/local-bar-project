// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Default location (San Francisco)
const DEFAULT_LOCATION = {
    lat: 37.7749,
    lng: -122.4194
};

// State
let currentDate = null;
let currentTime = null;
let userLocation = {
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng,
    isUserLocation: false,
    locationName: 'San Francisco'
};
let focusedCardIndex = 0;
let barsData = [];
let scrollAccumulator = 0;
let scrollTimeout = null;
let isAnimating = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeControls();
    initializeModals();
    initializeScrolling();
    initializeGeolocation();
});

// Initialize date/time controls
function initializeControls() {
    const now = new Date();
    currentDate = formatDate(now);
    currentTime = formatTime(now);

    updateControlDisplays();

    document.getElementById('location-btn').addEventListener('click', requestUserLocation);

    document.getElementById('today-btn').addEventListener('click', () => {
        openModal('date-modal');
    });

    document.getElementById('now-btn').addEventListener('click', () => {
        openModal('time-modal');
    });

    document.getElementById('retry-btn')?.addEventListener('click', loadFeed);
}

// Initialize modals
function initializeModals() {
    // Calendar state
    let calendarDate = new Date();
    let selectedDate = new Date(currentDate);

    // Initialize calendar
    function renderCalendar() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();

        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendar-month-year').textContent =
            `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Get previous month's last days
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        const calendarDaysContainer = document.getElementById('calendar-days');
        calendarDaysContainer.innerHTML = '';

        // Add previous month's trailing days
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const dayEl = createCalendarDay(day, true, new Date(year, month - 1, day));
            calendarDaysContainer.appendChild(dayEl);
        }

        // Add current month's days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const dayEl = createCalendarDay(day, false, date, isToday, isSelected);
            calendarDaysContainer.appendChild(dayEl);
        }

        // Add next month's leading days
        const totalCells = calendarDaysContainer.children.length;
        const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            const dayEl = createCalendarDay(day, true, new Date(year, month + 1, day));
            calendarDaysContainer.appendChild(dayEl);
        }
    }

    function createCalendarDay(day, isOtherMonth, date, isToday = false, isSelected = false) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;

        if (isOtherMonth) {
            dayEl.classList.add('calendar-day-other-month');
        }
        if (isToday) {
            dayEl.classList.add('calendar-day-today');
        }
        if (isSelected) {
            dayEl.classList.add('calendar-day-selected');
        }

        dayEl.addEventListener('click', () => {
            selectedDate = new Date(date);
            currentDate = formatDate(selectedDate);
            updateControlDisplays();
            closeModal('date-modal');
            loadFeed();
        });

        return dayEl;
    }

    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('date-cancel').addEventListener('click', () => closeModal('date-modal'));

    // Render initial calendar when modal opens
    const dateModal = document.getElementById('date-modal');
    dateModal.addEventListener('click', (e) => {
        if (e.target === dateModal) {
            closeModal('date-modal');
        }
    });

    // Time modal
    const timeModal = document.getElementById('time-modal');
    const timePicker = document.getElementById('time-picker');
    const timeConfirm = document.getElementById('time-confirm');
    const timeCancel = document.getElementById('time-cancel');

    timePicker.value = currentTime;

    timeConfirm.addEventListener('click', () => {
        currentTime = timePicker.value;
        updateControlDisplays();
        closeModal('time-modal');
        loadFeed();
    });

    timeCancel.addEventListener('click', () => closeModal('time-modal'));

    // Close on backdrop click
    timeModal.addEventListener('click', (e) => {
        if (e.target === timeModal) {
            closeModal(timeModal.id);
        }
    });

    // Store render function for later use
    window.renderCalendar = renderCalendar;
}

// Modal utilities
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');

    // Set current values
    if (modalId === 'date-modal') {
        // Render the calendar when opening the date modal
        if (window.renderCalendar) {
            window.renderCalendar();
        }
    } else if (modalId === 'time-modal') {
        document.getElementById('time-picker').value = currentTime;
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Update control displays
function updateControlDisplays() {
    const dateDisplay = document.getElementById('date-display');
    const timeDisplay = document.getElementById('time-display');

    const today = formatDate(new Date());
    const now = formatTime(new Date());

    dateDisplay.textContent = currentDate === today ? 'Today' : formatDateDisplay(currentDate);
    timeDisplay.textContent = currentTime === now ? 'Now' : formatTimeDisplay(currentTime);
}

// Load feed from API
async function loadFeed() {
    showLoading();
    hideError();
    hideEmptyState();

    try {
        const params = new URLSearchParams({
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius: 10000,
            date: currentDate,
            time: currentTime
        });

        const response = await fetch(`${API_BASE_URL}/feed?${params}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        barsData = data.bars;

        hideLoading();

        if (barsData.length === 0) {
            showEmptyState();
        } else {
            renderFeed();
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        hideLoading();
        showError(error.message);
    }
}

// Render feed
function renderFeed() {
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '';

    barsData.forEach((barData, index) => {
        const card = createBarCard(barData, index);
        feedContainer.appendChild(card);
    });

    // Set first card as focused
    if (barsData.length > 0) {
        setFocusedCard(0);
    }
}

// Create bar card element
function createBarCard(barData, index) {
    const { bar, events, has_events } = barData;

    const card = document.createElement('div');
    card.className = 'bar-card collapsed';
    card.dataset.index = index;

    // Header
    const header = document.createElement('div');
    header.className = 'bar-header';

    const barInfo = document.createElement('div');
    barInfo.className = 'bar-info';

    const barName = document.createElement('h2');
    barName.className = 'bar-name';
    barName.textContent = bar.name;

    const barMeta = document.createElement('div');
    barMeta.className = 'bar-meta';

    const distance = bar.distance_meters;
    const distanceText = distance < 1000
        ? `${distance}m away`
        : `${(distance / 1000).toFixed(1)}km away`;

    barMeta.textContent = distanceText;

    barInfo.appendChild(barName);
    barInfo.appendChild(barMeta);

    const indicator = document.createElement('div');
    indicator.className = 'event-indicator';

    header.appendChild(barInfo);
    if (has_events) {
        header.appendChild(indicator);
    }

    card.appendChild(header);

    // Visual section
    const visual = document.createElement('div');
    visual.className = 'bar-visual';

    if (bar.photo_url) {
        const img = document.createElement('img');
        img.className = 'bar-photo';
        img.src = bar.photo_url;
        img.alt = bar.name;
        visual.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'bar-placeholder';
        placeholder.textContent = '🍺';
        visual.appendChild(placeholder);
    }

    card.appendChild(visual);

    // Events section
    if (has_events && events.length > 0) {
        const eventsSection = document.createElement('div');
        eventsSection.className = 'bar-events';

        const eventsTitle = document.createElement('h3');
        eventsTitle.className = 'events-title';
        eventsTitle.textContent = 'Events';
        eventsSection.appendChild(eventsTitle);

        const eventList = document.createElement('div');
        eventList.className = 'event-list';

        events.forEach(event => {
            const eventItem = createEventItem(event);
            eventList.appendChild(eventItem);
        });

        eventsSection.appendChild(eventList);
        card.appendChild(eventsSection);
    }

    // Click handler
    card.addEventListener('click', () => {
        setFocusedCard(index);
    });

    return card;
}

// Create event item
function createEventItem(event) {
    const item = document.createElement('div');
    item.className = 'event-item';
    if (event.is_active) {
        item.classList.add('active');
    }

    const eventHeader = document.createElement('div');
    eventHeader.className = 'event-header';

    const eventTitle = document.createElement('h4');
    eventTitle.className = 'event-title';
    eventTitle.textContent = event.title;

    eventHeader.appendChild(eventTitle);

    if (event.is_active) {
        const badge = document.createElement('span');
        badge.className = 'active-badge';

        const dot = document.createElement('span');
        dot.className = 'active-dot';

        badge.appendChild(dot);
        badge.appendChild(document.createTextNode('Active Now'));

        eventHeader.appendChild(badge);
    }

    item.appendChild(eventHeader);

    const eventTime = document.createElement('div');
    eventTime.className = 'event-time';
    eventTime.textContent = `${formatTimeDisplay(event.start_time)} - ${formatTimeDisplay(event.end_time)}`;
    item.appendChild(eventTime);

    if (event.tags && event.tags.length > 0) {
        const tags = document.createElement('div');
        tags.className = 'event-tags';

        event.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'event-tag';
            tagEl.textContent = tag;
            tags.appendChild(tagEl);
        });

        item.appendChild(tags);
    }

    return item;
}

// Set focused card
function setFocusedCard(index) {
    const cards = document.querySelectorAll('.bar-card');

    cards.forEach((card, i) => {
        if (i === index) {
            card.classList.remove('collapsed');
            card.classList.add('focused');

            // Smooth scroll to focused card
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            card.classList.remove('focused');
            card.classList.add('collapsed');
        }
    });

    focusedCardIndex = index;
}

// Initialize snap scrolling
function initializeScrolling() {
    // Global wheel event - works anywhere on screen
    window.addEventListener('wheel', (e) => {
        if (barsData.length === 0) return;

        e.preventDefault();

        // Accumulate scroll delta
        scrollAccumulator += e.deltaY;

        // Clear existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Debounce: wait for scroll to stop, then process
        scrollTimeout = setTimeout(() => {
            if (isAnimating) return;

            // Determine direction based on accumulated scroll
            if (Math.abs(scrollAccumulator) > 30) {
                isAnimating = true;

                if (scrollAccumulator > 0) {
                    navigateToCard(focusedCardIndex + 1);
                } else {
                    navigateToCard(focusedCardIndex - 1);
                }

                // Reset accumulator
                scrollAccumulator = 0;

                // Shorter animation lock for better responsiveness
                setTimeout(() => {
                    isAnimating = false;
                }, 400);
            } else {
                // Reset if below threshold
                scrollAccumulator = 0;
            }
        }, 50);
    }, { passive: false });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (barsData.length === 0 || isAnimating) return;

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            isAnimating = true;
            navigateToCard(focusedCardIndex + 1);
            setTimeout(() => { isAnimating = false; }, 400);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            isAnimating = true;
            navigateToCard(focusedCardIndex - 1);
            setTimeout(() => { isAnimating = false; }, 400);
        }
    });

    // Touch swipe for mobile
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (isAnimating || barsData.length === 0) return;

        const touchEndY = e.changedTouches[0].screenY;
        const swipeDistance = touchStartY - touchEndY;

        // Trigger on swipe threshold
        if (Math.abs(swipeDistance) > 50) {
            isAnimating = true;

            if (swipeDistance > 0) {
                navigateToCard(focusedCardIndex + 1);
            } else {
                navigateToCard(focusedCardIndex - 1);
            }

            setTimeout(() => { isAnimating = false; }, 400);
        }
    }, { passive: true });
}

// Navigate to card with bounds checking
function navigateToCard(index) {
    if (index >= 0 && index < barsData.length) {
        setFocusedCard(index);
    }
}

// Loading state
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('feed-container').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('feed-container').style.display = 'block';
}

// Error state
function showError(message) {
    const errorEl = document.getElementById('error');
    const errorMessageEl = document.getElementById('error-message');
    errorMessageEl.textContent = message || 'Failed to load events. Please try again.';
    errorEl.style.display = 'block';
    document.getElementById('feed-container').style.display = 'none';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

// Empty state
function showEmptyState() {
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('feed-container').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('empty-state').style.display = 'none';
}

// Utility functions
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeDisplay(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

// ============================================
// Geolocation Functions
// ============================================

// Get user's current location
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                let errorMessage = 'Unable to get location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000  // 5 minutes cache
            }
        );
    });
}

// Reverse geocode lat/lng to city name
async function getCityName(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();
        const address = data.address;

        // Try to build a nice city name
        const city = address.city || address.town || address.village || address.suburb;
        const state = address.state;

        if (city && state) {
            return `${city}, ${state}`;
        } else if (city) {
            return city;
        } else if (state) {
            return state;
        } else {
            return 'Your Location';
        }
    } catch (error) {
        console.error('Error getting city name:', error);
        return 'Your Location';
    }
}

// Toggle location button - switches between user location and default
async function requestUserLocation() {
    const locationBtn = document.getElementById('location-btn');
    const locationDisplay = document.getElementById('location-display');

    // If already using user location, switch back to default
    if (userLocation.isUserLocation) {
        userLocation = {
            lat: DEFAULT_LOCATION.lat,
            lng: DEFAULT_LOCATION.lng,
            isUserLocation: false,
            locationName: 'San Francisco'
        };

        updateLocationDisplay();
        console.log('📍 Switched to default location (San Francisco)');
        loadFeed();
        return;
    }

    // Otherwise, try to get user's location
    locationDisplay.textContent = 'Getting location...';
    locationBtn.disabled = true;

    try {
        const location = await getUserLocation();

        // Get city name from coordinates
        const cityName = await getCityName(location.lat, location.lng);

        userLocation = {
            ...location,
            isUserLocation: true,
            locationName: cityName
        };

        updateLocationDisplay();
        console.log('📍 Using your location:', userLocation.lat, userLocation.lng);

        // Reload feed with new location
        loadFeed();
    } catch (error) {
        console.error('Geolocation error:', error);
        alert(error.message + '. Using default location.');
    } finally {
        locationBtn.disabled = false;
    }
}

// Initialize geolocation on page load
async function initializeGeolocation() {
    console.log('📍 Attempting to get your location...');

    try {
        const location = await getUserLocation();

        // Get city name from coordinates
        const cityName = await getCityName(location.lat, location.lng);

        userLocation = {
            ...location,
            isUserLocation: true,
            locationName: cityName
        };

        updateLocationDisplay();
        console.log('📍 Got your location:', userLocation.lat, userLocation.lng);
    } catch (error) {
        console.log('📍 Using default location (San Francisco):', error.message);
        updateLocationDisplay();
    }

    // Load feed regardless of location result
    loadFeed();
}

// Update location display
function updateLocationDisplay() {
    const locationDisplay = document.getElementById('location-display');
    locationDisplay.textContent = userLocation.locationName;

    if (userLocation.isUserLocation) {
        locationDisplay.style.fontWeight = '600';
        locationDisplay.style.color = 'var(--color-active)';
    } else {
        locationDisplay.style.fontWeight = '500';
        locationDisplay.style.color = '';
    }
}

