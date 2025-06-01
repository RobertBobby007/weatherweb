if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/weatherweb/sw.js')
            .then(registration => console.log('Service Worker zaregistrován s oborem: ', registration.scope))
            .catch(err => console.log('Registrace Service Worker selhala: ', err));
    });
}

const countryTranslations = {
    'CZ': 'Česko',
    'SK': 'Slovensko',
    'DE': 'Německo',
    'PL': 'Polsko',
    'AT': 'Rakousko',
    'US': 'USA',
    'GB': 'Velká Británie',
    'FR': 'Francie',
    'IT': 'Itálie',
    'ES': 'Španělsko'
};

// Funkce pro uložení hledaného města do localStorage
function saveSearchedCity(city) {
    let history = JSON.parse(localStorage.getItem('cityHistory') || '[]');
    if (!history.includes(city)) {
        history.unshift(city);
        history = history.slice(0, 10);
        localStorage.setItem('cityHistory', JSON.stringify(history));
    }
}

// Vyhledání po kliknutí na tlačítko
document.getElementById('searchBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    saveSearchedCity(city);
    getWeatherData(city)
        .then(displayWeatherData)
        .catch(err => displayError(err.message));
});

// Vyhledání po stisknutí Enter
document.getElementById('cityInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('searchBtn').click();
    }
});

// Autocomplete s historií i API
document.getElementById('cityInput').addEventListener('input', function () {
    const query = this.value;
    const datalist = document.getElementById('cities');
    datalist.innerHTML = '';

    // Nejprve nabídni historii
    let history = JSON.parse(localStorage.getItem('cityHistory') || '[]');
    history.filter(h => h.toLowerCase().includes(query.toLowerCase()))
        .forEach(h => {
            const option = document.createElement('option');
            option.value = h;
            datalist.appendChild(option);
        });

    if (query.length < 2) return;

    const apiKey = 'af421a40713d91d34510500fd2b171e2';
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            data.forEach(city => {
                let label = city.name;
                if (city.state) {
                    label += `, ${city.state}`;
                }
                const countryName = countryTranslations[city.country] || city.country;
                label += `, ${countryName}`;
                if (!history.includes(label)) {
                    const option = document.createElement('option');
                    option.value = label;
                    datalist.appendChild(option);
                }
            });
        })
        .catch(() => {
            // Chyby autocomplete ignorujeme
        });
});

function getWeatherData(city) {
    const apiKey = 'af421a40713d91d34510500fd2b171e2';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=cz`;

    return fetch(url)
        .then(response => {
            if (response.status === 404) {
                throw new Error('Město nenalezeno');
            } else if (!response.ok) {
                throw new Error('Chyba při načítání dat, pokud tento problém přetrvává, vytvořte Issue na GitHubu');
            }
            return response.json();
        })
        .catch(error => {
            if (error instanceof TypeError) {
                throw new Error('Nejste připojen k internetu!');
            }
            throw error;
        });
}

function displayWeatherData(data) {
    const weatherInfo = document.getElementById('weatherInfo');

    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

    weatherInfo.innerHTML = `
        <h2>${data.name}</h2>
        <p>V ${data.name} je: ${data.weather[0].description} <img src="${iconUrl}" alt="Weather icon"></p>
        <p>Teplota: ${data.main.temp}°C</p>
        <p>Pocitová teplota: ${data.main.feels_like}°C</p>
        <p>Vlhkost: ${data.main.humidity}%</p>
        <p>Rychlost větru: ${data.wind.speed} m/s</p>`;
}

function displayError(message) {
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `<p style="color: red;">${message}</p>`;
}

// Přidat tlačítko pro získání počasí podle polohy uživatele
const container = document.querySelector('.container');
const geoBtn = document.createElement('button');
geoBtn.textContent = 'Získat počasí podle polohy';
geoBtn.id = 'geoBtn';
container.insertBefore(geoBtn, document.getElementById('weatherInfo'));

let lastPosition = null;

document.getElementById('geoBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        displayError('Geolokace není podporována vaším prohlížečem.');
        return;
    }
    if (lastPosition) {
        const lat = lastPosition.coords.latitude;
        const lon = lastPosition.coords.longitude;
        getWeatherByCoords(lat, lon)
            .then(data => {
                let label = data.name;
                if (data.sys && data.sys.state) {
                    label += `, ${data.sys.state}`;
                }
                const countryName = countryTranslations[data.sys.country] || data.sys.country;
                if (data.sys && data.sys.country) {
                    label += `, ${countryName}`;
                }
                document.getElementById('cityInput').value = label;
                saveSearchedCity(label);
                displayWeatherData(data);
            })
            .catch(err => displayError(err.message));
        return;
    }
    navigator.geolocation.getCurrentPosition(
        position => {
            lastPosition = position;
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByCoords(lat, lon)
                .then(data => {
                    let label = data.name;
                    if (data.sys && data.sys.state) {
                        label += `, ${data.sys.state}`;
                    }
                    const countryName = countryTranslations[data.sys.country] || data.sys.country;
                    if (data.sys && data.sys.country) {
                        label += `, ${countryName}`;
                    }
                    document.getElementById('cityInput').value = label;
                    saveSearchedCity(label);
                    displayWeatherData(data);
                })
                .catch(err => displayError(err.message));
        },
        () => {
            displayError('Nepodařilo se získat polohu.');
        }
    );
});

function getWeatherByCoords(lat, lon) {
    const apiKey = 'af421a40713d91d34510500fd2b171e2';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=cz`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Chyba při načítání dat podle polohy.');
            }
            return response.json();
        })
        .catch(error => {
            if (error instanceof TypeError) {
                throw new Error('Nejste připojen k internetu!');
            }
            throw error;
        });
}
