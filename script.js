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

// API Configuration
const BARD_API_KEY = "AIzaSyADCzbIQeAorP8dOZHHfDN62TrF_BmH75U"; // Your API key

// Available model versions to try
const modelVersions = [
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro"
];

// Keep track of clicks to increase variety
let clickCounter = 0;

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
        moodCard.addEventListener('click', (event) => handleMoodSelect(mood, event));
        moodGrid.appendChild(moodCard);
    });
}

// Handle mood selection
function handleMoodSelect(selectedMood, event) {
    // Increment click counter for variability
    clickCounter++;
    
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
    
    // Hide any previous warning
    document.getElementById('apiWarning').classList.remove('show');
    
    // Get movies based on mood
    fetchMoviesWithFallback(selectedMood.name);
}

// Try different model versions if one fails
async function fetchMoviesWithFallback(mood) {
    for (const model of modelVersions) {
        try {
            const movieData = await tryFetchMoviesFromModel(mood, model);
            if (movieData) {
                // Success! Hide loading spinner and show results
                loadingSpinner.classList.add('hidden');
                movieGrid.classList.remove('hidden');
                
                // Display movies
                displayMovies(movieData);
                return; // Exit the function on success
            }
        } catch (error) {
            console.log(`Failed with model ${model}:`, error);
            // Continue to next model if this one fails
        }
    }
    
    // If we get here, all models failed
    handleMovieFetchError(new Error("All Gemini model versions failed. Please check your API key and permissions."));
}

// Fetch movie recommendations from a specific Gemini model
async function tryFetchMoviesFromModel(mood, modelVersion) {
    const BARD_API_URL = `https://generativelanguage.googleapis.com/v1/models/${modelVersion}:generateContent`;
    
    // Add variety by including different modifiers based on click count
    const varietyModifiers = [
        "that are not too well-known",
        "that are classics",
        "from the last decade",
        "that are critically acclaimed",
        "that are underrated gems",
        "from different countries",
        "with surprising twists",
        "with great soundtracks"
    ];
    
    // Choose a modifier based on click count
    const modifier = varietyModifiers[clickCounter % varietyModifiers.length];
    
    const prompt = `Recommend 4 different movies for someone in a ${mood} mood ${modifier}. Return the response in JSON format with an array of objects. Each object should have these fields: title (string), year (number), description (short string, max 100 chars), and rating (number between 1-10). Only return the JSON with no other text.`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.9, // Higher temperature for more variety
            seed: Date.now() % 1000000 // Random seed for each request
        }
    };

    const response = await fetch(`${BARD_API_URL}?key=${BARD_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || `Error fetching from ${modelVersion}`);
    }

    // Extract text response from API
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Parse JSON from response
    return parseMovieData(textResponse);
}

// Parse movie data from API response
function parseMovieData(textResponse) {
    try {
        // Extract JSON - the response might include markdown code blocks or extra text
        const jsonMatch = textResponse.match(/```json\s*(\[[\s\S]*?\])\s*```/) || 
                          textResponse.match(/(\[[\s\S]*?\])/) ||
                          textResponse.match(/({[\s\S]*?})/);
                         
        let movieData;
        if (jsonMatch && jsonMatch[1]) {
            movieData = JSON.parse(jsonMatch[1]);
        } else {
            // Try parsing the whole response as JSON
            movieData = JSON.parse(textResponse);
        }
        
        // Handle different possible structures
        if (Array.isArray(movieData)) {
            // It's already an array of movies
        } else if (movieData.movies && Array.isArray(movieData.movies)) {
            movieData = movieData.movies;
        } else {
            // If it's a single movie object, wrap in array
            movieData = [movieData];
        }
        
        return movieData;
    } catch (parseError) {
        console.error("Failed to parse JSON from API response:", parseError);
        console.log("Raw response:", textResponse);
        throw new Error("Could not parse movie recommendations");
    }
}

// Handle errors in movie fetching
function handleMovieFetchError(error) {
    console.error('Error fetching movies:', error);
    loadingSpinner.classList.add('hidden');
    movieGrid.innerHTML = `
        <div class="error-message">
            <p><strong>Error:</strong> ${error.message}</p>
            <p class="error-hint">Make sure you've added your Gemini API key in the script.js file and that you have access to the Gemini API.</p>
            <p class="error-hint">Try again later or check the console for more details.</p>
        </div>`;
    movieGrid.classList.remove('hidden');
    
    // Show API warning
    document.getElementById('apiWarning').classList.add('show');
}

// Display movies from API data
function displayMovies(movies) {
    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = `<div class="movie-card empty">No movie recommendations found for this mood.</div>`;
        return;
    }

    movieGrid.innerHTML = '';
    
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        
        // Generate a placeholder image based on movie title (for visual variety)
        const colorHue = Math.floor(hashCode(movie.title) % 360);
        const posterUrl = `https://via.placeholder.com/300x450/${hslToHex(colorHue, 70, 80)}/333333?text=${encodeURIComponent(movie.title)}`;
            
        movieCard.innerHTML = `
            <div class="movie-poster-container">
                <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
                ${movie.year ? `<span class="movie-year">${movie.year}</span>` : ''}
            </div>
            <h3 class="movie-title">${movie.title}</h3>
            ${movie.rating ? `<p class="movie-rating">⭐ ${parseFloat(movie.rating).toFixed(1)}</p>` : ''}
            ${movie.description ? `<p class="movie-description">${movie.description}</p>` : ''}
        `;
        
        movieGrid.appendChild(movieCard);
    });
}

// Helper function to generate consistent hash code from string
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Helper function to convert HSL to HEX color
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `${f(0)}${f(8)}${f(4)}`;
}

// Initialize app
function init() {
    createMoodCards();
    
    // Check if API key is set
    if (BARD_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        document.getElementById('apiWarning').classList.add('show');
        console.warn("Don't forget to add your Gemini API key in the script.js file!");
    }
}

// Start the app
init();