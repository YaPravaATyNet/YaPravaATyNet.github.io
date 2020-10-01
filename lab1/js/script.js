apiKey = '315bdb45e49dcae9a4a9512b11a04583';
baseURL = 'https://api.openweathermap.org/data/2.5/weather';
addListeners();
getMainCity();
addFavoriteCities();

function addListeners() {
	document.querySelector('.plus-btn').addEventListener('click', (event) => {
		city = document.querySelector('.add-new-city-input').value;
		fetch(`${baseURL}?q=${city}&appid=${apiKey}`).then(resp => resp.json()).then(data => {
			if (data.name !== undefined) {
				cities = JSON.parse(localStorage.getItem('favorites'));
				cities.push(city);
				localStorage.setItem('favorites', JSON.stringify(cities)); 
				addCity(city);
				addCityInfo(data);
			} else {
				alert('Город не найден');
			}
		});
	});

	document.querySelector('.update-btn').addEventListener('click', (event) => {
		getPosition();
	});

	document.querySelector('.update-btn-image').addEventListener('click', (event) => {
		getPosition();
	});
}

function getMainCity() {
	lat = localStorage.getItem('lat');
	lon = localStorage.getItem('lon');
	if (lat == null || lon == null) {
		getPosition();
	} else {
		addMainCity(lat, lon);
	}
}

function getPosition() {
	geolocation = navigator.geolocation;
	geolocation.getCurrentPosition(positionHandler, errorHandler);
}

function positionHandler(position) {
	latitude = position.coords.latitude;
    longitude = position.coords.longitude;
   	addMainCity(latitude, longitude);
}

function errorHandler(err) {
   addMainCity(59.894444, 30.264168);
}

function addMainCity(lat, lon) {
	localStorage.setItem('lat', lat);
	localStorage.setItem('lon', lon);
	fetch(`${baseURL}?lat=${lat}&lon=${lon}&appid=${apiKey}`).then(resp => resp.json()).then(data => {
    	temp = Math.round(data.main.temp - 273) + '&deg;';
    	document.querySelector('main > section').innerHTML = `
    		<h2 class="main-city-name">${data.name}</h2>
    		<img class="main-weather-img" src="https://openweathermap.org/img/wn/${data.weather[0]['icon']}@2x.png">
    		<p class="main-temp">${temp}</p>
    	`;
    	document.querySelector('.info').innerHTML = `
    			<div class="weather-property">
					<h4>Ветер</h4>
					<p>${data.wind.speed} m/s, ${windDirection(data.wind.deg)}</p>
				</div>
				<div class="weather-property">
					<h4>Облачность</h4>
					<p>${data.clouds.all} %</p>
				</div>
				<div class="weather-property">
					<h4>Давление</h4>
					<p>${data.main.pressure} hpa</p>
				</div>
				<div class="weather-property">
					<h4>Влажность</h4>
					<p>${data.main.humidity} %</p>
				</div>
				<div class="weather-property">
					<h4>Координаты</h4>
					<p>[${data.coord.lon} ${data.coord.lat}]</p>
				</div>
    	`;
	})
	.catch(function () {
		document.querySelector('main > section').innerHTML = `<p class="wait">О нет, что-то пошло не так</p>`
	});
}

function addFavoriteCities() {
	if (localStorage.getItem('favorites') == null && localStorage.getItem('visited') == null) {
		localStorage.setItem('favorites', JSON.stringify(['Zurich', 'London', 'Paris', 'Berlin', 'Moscow', 'Helsinki']));
		localStorage.setItem('visited', 'true');
	}

	favoritesCities = localStorage.getItem('favorites') ? JSON.parse(localStorage.getItem('favorites')) : [];
	for (i = 0; i < favoritesCities.length; i++) {
		addCity(favoritesCities[i]);
	}

	favoritesCitiesSet = new Set(favoritesCities);
	for (favoriteCity of favoritesCitiesSet) { 
		fetchCity(favoriteCity)
	}
}

function fetchCity(city) {
	fetch(`${baseURL}?q=${city}&appid=${apiKey}`).then(resp => resp.json()).then(data => {
			addCityInfo(data);
	})
	.catch(err => {
       	document.querySelectorAll(`.${city} > .info`).forEach( item => {
       		item.innerHTML = `<p class="wait-city">О нет, что-то пошло не так</p>`;
      	});
   	});
}

function addCity(city) {
	city = document.querySelector('main').insertAdjacentElement('beforeend', htmlToElement(`
		<section class="${city}">
			<div class="city-weather">
				<h3>${city}</h3>
				<button class="circle-btn"></button>
			</div>
			<div class="info">
				<p class="wait-city">Подождите, данные загружаются</p>
			</div>
		</section>
	`));
	btn = city.firstElementChild.lastElementChild;	
	btn.addEventListener( 'click' , (event) => {
		city = event.currentTarget.parentNode.parentNode;
		cityName = city.getAttribute('class');
		i = 0;
		prevSibling = city;
		while (prevSibling.previousElementSibling.getAttribute('class') != 'add-new-city') {
			prevSibling = prevSibling.previousElementSibling;
			i++;
		}
		cities = JSON.parse(localStorage.getItem('favorites'));
		cities.splice(i, 1);
		localStorage.setItem('favorites', JSON.stringify(cities));
		city.remove();
	});
	
}

function addCityInfo(data) {
	temp = Math.round(data.main.temp - 273) + '&deg;';
   	document.querySelectorAll(`.${data.name} > .city-weather > h3`).forEach( item => {
		item.insertAdjacentHTML('afterend', `
   			<p class="city-temp">${temp}</p>
   			<img class="city-weather-img" src="https://openweathermap.org/img/wn/${data.weather[0]['icon']}@2x.png">
   		`);
	});
	document.querySelectorAll(`.${data.name} > .info`).forEach(item => {
		item.innerHTML = `
			<div class="weather-property">
				<h4>Ветер</h4>
				<p>${data.wind.speed} m/s, ${windDirection(data.wind.deg)}</p>
			</div>
			<div class="weather-property">
				<h4>Облачность</h4>
				<p>${data.clouds.all} %</p>
			</div>
			<div class="weather-property">
				<h4>Давление</h4>
			<p>${data.main.pressure} hpa</p>
			</div>
			<div class="weather-property">
				<h4>Влажность</h4>
				<p>${data.main.humidity} %</p>
			</div>
			<div class="weather-property">
				<h4>Координаты</h4>
				<p>[${data.coord.lon} ${data.coord.lat}]</p>
			</div>
		`;
	});
}


function windDirection(deg) {
	if (deg < 22.5 || deg >= 337.5) {
		return 'North';
	}
	if (deg < 67.5) {
		return 'North-East';
	}
	if (deg < 112.5) {
		return 'East';
	}
	if (deg < 157.5) {
		return 'South-East';
	}
	if (deg < 202.5) {
		return 'South';
	}
	if (deg < 247.5) {
		return 'South-West';
	}
	if (deg < 292.5) {
		return 'West';
	}
	return 'North-West'
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}
