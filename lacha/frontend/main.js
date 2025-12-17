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
    loadFeed();
});

// Initialize date/time controls
function initializeControls() {
    const now = new Date();
    currentDate = formatDate(now);
    currentTime = formatTime(now);

    updateControlDisplays();

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
    // Date modal
    const dateModal = document.getElementById('date-modal');
    const datePicker = document.getElementById('date-picker');
    const dateConfirm = document.getElementById('date-confirm');
    const dateCancel = document.getElementById('date-cancel');

    datePicker.value = currentDate;

    dateConfirm.addEventListener('click', () => {
        currentDate = datePicker.value;
        updateControlDisplays();
        closeModal('date-modal');
        loadFeed();
    });

    dateCancel.addEventListener('click', () => closeModal('date-modal'));

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
    [dateModal, timeModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Modal utilities
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');

    // Set current values
    if (modalId === 'date-modal') {
        document.getElementById('date-picker').value = currentDate;
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
            lat: DEFAULT_LOCATION.lat,
            lng: DEFAULT_LOCATION.lng,
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
