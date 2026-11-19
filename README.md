# SkyView – Weather Dashboard

**See Beyond the Forecast.**

SkyView is a responsive weather dashboard that allows users to search for cities, view real-time weather conditions, and access a five-day forecast. It also supports browser-based geolocation and saves recent searches for convenient access.

**Live Demo:** https://mercykimutaicom-spec.github.io/weather-dashboard/

**GitHub Repository:** https://github.com/mercykimutaicom-spec/weather-dashboard

## Features

- **City Search:** Search for weather information by city name.
- **Current Weather:** View temperature, weather conditions and other weather information.
- **Five-Day Forecast:** Explore upcoming weather conditions.
- **Geolocation:** Get weather information based on your current location.
- **Search History:** Access previously searched cities.
- **Responsive Design:** Use the dashboard across different screen sizes.
- **Weather-Based Interface:** Dynamic weather themes and icons.

## Technologies Used

| Technology              | Purpose                             |
| ----------------------- | ----------------------------------- |
| HTML5                   | Application structure               |
| CSS3                    | Styling and responsive design       |
| JavaScript              | Application logic and interactivity |
| OpenWeatherMap API      | Weather and geocoding data          |
| Fetch API               | Asynchronous HTTP requests          |
| Browser Geolocation API | Location detection                  |
| Local Storage           | Saving recent searches              |
| Cloudflare Workers      | Secure API proxy                    |
| Git & GitHub            | Version control and hosting         |
| GitHub Pages            | Application deployment              |

## How It Works

SkyView uses a Cloudflare Worker as an intermediary between the frontend and OpenWeatherMap.

Instead of exposing the OpenWeatherMap API key in the frontend, the application sends requests to the Cloudflare Worker. The Worker retrieves the API key from its securely configured environment secret and communicates with OpenWeatherMap.

### API Request Flow

1. The user searches for a city or requests their current location.
2. JavaScript sends a request to the Cloudflare Worker.
3. The Worker retrieves the API key from its environment secret.
4. The Worker communicates with OpenWeatherMap.
5. Weather data is returned to the frontend.
6. JavaScript processes and displays the information.

### Worker Endpoints

- `/geo?city={city}` – City geocoding.
- `/current?lat={latitude}&lon={longitude}` – Current weather.
- `/forecast?lat={latitude}&lon={longitude}` – Five-day forecast.

## Project Structure

```text
WeatherDashboard/
│
├── assets/
│   ├── icons/
│   └── images/
│
├── css/
│   └── style.css
│
├── js/
│   ├── config.js
│   └── script.js
│
├── .gitignore
├── index.html
└── README.md
```

**Note:** `config.js` is a local configuration file and should not be committed if it contains private credentials. The deployed application uses the Cloudflare Worker integration.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mercykimutaicom-spec/weather-dashboard.git
```

### 2. Open the project

```bash
cd weather-dashboard
```

### 3. Configure the Cloudflare Worker

Deploy your own Cloudflare Worker and configure an environment secret named:

```text
OPENWEATHER_API_KEY
```

Set the secret value to your OpenWeatherMap API key.

Configure the allowed frontend origins in the Worker and update the Worker URL in `js/script.js` if using a different deployment.

### 4. Run locally

Open the project in VS Code and launch `index.html` using Live Server.

Ensure the Live Server origin is included in the Worker's allowed origins.

## Security

- The OpenWeatherMap API key is stored as a Cloudflare Worker secret.
- The frontend communicates with the Worker instead of directly exposing the API key.
- CORS restrictions control which browser origins can access the Worker.

## What I Learned

Building SkyView strengthened my practical understanding of:

- Working with third-party APIs.
- JavaScript asynchronous programming.
- Fetch API and JSON response handling.
- Browser geolocation.
- Local Storage.
- Serverless architecture using Cloudflare Workers.
- API key management and CORS.
- Debugging API integration issues.
- GitHub version control and deployment.

## Project Information

**Project:** SkyView – Weather Dashboard  
**Program:** Elevvo Pathways – Frontend Development  
**Project Number:** Project 4  
**Developer:** Mercy Jerotich Kimutai

---

_Built as part of my frontend development learning journey._
