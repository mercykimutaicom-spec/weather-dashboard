/* ========================================
   VERDANT WEATHER DASHBOARD
   OpenWeatherMap API Integration
======================================== */

// 1. API CONFIGURATION

const API_KEY = window.OPENWEATHER_API_KEY;

// 2. HTML ELEMENT REFERENCES

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-search");
const searchButton = document.getElementById("search-button");
const searchError = document.getElementById("search-error");
const locationButton = document.getElementById("location-button");

const currentCity = document.getElementById("current-city");
const currentDate = document.getElementById("current-date");
const weatherStatus = document.getElementById("weather-status");

const weatherIcon = document.getElementById("weather-icon");
const currentTemp = document.getElementById("current-temp");
const weatherDescription = document.getElementById("weather-description");
const feelsLike = document.getElementById("feels-like");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");

// 3. SEARCH FORM EVENT

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    searchError.textContent = "Please enter a city name.";
    return;
  }

  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    searchError.textContent = "Please configure your weather API key.";
    return;
  }

  searchError.textContent = "";

  try {
    searchButton.disabled = true;
    searchButton.textContent = "Loading...";
    weatherStatus.textContent = "Fetching weather data...";

    await getWeather(city);

    // Save the city to recent searches after successful weather fetch
    saveRecentCity(city);
  } catch (error) {
    searchError.textContent = error.message;
    weatherStatus.textContent = "Unable to load weather";
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
});

// 5. RECENT SEARCHES MANAGEMENT

/**
 * Load recent cities from localStorage.
 * Returns an array of city names, or an empty array if data is invalid.
 */
function loadRecentCities() {
  try {
    const stored = localStorage.getItem("verdant-recent-cities");
    if (!stored) {
      return [];
    }
    const cities = JSON.parse(stored);

    // Validate that the stored data is an array of strings
    if (!Array.isArray(cities)) {
      return [];
    }

    const uniqueCities = [];
    const seenCities = new Set();

    for (const city of cities) {
      if (typeof city !== "string") {
        continue;
      }

      const cityName = city.trim();
      const normalizedCity = cityName.toLowerCase();

      if (!cityName || seenCities.has(normalizedCity)) {
        continue;
      }

      seenCities.add(normalizedCity);
      uniqueCities.push(cityName);

      if (uniqueCities.length === 5) {
        break;
      }
    }

    return uniqueCities;
  } catch (error) {
    // If localStorage data is corrupted or unparseable, return empty array
    console.warn("Failed to load recent cities from localStorage", error);
    return [];
  }
}

/**
 * Save a city to recent searches in localStorage.
 * Prevents duplicate entries (case-insensitive).
 * Keeps maximum of 5 cities, with most recent first.
 * @param {string} city - The city name to save
 */
function saveRecentCity(city) {
  const cities = loadRecentCities();

  // Normalize for case-insensitive comparison
  const cityName = city.trim();
  if (!cityName) {
    return;
  }

  const normalizedCity = cityName.toLowerCase();
  const existingCity = cities.find(
    (savedCity) => savedCity.toLowerCase() === normalizedCity,
  );
  const updatedCities = [
    existingCity || cityName,
    ...cities.filter((savedCity) => savedCity.toLowerCase() !== normalizedCity),
  ].slice(0, 5);

  saveCitiesToStorage(updatedCities);
  renderRecentCities();
}

/**
 * Save cities array to localStorage.
 * @param {string[]} cities - Array of city names
 */
function saveCitiesToStorage(cities) {
  try {
    localStorage.setItem("verdant-recent-cities", JSON.stringify(cities));
  } catch (error) {
    console.warn("Failed to save recent cities to localStorage", error);
  }
}

/**
 * Render recent cities in the #recent-cities list.
 * Supports keyboard accessibility (Enter/Space) via role="button" and tabindex.
 */
function renderRecentCities() {
  const recentCitiesList = document.getElementById("recent-cities");

  if (!recentCitiesList) {
    return;
  }

  recentCitiesList.replaceChildren();
  const cities = loadRecentCities();

  if (cities.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-history";
    emptyItem.textContent = "Your recent cities will appear here.";
    recentCitiesList.appendChild(emptyItem);
    return;
  }

  // Render each city (most recent first)
  cities.forEach((city) => {
    const listItem = document.createElement("li");
    listItem.role = "button";
    listItem.tabIndex = 0;
    listItem.textContent = city;

    // Click event - search for this city
    listItem.addEventListener("click", () => {
      searchCity(city);
    });

    // Keyboard accessibility: Enter and Space
    listItem.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        searchCity(city);
      }
    });

    recentCitiesList.appendChild(listItem);
  });
}

/**
 * Search for a city's weather by triggering the search mechanism.
 * @param {string} city - The city name to search for
 */
function searchCity(city) {
  // Set the input value and dispatch submit event
  cityInput.value = city;
  searchForm.dispatchEvent(new Event("submit", { bubbles: true }));
}

// Initialize recent searches when dashboard loads
renderRecentCities();

// 4. GET CITY COORDINATES

async function getWeather(city) {
  // 1. Find the city's geographical coordinates
  const geocodingURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;

  const locationResponse = await fetch(geocodingURL);
  const locations = await locationResponse.json();

  // 2. Identify geocoding errors correctly
  if (!locationResponse.ok) {
    if (locationResponse.status === 401) {
      throw new Error(
        "Invalid or inactive API key. Check your OpenWeatherMap account.",
      );
    }

    if (locationResponse.status === 429) {
      throw new Error("Too many requests. Please wait before trying again.");
    }

    throw new Error(
      `Location request failed: ${locations.message || locationResponse.status}`,
    );
  }

  // 3. Check whether the city exists
  if (!locations || locations.length === 0) {
    throw new Error("City not found. Try entering Nairobi,KE.");
  }

  const latitude = locations[0].lat;
  const longitude = locations[0].lon;

  const cityName = locations[0].name;
  const country = locations[0].country;

  // 4. Fetch current weather
  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;

  const weatherResponse = await fetch(weatherURL);
  const weatherData = await weatherResponse.json();

  // 5. Handle weather API errors
  if (!weatherResponse.ok) {
    if (weatherResponse.status === 401) {
      throw new Error("Your API key is invalid or inactive.");
    }

    if (weatherResponse.status === 429) {
      throw new Error("Weather API request limit exceeded.");
    }

    throw new Error(
      weatherData.message || "Unable to retrieve weather information.",
    );
  }

  // 6. Update city information
  currentCity.textContent = `${cityName}, ${country}`;

  currentDate.textContent = new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // 7. Update temperature and conditions
  currentTemp.textContent = `${Math.round(weatherData.main.temp)}°`;

  weatherDescription.textContent = weatherData.weather[0].description;

  feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°`;

  // 8. Update humidity and wind
  humidity.textContent = `${weatherData.main.humidity}%`;

  windSpeed.textContent = `${(weatherData.wind.speed * 3.6).toFixed(1)} km/h`;

  // 9. Update weather icon
  const iconCode = weatherData.weather[0].icon;

  const iconImage = document.createElement("img");

  iconImage.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  iconImage.alt = weatherData.weather[0].description;
  iconImage.width = 100;
  iconImage.height = 100;

  weatherIcon.replaceChildren(iconImage);

  // 10. Update status
  weatherStatus.textContent = "Weather updated successfully";
}
// 11. GET WEATHER USING CURRENT LOCATION

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    searchError.textContent =
      "Your browser does not support location services.";
    return;
  }

  searchError.textContent = "";
  weatherStatus.textContent = "Getting your current location...";

  locationButton.disabled = true;
  locationButton.textContent = "Getting location...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;

        const response = await fetch(weatherURL);
        const weatherData = await response.json();

        if (!response.ok) {
          throw new Error(
            weatherData.message || "Unable to retrieve your local weather.",
          );
        }

        // Display the current location's weather
        currentCity.textContent = `${weatherData.name}, ${weatherData.sys.country}`;

        currentDate.textContent = new Date().toLocaleDateString("en-KE", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        currentTemp.textContent = `${Math.round(weatherData.main.temp)}°`;

        weatherDescription.textContent = weatherData.weather[0].description;

        feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°`;

        humidity.textContent = `${weatherData.main.humidity}%`;

        windSpeed.textContent = `${(weatherData.wind.speed * 3.6).toFixed(1)} km/h`;

        const iconCode = weatherData.weather[0].icon;
        const iconImage = document.createElement("img");

        iconImage.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        iconImage.alt = weatherData.weather[0].description;
        iconImage.width = 100;
        iconImage.height = 100;

        weatherIcon.replaceChildren(iconImage);

        weatherStatus.textContent =
          "Weather updated using your current location.";
      } catch (error) {
        searchError.textContent = error.message;
        weatherStatus.textContent = "Unable to load local weather.";
      } finally {
        locationButton.disabled = false;
        locationButton.textContent = "Use My Current Location";
      }
    },

    (error) => {
      if (error.code === 1) {
        searchError.textContent =
          "Location permission denied. Please allow location access in your browser.";
      } else if (error.code === 2) {
        searchError.textContent =
          "Your current location could not be determined.";
      } else if (error.code === 3) {
        searchError.textContent =
          "Location request timed out. Please try again.";
      } else {
        searchError.textContent =
          "Something went wrong while accessing your location.";
      }

      weatherStatus.textContent = "Location unavailable.";

      locationButton.disabled = false;
      locationButton.textContent = "Use My Current Location";
    },

    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 600000,
    },
  );
});
