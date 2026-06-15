document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const errorMessage = document.getElementById('error-message');
    const loadingState = document.getElementById('loading-state');
    const weatherContent = document.getElementById('weather-content');
    
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
    // Search & UI State Management
    // ==========================================
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const city = cityInput.value.trim();
        if (!city) return;

        // Hide error if it was showing
        hideError();
        
        // Show loading state
        showLoading();

        // Simulate an API call with setTimeout
        // In a real app, you would fetch() data here
        setTimeout(() => {
            // Mock condition: If user types "error", show error state
            if (city.toLowerCase() === 'error') {
                showError('City not found. Please try again.');
                hideLoading();
                return;
            }

            // Mock Data Update
            const weatherConditions = ['Sunny', 'Partly Cloudy', 'Rainy', 'Cloudy'];
            const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
            
            updateWeatherUI({
                city: formatCityName(city),
                temp: Math.floor(Math.random() * 20) + 10, // Random temp between 10-30
                condition: randomCondition,
                humidity: Math.floor(Math.random() * 40) + 40 + '%', // 40-80%
                windSpeed: Math.floor(Math.random() * 20) + 5 + ' km/h'
            });

            hideLoading();
            cityInput.value = ''; // Clear input
            cityInput.blur(); // Remove focus
            
        }, 1500); // 1.5s simulated delay
    });

    // Helpers
    function showLoading() {
        weatherContent.classList.add('hide');
        loadingState.classList.add('show');
    }

    function hideLoading() {
        loadingState.classList.remove('show');
        weatherContent.classList.remove('hide');
        // Small delay to allow CSS transitions to catch up if needed
        setTimeout(() => {
            weatherContent.style.opacity = '1';
        }, 50);
    }

    function showError(msg) {
        errorMessage.querySelector('span').textContent = msg;
        errorMessage.classList.add('show');
        // Hide weather content if we want a pure error state, 
        // but often it's better to keep the old data visible.
    }

    function hideError() {
        errorMessage.classList.remove('show');
    }

    function formatCityName(name) {
        return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
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
});
