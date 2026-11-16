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
  } catch (error) {
    searchError.textContent = error.message;
    weatherStatus.textContent = "Unable to load weather";
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
});

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
