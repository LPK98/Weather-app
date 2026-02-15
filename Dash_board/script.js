async function getWeather() {
  const city = document.getElementById("city").value.trim();
  const apiKey = "8aa9d1ee7ba9001b7f8c8f0dd61a4326";

  document.getElementById("error").innerText = "";
  document.getElementById("temp").innerText = "";
  document.getElementById("humidity").innerText = "";

  if (city === "") {
    document.getElementById("error").innerText = "Please enter a city name";
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log(data); // 🔍 IMPORTANT

    if (response.status === 401) {
      throw new Error("Invalid API key (wait 10–20 minutes or create new key)");
    }

    if (response.status === 404) {
      throw new Error("City not found");
    }

    document.getElementById("temp").innerText =
      `🌡 Temperature: ${data.main.temp} °C`;

    document.getElementById("humidity").innerText =
      `💧 Humidity: ${data.main.humidity} %`;
  } catch (error) {
    document.getElementById("error").innerText = error.message;
  }
}
