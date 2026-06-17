document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const errorMessage = document.getElementById('error-message');
    const weatherContent = document.getElementById('weather-content');
    const suggestionsList = document.getElementById('search-suggestions');
    const searchBtn = document.querySelector('.search-btn');
    const loadingState = document.getElementById('loading-state');
    const recentSearchesContainer = document.getElementById('recent-searches');
    const forecastContainer = document.getElementById('forecast-container');
    
    // Weather Elements
    const cityNameEl = document.getElementById('city-name');
    const dateEl = document.getElementById('date');
    const tempEl = document.getElementById('temperature');
    const conditionEl = document.getElementById('weather-condition');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    
    // Realistic Weather Visual Elements
    const realisticSun = document.getElementById('realistic-sun');
    const rainContainer = document.getElementById('rain-container');
    const realisticCloud = document.getElementById('realistic-cloud');
    const bgEffectsContainer = document.getElementById('weather-background-effects');
    
    const highestCityEl = document.getElementById('highest-city');
    const highestTempEl = document.getElementById('highest-temp');
    const lowestCityEl = document.getElementById('lowest-city');
    const lowestTempEl = document.getElementById('lowest-temp');

    // Theme logic removed - App is permanently dark mode

    // ==========================================
    // Date Formatting
    // ==========================================
    function updateDate() {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const today = new Date();
        dateEl.textContent = today.toLocaleDateString('en-US', options);
    }
    
    updateDate();

    // ==========================================
    // Search & API Integration (Autocomplete)
    // ==========================================
    
    let debounceTimer;

    // Listen for user typing to show suggestions
    cityInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(debounceTimer);
        
        if (query.length < 2) {
            suggestionsList.classList.remove('show');
            return;
        }

        // Debounce to avoid hitting the API on every single keystroke
        debounceTimer = setTimeout(() => {
            fetchSuggestions(query);
        }, 300);
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const city = cityInput.value.trim();
        if (!city) return;

        hideError();
        await fetchWeatherData(city);

        cityInput.value = ''; // Clear the input field
        cityInput.blur(); // Remove focus from the input
    });

    // Fetch city suggestions from the Geocoding API
    async function fetchSuggestions(query) {
        try {
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                renderSuggestions(data.results);
            } else {
                suggestionsList.classList.remove('show');
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    // Display the suggestions in the dropdown
    function renderSuggestions(results) {
        suggestionsList.innerHTML = ''; // Clear previous suggestions
        
        results.forEach(result => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            
            // Container for icon and city name
            const cityContainer = document.createElement('div');
            cityContainer.className = 'suggestion-city-container';
            
            const pinIcon = document.createElement('i');
            pinIcon.className = 'ph-fill ph-map-pin suggestion-icon';
            
            const cityName = document.createElement('span');
            cityName.className = 'suggestion-city';
            cityName.textContent = result.name;
            
            cityContainer.appendChild(pinIcon);
            cityContainer.appendChild(cityName);
            
            const details = document.createElement('span');
            details.className = 'suggestion-details';
            
            // Build the subtitle (e.g. "California, United States")
            const parts = [];
            if (result.admin1) parts.push(result.admin1);
            if (result.country) parts.push(result.country);
            details.textContent = parts.join(', ');

            li.appendChild(cityContainer);
            li.appendChild(details);

            // Handle clicking on a suggestion
            li.addEventListener('click', () => {
                cityInput.value = result.name;
                suggestionsList.classList.remove('show');
                hideError();
                fetchWeatherData(result.name); // Fetch weather immediately
            });

            suggestionsList.appendChild(li);
        });

        suggestionsList.classList.add('show');
    }

    // Hide suggestions if the user clicks outside the dropdown
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.remove('show');
        }
    });

    // Handle manual form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const city = cityInput.value.trim();
        if (!city) return;

        // Hide any previous error message before starting the new search
        hideError();
        
        // Fetch real-time data from the API
        await fetchWeatherData(city);

        cityInput.value = ''; // Clear the input field
        cityInput.blur(); // Remove focus from the input
    });

    /**
     * Fetches weather data from the Open-Meteo API using the Fetch API.
     * The Fetch API allows us to make network requests asynchronously to external servers.
     * We use `async/await` to pause execution until the server responds, avoiding nested callbacks.
     */
    // Fetch the actual weather data
    async function fetchWeatherData(city) {
        // Feature: Check for internet connection before attempting fetch
        if (!navigator.onLine) {
            showError('No internet connection. Please check your network.');
            return;
        }

        try {
            // Activate loading state before starting the network request
            showLoading();

            const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
            
            // Feature: Ensure API request was successful
            if (!geoResponse.ok) throw new Error('Failed to reach geocoding service');

            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                hideLoading(false); // Hide loading, but do not show weather content
                showError('City not found. Please try again.');
                return;
            }

            const location = geoData.results[0];
            const lat = location.latitude;
            const lon = location.longitude;
            const cityName = location.name;

            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max&timezone=auto`);
            
            if (!weatherResponse.ok) throw new Error('Failed to reach weather service');

            const weatherData = await weatherResponse.json();
            const current = weatherData.current;

            const conditionString = mapWeatherCodeToCondition(current.weather_code);

            updateWeatherUI({
                city: cityName,
                temp: Math.round(current.temperature_2m),
                condition: conditionString,
                humidity: current.relative_humidity_2m + '%',
                windSpeed: current.wind_speed_10m + ' km/h'
            });

            // Feature: Successful fetch - turn off loading and display the weather card
            hideLoading(true);
            
            // Render 5-Day Forecast
            if (weatherData.daily) {
                renderForecast(weatherData.daily);
            }
            
            // Save to recent searches
            saveRecentSearch(cityName);

        } catch (error) {
            console.error('Error fetching weather data:', error);
            hideLoading(false);
            showError('Failed to fetch weather data. Please try again.');
        }
    }

    /**
     * Helper function to map Open-Meteo's WMO weather codes to our visual conditions.
     */
    function mapWeatherCodeToCondition(code) {
        if (code === 0) return 'Sunny';
        if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
        if (code >= 51 && code <= 67) return 'Rainy'; // Drizzle and Rain
        if (code >= 80 && code <= 82) return 'Rainy'; // Rain showers
        if (code >= 95) return 'Rainy'; // Thunderstorms
        return 'Cloudy'; // Fallback
    }

    function mapWeatherCodeToIcon(code) {
        if (code === 0) return 'ph-sun';
        if (code === 1 || code === 2 || code === 3) return 'ph-cloud-sun';
        if (code >= 51 && code <= 67) return 'ph-cloud-rain';
        if (code >= 80 && code <= 82) return 'ph-cloud-showers-heavy';
        if (code >= 95) return 'ph-cloud-lightning';
        return 'ph-cloud';
    }

    function renderForecast(daily) {
        if (!forecastContainer) return;
        forecastContainer.innerHTML = '';

        // We want the next 5 days, starting from tomorrow (index 1)
        for (let i = 1; i <= 5; i++) {
            if (!daily.time[i]) break;

            const dateStr = daily.time[i];
            const dateObj = new Date(dateStr);
            // Use UTC to prevent timezone shifting the day name backward
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
            
            const tempMax = Math.round(daily.temperature_2m_max[i]);
            const condition = mapWeatherCodeToCondition(daily.weather_code[i]);
            const iconClass = mapWeatherCodeToIcon(daily.weather_code[i]);

            const card = document.createElement('div');
            card.className = 'forecast-card';
            
            card.innerHTML = `
                <span class="forecast-day">${dayName}</span>
                <i class="ph-fill ${iconClass} forecast-icon"></i>
                <span class="forecast-temp">${tempMax}°</span>
                <span class="forecast-condition">${condition}</span>
            `;
            
            forecastContainer.appendChild(card);
        }
    }

    // ==========================================
    // UI Helpers (Loading & Error States)
    // ==========================================
    
    function showLoading() {
        weatherContent.classList.add('hide');
        errorMessage.classList.remove('show');
        loadingState.classList.add('show');
        searchBtn.disabled = true;
        searchBtn.textContent = '...';
    }

    function hideLoading(success = false) {
        loadingState.classList.remove('show');
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
        if (success) {
            weatherContent.classList.remove('hide');
        }
    }

    function showError(msg) {
        errorMessage.querySelector('span').textContent = msg;
        errorMessage.classList.add('show');
        weatherContent.classList.add('hide'); // Ensure previous weather is hidden on error
    }

    function hideError() {
        errorMessage.classList.remove('show');
    }

    function updateWeatherUI(data) {
        cityNameEl.textContent = data.city;
        tempEl.textContent = data.temp;
        conditionEl.textContent = data.condition;
        humidityEl.textContent = data.humidity;
        windSpeedEl.textContent = data.windSpeed;
        
        // Update Realistic Weather Visual based on condition
        const condition = data.condition.toLowerCase();
        
        // Update Dynamic Background
        document.body.setAttribute('data-weather', condition.replace(' ', '-'));
        
        // Reset state (Sun behind cloud)
        realisticSun.style.opacity = '1';
        rainContainer.classList.remove('show');
        realisticCloud.style.opacity = '1';
        realisticSun.style.top = '5px';
        realisticSun.style.right = '25px';

        if (condition === 'sunny' || condition === 'clear') {
            realisticCloud.style.opacity = '0'; // Hide cloud for pure sunny
            realisticSun.style.top = '40px'; // Move sun to center
            realisticSun.style.right = '60px';
        } 
        else if (condition === 'rainy') {
            realisticSun.style.opacity = '0'; // Hide sun while raining
            rainContainer.classList.add('show');
        }
        
        // Update background full-screen effects
        updateBackgroundEffects(condition);
    }

    // ==========================================
    // Full Screen Background Effects
    // ==========================================
    function updateBackgroundEffects(condition) {
        // Clear previous effects
        bgEffectsContainer.innerHTML = '';
        
        if (condition === 'rainy') {
            // Spawn Rain
            const dropCount = 60;
            for (let i = 0; i < dropCount; i++) {
                const drop = document.createElement('div');
                drop.classList.add('bg-rain-drop');
                drop.style.left = `${Math.random() * 100}vw`;
                drop.style.top = `${Math.random() * -20}vh`;
                drop.style.animationDuration = `${Math.random() * 1 + 0.5}s`;
                drop.style.animationDelay = `${Math.random() * 2}s`;
                bgEffectsContainer.appendChild(drop);
            }
        } 
        else if (condition === 'sunny' || condition === 'clear') {
            // Spawn Sun Flares / Dust motes
            const flareCount = 20;
            for (let i = 0; i < flareCount; i++) {
                const flare = document.createElement('div');
                flare.classList.add('bg-sun-flare');
                const size = Math.random() * 150 + 50; // 50px to 200px
                flare.style.width = `${size}px`;
                flare.style.height = `${size}px`;
                flare.style.left = `${Math.random() * 100}vw`;
                flare.style.top = `${Math.random() * 100}vh`;
                flare.style.animationDuration = `${Math.random() * 5 + 4}s`; // 4s to 9s
                flare.style.animationDelay = `${Math.random() * 2}s`;
                bgEffectsContainer.appendChild(flare);
            }
        }
        else if (condition.includes('cloudy')) {
            // Spawn drifting Fog/Clouds
            const cloudCount = 10;
            for (let i = 0; i < cloudCount; i++) {
                const cloud = document.createElement('div');
                cloud.classList.add('bg-cloud-particle');
                const size = Math.random() * 400 + 400; // 400px to 800px
                cloud.style.width = `${size}px`;
                cloud.style.height = `${size}px`;
                cloud.style.top = `${Math.random() * 60 - 20}vh`; // Top 40% mostly
                cloud.style.animationDuration = `${Math.random() * 30 + 30}s`; // 30s to 60s
                cloud.style.animationDelay = `${Math.random() * -30}s`; // Start at random progress
                bgEffectsContainer.appendChild(cloud);
            }
        }
    }

    // ==========================================
    // Fetch Global Extremes on load
    // ==========================================
    async function fetchGlobalExtremes() {
        // Pre-defined set of globally extreme cities to check
        const globalCities = [
            { name: 'Death Valley', lat: 36.46, lon: -116.86 },
            { name: 'Khartoum', lat: 15.50, lon: 32.55 },
            { name: 'Dubai', lat: 25.20, lon: 55.27 },
            { name: 'Yakutsk', lat: 62.02, lon: 129.73 },
            { name: 'Oymyakon', lat: 63.46, lon: 142.78 },
            { name: 'Vostok Station', lat: -78.46, lon: 106.83 }
        ];

        try {
            // Join all lats and lons to do a batch request
            const lats = globalCities.map(c => c.lat).join(',');
            const lons = globalCities.map(c => c.lon).join(',');
            
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m`);
            const data = await response.json();
            
            let maxTemp = -Infinity;
            let minTemp = Infinity;
            let hottestCity = '';
            let coldestCity = '';

            // data is an array since we requested multiple coordinates
            data.forEach((loc, index) => {
                const temp = loc.current.temperature_2m;
                if (temp > maxTemp) {
                    maxTemp = temp;
                    hottestCity = globalCities[index].name;
                }
                if (temp < minTemp) {
                    minTemp = temp;
                    coldestCity = globalCities[index].name;
                }
            });

            highestCityEl.textContent = hottestCity;
            highestTempEl.textContent = `${Math.round(maxTemp)}°C`;
            
            lowestCityEl.textContent = coldestCity;
            lowestTempEl.textContent = `${Math.round(minTemp)}°C`;

        } catch (error) {
            console.error('Failed to fetch global extremes:', error);
            highestCityEl.textContent = 'Unavailable';
            lowestCityEl.textContent = 'Unavailable';
        }
    }

    // ==========================================
    // Network Status Listeners
    // ==========================================
    window.addEventListener('offline', () => {
        showError('You are currently offline. Please check your network connection.');
    });

    window.addEventListener('online', () => {
        // If an offline error was shown, clear it when connection is restored
        if (errorMessage.classList.contains('show') && errorMessage.innerText.includes('offline')) {
            hideError();
        }
    });

    // ==========================================
    // Recent Searches (localStorage)
    // ==========================================
    const MAX_RECENT_SEARCHES = 5;

    function getRecentSearches() {
        const searches = localStorage.getItem('recentSearches');
        return searches ? JSON.parse(searches) : [];
    }

    function saveRecentSearch(city) {
        let searches = getRecentSearches();
        
        // Remove duplicate if exists
        searches = searches.filter(s => s.toLowerCase() !== city.toLowerCase());
        
        // Add to beginning
        searches.unshift(city);
        
        // Limit to MAX_RECENT_SEARCHES
        if (searches.length > MAX_RECENT_SEARCHES) {
            searches.pop();
        }
        
        localStorage.setItem('recentSearches', JSON.stringify(searches));
        renderRecentSearches();
    }

    function renderRecentSearches() {
        if (!recentSearchesContainer) return;
        
        const searches = getRecentSearches();
        recentSearchesContainer.innerHTML = '';
        
        if (searches.length > 0) {
            searches.forEach(city => {
                const span = document.createElement('span');
                span.className = 'recent-search-item';
                span.innerHTML = `<i class="ph ph-clock-counter-clockwise"></i> ${city}`;
                span.addEventListener('click', () => {
                    cityInput.value = city;
                    suggestionsList.classList.remove('show');
                    hideError();
                    fetchWeatherData(city);
                });
                recentSearchesContainer.appendChild(span);
            });
        }
    }

    // Initialize
    renderRecentSearches();
    fetchGlobalExtremes();
});
