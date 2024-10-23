document.getElementById('searchBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    getWeatherData(city)
        .then(displayWeatherData)
        .catch(err => displayError(err.message));
});

function getWeatherData(city) {
    const apiKey = 'af421a40713d91d34510500fd2b171e2';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=cz`;

    return fetch(url)
        .then(response => {
            if (response.status === 404) {
                throw new Error('Město nenalezeno');
            } else if (!response.ok) {
                throw new Error('Chyba při načítání dat');
            }
            return response.json();
        });
}

function displayWeatherData(data) {
    const weatherInfo = document.getElementById('weatherInfo');

    const iconCode = data.weather[0].icon;
    const iconUrl = `http://openweathermap.org/img/wn/${iconCode}.png`;

    weatherInfo.innerHTML = `
                <h2>${data.name}</h2>
                <p>Teplota: ${data.main.temp}°C</p>
                <p>Popis: ${data.weather[0].description} <img src="${iconUrl}" alt="Weather icon"></p>
                <p>Vlhkost: ${data.main.humidity}%</p>
                <p>Rychlost větru: ${data.wind.speed} m/s</p>
            `;
}

function displayError(message) {
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `<p style="color: red;">${message}</p>`;
}
