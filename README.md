# SkyView – Weather Dashboard

**See Beyond the Forecast.**

SkyView is a responsive weather dashboard for checking current conditions, local weather, recent city searches, and a dynamic three-day forecast. Its Blueberry and Cream Soda interface keeps weather information clear across desktop, tablet, and mobile screens.

## Features

- **City Search:** Find current weather by city name.
- **Current Location:** Retrieve local weather using browser geolocation.
- **Recent Searches:** Save up to five successfully searched cities in browser Local Storage.
- **Three-Day Forecast:** View a dynamic forecast for the next three calendar days.
- **Weather Details:** See current temperature, feels-like temperature, humidity, wind speed, visibility, atmospheric pressure, sunrise, and sunset.
- **Dynamic Weather Themes:** The weather overview adapts its theme to current conditions and day or night.
- **Loading and Error States:** Get clear feedback while requests run or when a request fails.
- **Responsive Layout:** Use the dashboard on desktop, tablet, or mobile.
- **Accessible Interactions:** Navigate recent searches and card disclosures with a keyboard and receive status announcements.

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- OpenWeatherMap API
- Fetch API
- Browser Geolocation API
- Browser Local Storage

## Project Structure

```text
WeatherDashboard/
├── index.html
├── README.md
├── assets/
│   ├── icons/
│   │   └── skyview.svg
│   └── images/
├── css/
│   └── style.css
└── js/
    ├── config.js
    └── script.js
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mercykimutaicom-spec/weather-dashboard.git
```

### 2. Open the project

Open the cloned `weather-dashboard` folder in Visual Studio Code.

### 3. Configure the API key

SkyView uses the [OpenWeatherMap API](https://openweathermap.org/).

1. Create an OpenWeatherMap account and generate an API key.
2. Add the key to your local `js/config.js` file using the expected variable:

   ```javascript
   window.OPENWEATHER_API_KEY = "YOUR_API_KEY";
   ```

Replace the placeholder locally with your key. Do not publish a real API key or commit it to the repository.

### 4. Run the application

Open `index.html` using the Visual Studio Code Live Server extension.

## How to Use

1. Enter a city in the search field and select **Search** or press Enter.
2. View the current conditions and three-day forecast.
3. Select **Use My Current Location** to request weather for your location.
4. Select a saved city under **Recent Searches** to load it again.
5. Expand the weather cards for additional information.

## Live Demo

No public demo URL is currently configured.

## Author

**Mercy Jerotich Kimutai**

- GitHub: [mercykimutaicom-spec](https://github.com/mercykimutaicom-spec)
- Repository: [SkyView Weather Dashboard](https://github.com/mercykimutaicom-spec/weather-dashboard)

## Acknowledgements

- [OpenWeatherMap](https://openweathermap.org/) for weather data and API services.
- Elevvo Pathways for the Frontend Development internship learning opportunity.

---

_Built with HTML, CSS, and vanilla JavaScript._
