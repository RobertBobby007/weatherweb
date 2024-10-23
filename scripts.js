document.getElementById('searchBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    getWeatherData(city, displayWeatherData);
});

function getWeatherData(city, callback) {
    const apiKey = 'af421a40713d91d34510500fd2b171e2';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=cz`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            callback(data);
        } else {
            console.error('Chyba při načítání dat');
        }
    };
    xhr.send();
}

function displayWeatherData(data) {
    const weatherInfo = document.getElementById('weatherInfo');


    weatherInfo.innerHTML = `
        <h2>${data.name}</h2>
        <p>Teplota: ${data.main.temp}°C</p>
        <p>Popis: ${data.weather[0].description} </p>
        <p>Vlhkost: ${data.main.humidity}%</p>
        <p>Rychlost větru: ${data.wind.speed} m/s</p>
    `;
}

function displayError(message) {
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `<p style="color: red;">${message}</p>`;
}
