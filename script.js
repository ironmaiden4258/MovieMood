// Mood data configuration
const moods = [
    { icon: 'fa-solid fa-shield', name: 'Crime', color: 'crime' },
    { icon: 'fa-solid fa-heart', name: 'Romantic', color: 'romantic' },
    { icon: 'fa-solid fa-bolt', name: 'Excited', color: 'excited' },
    { icon: 'fa-solid fa-cloud', name: 'Sad', color: 'sad' },
    { icon: 'fa-solid fa-moon', name: 'Relaxed', color: 'relaxed' },
    { icon: 'fa-solid fa-trophy', name: 'Sports', color: 'sports' },
    { icon: 'fa-solid fa-skull', name: 'Horror', color: 'horror' },
    { icon: 'fa-solid fa-bullseye', name: 'Thriller', color: 'thriller' }
];

// DOM Elements
const moodGrid = document.getElementById('moodGrid');
const movieSection = document.getElementById('movieSection');
const selectedMoodSpan = document.getElementById('selectedMood');
const loadingSpinner = document.getElementById('loadingSpinner');
const movieGrid = document.getElementById('movieGrid');

// Create mood cards
function createMoodCards() {
    moods.forEach(mood => {
        const moodCard = document.createElement('button');
        moodCard.className = `mood-card ${mood.color}`;
        moodCard.innerHTML = `
            <i class="${mood.icon}"></i>
            <span>${mood.name}</span>
        `;
        moodCard.addEventListener('click', () => handleMoodSelect(mood));
        moodGrid.appendChild(moodCard);
    });
}

// Handle mood selection
function handleMoodSelect(selectedMood) {
    // Remove previous selection
    const allMoodCards = document.querySelectorAll('.mood-card');
    allMoodCards.forEach(card => card.classList.remove('selected'));

    // Add selection to clicked card
    event.currentTarget.classList.add('selected');

    // Update UI
    movieSection.classList.remove('hidden');
    selectedMoodSpan.textContent = selectedMood.name;

    // Show loading state
    loadingSpinner.classList.remove('hidden');
    movieGrid.classList.add('hidden');

    // Simulate API call
    setTimeout(() => {
        loadingSpinner.classList.add('hidden');
        movieGrid.classList.remove('hidden');
        displayMovies();
    }, 1000);
}

// Display movie placeholders
function displayMovies() {
    movieGrid.innerHTML = `
        <div class="movie-card">
            Movies will appear here
        </div>
        <div class="movie-card">
            Movies will appear here
        </div>
    `;
}

// Initialize app
function init() {
    createMoodCards();
}

// Start the app
init();