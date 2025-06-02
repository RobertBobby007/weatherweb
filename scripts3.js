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

const cityTranslations = {
    "Prague": "Praha",
    "Brno": "Brno",
    "Ostrava": "Ostrava",
    "Pilsen": "Plzeň",
    "Plzen": "Plzeň",
    "Olomouc": "Olomouc",
    "Liberec": "Liberec",
    "Hradec Králové": "Hradec Králové",
    "České Budějovice": "České Budějovice"
    // přidej si další jak budeš chtít
};

function saveSearchedCity(city) {
    let history = JSON.parse(localStorage.getItem('cityHistory') || '[]');
    if (!history.includes(city)) {
        history.unshift(city);
        history = history.slice(0, 10);
        localStorage.setItem('cityHistory', JSON.stringify(history));
    }
}

document.getElementById('searchBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    saveSearchedCity(city);
    getWeatherData(city)
        .then(displayWeatherData)
        .catch(err => displayError(err.message));
});

document.getElementById('cityInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const city = this.value;
        // Vyčistit nabídku měst
        document.getElementById('cities').innerHTML = '';
        document.getElementById('searchBtn').click();
    }
});


document.getElementById('cityInput').addEventListener('input', function () {
    const query = this.value;
    const datalist = document.getElementById('cities');
    datalist.innerHTML = '';

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
        .catch(() => { });
});

// TADY JE NOVÝ KÓD PRO SKRYTÍ AUTOCOMPLETE PO VÝBĚRU
document.getElementById('cityInput').addEventListener('change', function () {
    const city = this.value;
    saveSearchedCity(city);
    getWeatherData(city)
        .then(displayWeatherData)
        .catch(err => displayError(err.message));

    this.blur();
    setTimeout(() => this.focus(), 100);
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
    const displayCityName = cityTranslations[data.name] || data.name;
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

    // Pokud máme souřadnice, zobraz teplotu a stav počasí NAD hodinovou předpověď, zbytek nech dole
    if (data.coord && data.coord.lat && data.coord.lon) {
        getHourlyForecast(data.coord.lat, data.coord.lon)
            .then(hourlyHtml => {
                let html = `
                    <h2>${displayCityName}</h2>
                    <div style="margin-bottom:10px;">
                        <p>${data.weather[0].description} <img src="${iconUrl}" alt="Weather icon"></p>
                        <p>${data.main.temp}°C</p>
                    </div>
                    ${hourlyHtml}
                    <div style="margin-top:10px;">
                        <p>Pocitová teplota: ${data.main.feels_like}°C</p>
                        <p>Vlhkost: ${data.main.humidity}%</p>
                        <p>Rychlost větru: ${data.wind.speed} m/s</p>
                    </div>
                `;
                weatherInfo.innerHTML = html;
            })
            .catch(() => {
                let html = `
                    <h2>${displayCityName}</h2>
                    <div style="margin-bottom:10px;">
                        <p>${data.weather[0].description} <img src="${iconUrl}" alt="Weather icon"></p>
                        <p>${data.main.temp}°C</p>
                    </div>
                    <p style='color:gray;'>Nepodařilo se načíst hodinovou předpověď.</p>
                    <div style="margin-top:10px;">
                        <p>Pocitová teplota: ${data.main.feels_like}°C</p>
                        <p>Vlhkost: ${data.main.humidity}%</p>
                        <p>Rychlost větru: ${data.wind.speed} m/s</p>
                    </div>
                `;
                weatherInfo.innerHTML = html;
            });
    } else {
        let html = `
            <h2>${displayCityName}</h2>
            <div style="margin-bottom:10px;">
                <p>${data.weather[0].description} <img src="${iconUrl}" alt="Weather icon"></p>
                <p>Teplota: ${data.main.temp}°C</p>
            </div>
            <div style="margin-top:10px;">
                <p>Pocitová teplota: ${data.main.feels_like}°C</p>
                <p>Vlhkost: ${data.main.humidity}%</p>
                <p>Rychlost větru: ${data.wind.speed} m/s</p>
            </div>
        `;
        weatherInfo.innerHTML = html;
    }
}

// Přidat funkci pro získání hodinové předpovědi
function getHourlyForecast(lat, lon) {
    const apiKey = 'af421a40713d91d34510500fd2b171e2';
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=cz`;

    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error();
            return response.json();
        })
        .then(data => {
            // Vezmeme prvních 6 hodin (3hodinové intervaly)
            const hours = data.list.slice(0, 6);
            let html = `<h3>Hodinová předpověď</h3><div style="display:flex;gap:10px;overflow-x:auto;">`;
            hours.forEach(hour => {
                const time = new Date(hour.dt * 1000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
                const icon = hour.weather[0].icon;
                html += `
                    <div style="min-width:90px;text-align:center;">
                        <div>${time}</div>
                        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="" />
                        <div>${hour.main.temp}°C</div>
                        <div style="font-size:12px;">${hour.weather[0].description}</div>
                    </div>
                `;
            });
            html += `</div>`;
            return html;
        });
}

function displayError(message) {
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `<p style="color: red;">${message}</p>`;
}

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
                const displayCityName = cityTranslations[data.name] || data.name;
                document.getElementById('cityInput').value = displayCityName;
                saveSearchedCity(displayCityName);
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
                    const displayCityName = cityTranslations[data.name] || data.name;
                    document.getElementById('cityInput').value = displayCityName;
                    saveSearchedCity(displayCityName);
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
