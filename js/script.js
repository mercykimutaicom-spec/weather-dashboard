/* ========================================
   SKYVIEW WEATHER DASHBOARD
   OpenWeatherMap API Integration
======================================== */

// 1. API CONFIGURATION

const WEATHER_API_BASE = "https://skyview-weather-proxy.mercykimutai-com.workers.dev";

// 2. HTML ELEMENT REFERENCES

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-search");
const searchButton = document.getElementById("search-button");
const searchError = document.getElementById("search-error");
const locationButton = document.getElementById("location-button");

const currentCity = document.getElementById("current-city");
const currentDate = document.getElementById("current-date");
const weatherStatus = document.getElementById("weather-status");

const weatherOverview = document.querySelector(".weather-overview");
const weatherIcon = document.getElementById("weather-icon");
const currentTemp = document.getElementById("current-temp");
const weatherDescription = document.getElementById("weather-description");
const feelsLike = document.getElementById("feels-like");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const visibility = document.getElementById("visibility");
const pressure = document.getElementById("pressure");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const forecastList = document.getElementById("forecast-list");
const forecastStatus = document.getElementById("forecast-status");
let forecastRequestId = 0;
let lastForecastCoordinates = null;
let searchRequestActive = false;

class WeatherRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "WeatherRequestError";
  }
}

function getApiErrorMessage(status, requestType) {
  if (status === 400) {
    if (requestType === "geocoding") {
      return "Please check the city name and try again.";
    }

    return "The weather service couldn't process this request. Please try again.";
  }

  if (status === 401) {
    return "The weather service couldn't verify its API credentials. The dashboard's API configuration may need attention.";
  }

  if (status === 404) {
    if (requestType === "geocoding") {
      return "We couldn't find that city. Check the spelling and try again.";
    }

    if (requestType === "forecast") {
      return "Forecast data isn't available for this location right now.";
    }

    return "Weather data isn't available for this location right now.";
  }

  if (status === 429) {
    return "The weather service is busy. Please wait a moment and try again.";
  }

  if ([500, 502, 503].includes(status)) {
    return "The weather service is temporarily unavailable. Please try again shortly.";
  }

  return "We couldn't retrieve weather information. Please try again.";
}

async function fetchWeatherData(url, requestType) {
  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new WeatherRequestError(
      "We couldn't connect to the weather service. Check your internet connection and try again.",
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new WeatherRequestError(
      "The weather service returned an unreadable response. Please try again.",
    );
  }

  if (!response.ok) {
    throw new WeatherRequestError(
      getApiErrorMessage(response.status, requestType),
    );
  }

  return data;
}

function validateCurrentWeather(data, requireLocationName = false) {
  if (
    !data ||
    !data.main ||
    !Number.isFinite(data.main.temp) ||
    !Number.isFinite(data.main.feels_like) ||
    !Number.isFinite(data.main.humidity) ||
    !Array.isArray(data.weather) ||
    !data.weather[0] ||
    typeof data.weather[0].description !== "string" ||
    typeof data.weather[0].icon !== "string" ||
    !data.wind ||
    !Number.isFinite(data.wind.speed) ||
    (requireLocationName &&
      (!data.name || !data.sys || typeof data.sys.country !== "string"))
  ) {
    throw new WeatherRequestError(
      "Weather data was incomplete. Please try again.",
    );
  }
}

function getFriendlyErrorMessage(error, fallback) {
  return error instanceof WeatherRequestError ? error.message : fallback;
} // Apply a visual theme based on the current weather condition
function updateWeatherTheme(data) {
  const conditionCode = data.weather[0].id;
  const iconCode = data.weather[0].icon;

  let condition = "clouds";

  if (conditionCode >= 200 && conditionCode < 300) {
    condition = "thunderstorm";
  } else if (conditionCode >= 300 && conditionCode < 600) {
    condition = "rain";
  } else if (conditionCode >= 600 && conditionCode < 700) {
    condition = "snow";
  } else if (conditionCode >= 700 && conditionCode < 800) {
    condition = "atmosphere";
  } else if (conditionCode === 800) {
    condition = "clear";
  } else if (conditionCode > 800 && conditionCode < 900) {
    condition = "clouds";
  }

  // Remove the previous weather theme
  weatherOverview.classList.remove(
    "weather-clear",
    "weather-clouds",
    "weather-rain",
    "weather-snow",
    "weather-thunderstorm",
    "weather-atmosphere",
    "weather-day",
    "weather-night",
  );

  // Apply the new weather theme
  weatherOverview.classList.add(`weather-${condition}`);

  // Detect daytime or nighttime using the API icon code
  const timeOfDay = iconCode.endsWith("n") ? "night" : "day";

  weatherOverview.classList.add(`weather-${timeOfDay}`);
}
// Update all weather detail cards
function updateWeatherDetails(data) {
  // Humidity
  humidity.textContent = `${data.main.humidity}%`;

  // Wind speed: convert metres per second to kilometres per hour
  windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;

  // Visibility: convert metres to kilometres
  visibility.textContent = Number.isFinite(data.visibility)
    ? `${(data.visibility / 1000).toFixed(1)} km`
    : "-- km";

  // Atmospheric pressure
  pressure.textContent = Number.isFinite(data.main.pressure)
    ? `${data.main.pressure} hPa`
    : "-- hPa";

  // Convert Unix timestamps into the selected city's local time
  function formatLocalTime(timestamp) {
    if (!Number.isFinite(timestamp) || !Number.isFinite(data.timezone)) {
      return "--:--";
    }

    const localDate = new Date((timestamp + data.timezone) * 1000);

    let hours = localDate.getUTCHours();
    const minutes = String(localDate.getUTCMinutes()).padStart(2, "0");

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
  }

  // Sunrise and sunset
  sunrise.textContent = formatLocalTime(data.sys?.sunrise);
  sunset.textContent = formatLocalTime(data.sys?.sunset);
}

// 3. SEARCH FORM EVENT

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (searchRequestActive) {
    return;
  }

  const city = cityInput.value.trim();

  if (!city) {
    searchError.textContent = "Please enter a city name.";
    return;
  }

  searchError.textContent = "";

  try {
    searchRequestActive = true;
    searchButton.disabled = true;
    searchButton.setAttribute("aria-busy", "true");
    searchButton.textContent = "Searching...";
    weatherStatus.textContent = "Finding your weather...";

    await getWeather(city);

    // Save the city to recent searches after successful weather fetch
    saveRecentCity(city);
  } catch (error) {
    searchError.textContent = getFriendlyErrorMessage(
      error,
      "We couldn't load weather for that search. Please try again.",
    );
    weatherStatus.textContent = "Unable to load weather";
  } finally {
    searchRequestActive = false;
    searchButton.disabled = false;
    searchButton.setAttribute("aria-busy", "false");
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

  cities.forEach((city) => {
    const listItem = document.createElement("li");

    const cityButton = document.createElement("button");
    cityButton.type = "button";
    cityButton.textContent = city;

    cityButton.addEventListener("click", () => {
      searchCity(city);
    });

    listItem.appendChild(cityButton);
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
  const geocodingURL = `${WEATHER_API_BASE}/geo?city=${encodeURIComponent(city)}`;

  const locations = await fetchWeatherData(geocodingURL, "geocoding");

  // 3. Check whether the city exists
  if (
    !Array.isArray(locations) ||
    locations.length === 0 ||
    !locations[0] ||
    !Number.isFinite(locations[0].lat) ||
    !Number.isFinite(locations[0].lon) ||
    !locations[0].name ||
    typeof locations[0].country !== "string"
  ) {
    throw new WeatherRequestError(
      "We couldn't find that city. Check the spelling and try again.",
    );
  }

  const latitude = locations[0].lat;
  const longitude = locations[0].lon;

  const cityName = locations[0].name;
  const country = locations[0].country;

  // 4. Fetch current weather
  const weatherURL = `${WEATHER_API_BASE}/current?lat=${latitude}&lon=${longitude}`;

  const weatherData = await fetchWeatherData(weatherURL, "current");
  validateCurrentWeather(weatherData);
  updateWeatherTheme(weatherData);
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

  // 8. Update all weather detail cards
  updateWeatherDetails(weatherData);
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

  loadForecast(latitude, longitude);
}

/**
 * Load and render the next three local calendar days of forecast data.
 * Forecast failures are shown in the forecast card without affecting current weather.
 */
async function loadForecast(latitude, longitude) {
  lastForecastCoordinates = { latitude, longitude };
  const requestId = ++forecastRequestId;

  try {
    forecastStatus.textContent = "Loading forecast...";
    forecastStatus.setAttribute("aria-busy", "true");
    forecastList.setAttribute("aria-busy", "true");
    renderForecastMessage("Loading forecast data...");

    const forecastURL = `${WEATHER_API_BASE}/forecast?lat=${latitude}&lon=${longitude}`;
    const forecastData = await fetchWeatherData(forecastURL, "forecast");

    const timezoneOffset = forecastData.city && forecastData.city.timezone;
    if (!Number.isFinite(timezoneOffset) || !Array.isArray(forecastData.list)) {
      throw new WeatherRequestError(
        "Forecast data was incomplete. Please try again.",
      );
    }

    const days = getNextForecastDays(forecastData.list, timezoneOffset);
    if (requestId !== forecastRequestId) {
      return;
    }

    if (days.length < 3) {
      forecastStatus.textContent = "Forecast unavailable";
      renderForecastMessage(
        "A three-day forecast is not available for this location yet.",
        { isError: true, retry: true },
      );
      return;
    }

    renderForecast(days);
    forecastStatus.textContent = "Next 3 days";
  } catch (error) {
    if (requestId !== forecastRequestId) {
      return;
    }

    console.warn("Failed to load weather forecast", error);
    forecastStatus.textContent = "Forecast unavailable";
    renderForecastMessage(
      getFriendlyErrorMessage(
        error,
        "The forecast couldn't be loaded. Please try again.",
      ),
      { isError: true, retry: true },
    );
  } finally {
    if (requestId === forecastRequestId) {
      forecastStatus.setAttribute("aria-busy", "false");
      forecastList.setAttribute("aria-busy", "false");
    }
  }
}

function getNextForecastDays(entries, timezoneOffset) {
  const today = getForecastDateKey(Date.now() / 1000, timezoneOffset);
  const groupedDays = new Map();

  entries.forEach((entry) => {
    if (
      !entry ||
      !Number.isFinite(entry.dt) ||
      !entry.main ||
      !Number.isFinite(entry.main.temp_min) ||
      !Number.isFinite(entry.main.temp_max)
    ) {
      return;
    }

    const date = getForecastDateKey(entry.dt, timezoneOffset);
    if (date <= today) {
      return;
    }

    let day = groupedDays.get(date);
    if (!day) {
      day = {
        date,
        min: entry.main.temp_min,
        max: entry.main.temp_max,
        entries: [],
      };
      groupedDays.set(date, day);
    } else {
      day.min = Math.min(day.min, entry.main.temp_min);
      day.max = Math.max(day.max, entry.main.temp_max);
    }

    day.entries.push(entry);
  });

  return [...groupedDays.values()]
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 3)
    .map((day) => {
      const representative = day.entries.reduce((closest, entry) => {
        const hour = new Date((entry.dt + timezoneOffset) * 1000).getUTCHours();
        const closestHour = new Date(
          (closest.dt + timezoneOffset) * 1000,
        ).getUTCHours();

        return Math.abs(hour - 12) < Math.abs(closestHour - 12)
          ? entry
          : closest;
      });
      const condition =
        representative.weather && representative.weather[0]
          ? representative.weather[0]
          : {};

      return {
        ...day,
        description: condition.description || "Conditions unavailable",
        icon: condition.icon || "",
      };
    });
}

function getForecastDateKey(timestamp, timezoneOffset) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderForecast(days) {
  const fragment = document.createDocumentFragment();

  days.forEach((day) => {
    const card = document.createElement("article");
    card.className = "forecast-card";

    const weekday = document.createElement("p");
    weekday.className = "forecast-day";
    weekday.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(`${day.date}T12:00:00Z`));
    card.appendChild(weekday);

    const icon = document.createElement("span");
    icon.className = "forecast-icon";
    icon.setAttribute("aria-hidden", "true");
    if (day.icon) {
      const image = document.createElement("img");
      image.src = `https://openweathermap.org/img/wn/${encodeURIComponent(day.icon)}@2x.png`;
      image.alt = "";
      image.width = 64;
      image.height = 64;
      image.loading = "lazy";
      icon.appendChild(image);
    } else {
      icon.textContent = "—";
    }
    card.appendChild(icon);

    const description = document.createElement("p");
    description.className = "forecast-condition";
    description.textContent = day.description;
    card.appendChild(description);

    const temperatures = document.createElement("div");
    temperatures.className = "forecast-temperatures";
    temperatures.appendChild(createForecastTemperature("Low", day.min));
    temperatures.appendChild(createForecastTemperature("High", day.max));
    card.appendChild(temperatures);

    fragment.appendChild(card);
  });

  forecastList.replaceChildren(fragment);
}

function createForecastTemperature(label, temperature) {
  const item = document.createElement("p");
  item.append(`${label} `);

  const value = document.createElement("strong");
  value.textContent = `${Math.round(temperature)}°`;
  item.appendChild(value);
  return item;
}

function renderForecastMessage(message, options = {}) {
  const item = document.createElement("div");
  item.className = options.isError
    ? "forecast-message is-error"
    : "forecast-message";

  const messageText = document.createElement("p");
  messageText.textContent = message;
  item.appendChild(messageText);

  if (options.retry && lastForecastCoordinates) {
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "forecast-retry";
    retryButton.textContent = "Retry forecast";

    const { latitude, longitude } = lastForecastCoordinates;
    retryButton.addEventListener("click", () => {
      loadForecast(latitude, longitude);
    });

    item.appendChild(retryButton);
  }

  forecastList.replaceChildren(item);
}

// 11. GET WEATHER USING CURRENT LOCATION

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    searchError.textContent =
      "This browser doesn't support location services. You can search for a city instead.";
    return;
  }

  searchError.textContent = "";
  weatherStatus.textContent = "Finding your location...";

  locationButton.disabled = true;
  locationButton.setAttribute("aria-busy", "true");
  locationButton.textContent = "Finding location...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        weatherStatus.textContent = "Loading your local weather...";
        locationButton.textContent = "Loading weather...";

        const weatherURL = `${WEATHER_API_BASE}/current?lat=${latitude}&lon=${longitude}`;

        const weatherData = await fetchWeatherData(weatherURL, "current");
        validateCurrentWeather(weatherData, true);
        updateWeatherTheme(weatherData);
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

        // Update all weather detail cards
        updateWeatherDetails(weatherData);

        const iconCode = weatherData.weather[0].icon;
        const iconImage = document.createElement("img");

        iconImage.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        iconImage.alt = weatherData.weather[0].description;
        iconImage.width = 100;
        iconImage.height = 100;

        weatherIcon.replaceChildren(iconImage);

        weatherStatus.textContent =
          "Weather updated using your current location.";

        loadForecast(latitude, longitude);
      } catch (error) {
        searchError.textContent = getFriendlyErrorMessage(
          error,
          "We couldn't load your local weather. Please try again.",
        );
        weatherStatus.textContent = "Unable to load local weather.";
      } finally {
        locationButton.disabled = false;
        locationButton.setAttribute("aria-busy", "false");
        locationButton.textContent = "Use My Current Location";
      }
    },

    (error) => {
      if (error.code === 1) {
        searchError.textContent =
          "Location permission denied. Allow location access in your browser settings, then try again.";
      } else if (error.code === 2) {
        searchError.textContent =
          "Your location couldn't be determined. Check that location services are enabled and try again.";
      } else if (error.code === 3) {
        searchError.textContent =
          "The location request timed out. Check location services and try again.";
      } else {
        searchError.textContent =
          "Something went wrong while accessing your location.";
      }

      weatherStatus.textContent = "Location unavailable.";

      locationButton.disabled = false;
      locationButton.setAttribute("aria-busy", "false");
      locationButton.textContent = "Use My Current Location";
    },

    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 600000,
    },
  );
});
