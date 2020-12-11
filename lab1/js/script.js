apiKey = '315bdb45e49dcae9a4a9512b11a04583';
baseURL = 'http://localhost:3000';
addListeners();
getMainCity();
addFavoriteCities();

var callback = null;

function addListeners() {
	document.querySelector('.add-new-city').addEventListener('submit', (event) => {	
		event.preventDefault();
		cityInput = document.querySelector('.add-new-city-input').value;
		addNewFavouriteCity(cityInput);
	});

	document.querySelector('.update-btn').addEventListener('click', (event) => {
		getPosition();
	});

	document.querySelector('.update-btn-image').addEventListener('click', (event) => {
		getPosition();
	});
}

function addNewFavouriteCity(cityInput) {
		cityElem = addCity(cityInput);
		fetch(`${baseURL}/weather/city?q=${cityInput}`).then(resp => resp.json()).then(data => {
			if (data.name !== undefined) {
				putFavoriteCity(data, cityElem);
			} else {
				alert('Город не найден');
				cityElem.remove();
			}
		})
		.catch(function () {
			cityElem.lastElementChild.innerHTML = `<p class="wait-city">О нет, что-то пошло не так</p>`;
			execCallback();
		});
		document.querySelector('.add-new-city-input').value = "";
}

function putFavoriteCity(data, cityElem) {
	fetch(`${baseURL}/favourites`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
		},
		body: `name=${data.name}`
	}).then(resp => resp.json()).then(() => {
		// console.log(data);
		addCityInfo(data);
		execCallback();
	}).catch(function () {
		cityElem.lastElementChild.innerHTML = `<p class="wait-city">О нет, что-то пошло не так</p>`
		execCallback();
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
	fetch(`${baseURL}/weather/coordinates?lat=${lat}&lon=${lon}`).then(resp => resp.json()).then(data => {
		temp = Math.round(data.main.temp - 273) + '°';
		document.querySelector('main > section').innerHTML = '';
		document.querySelector('main > section').appendChild(mainCityHtml(data.name, data.weather[0]['icon'], temp));
		document.querySelector('.info').innerHTML = '';
		document.querySelector('.info').appendChild(info(data));
		execCallback()
	})
	.catch(function () {
		document.querySelector('main > section').innerHTML = `<p class="wait">О нет, что-то пошло не так</p>`
		execCallback()
	});
}

function addFavoriteCities() {
	fetch(`${baseURL}/favourites`).then(resp => resp.json()).then(data => {
		favoritesCities = data ? data : [];
		for (i = 0; i < favoritesCities.length; i++) {
			addCity(favoritesCities[i]);
		}
		favoritesCitiesSet = new Set(favoritesCities);
		for (favoriteCity of favoritesCitiesSet) { 
			fetchCity(favoriteCity)
		}
	})
	.catch(function () {execCallback();}) ;
}

function fetchCity(city) {
	fetch(`${baseURL}/weather/city?q=${city}`).then(resp => resp.json()).then(data => {
		addCityInfo(data);
		execCallback();
	})
	.catch(function () {
		document.querySelectorAll(`.${city} > .info`).forEach( item => {
			item.innerHTML = `<p class="wait-city">О нет, что-то пошло не так</p>`;
		});
		execCallback();
	});
}

function addCity(cityName) {
	cityName = format(cityName);
	elem = cityHtml(cityName)
	city = document.querySelector('main').appendChild(elem);
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
		fetch(`${baseURL}/favourites`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
			},
			body: `num=${i}`
		}).then(resp => resp.json()).then(() => {}).catch(err => {
			alert(err);
			alert("City wasn't deleted");
		});

		city.remove();
	});
	return elem;
}

function addCityInfo(data) {
	temp = Math.round(data.main.temp - 273) + '&deg;';
	cityNameClass = format(data.name)
	document.querySelectorAll(`.${cityNameClass} > .city-weather > h3`).forEach( item => {
		if (item.parentNode.children.length == 2) {
			item.insertAdjacentHTML('afterend', `
				<p class="city-temp">${temp}</p>
				<img class="city-weather-img" src="https://openweathermap.org/img/wn/${data.weather[0]['icon']}@2x.png">
				`);
		}
	});
	document.querySelectorAll(`.${cityNameClass} > .info`).forEach(item => {
		item.innerHTML = '';
		item.appendChild(info(data));
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

function format(str) {
	if (!str) return str;
	str = str.replace(/\s/g, '');
	return str[0].toUpperCase() + str.slice(1);
}

function mainCityHtml(name, icon, temp) {
	template = document.querySelector('#main-city');
	template.content.querySelector('h2').textContent = name;
	template.content.querySelector('.main-weather-img').setAttribute('src', `https://openweathermap.org/img/wn/${icon}@2x.png`);
	template.content.querySelector('.main-temp').textContent = temp;
	return template.content.cloneNode(true);
}

function info(data) {
	return infoHtml(
		`${data.wind.speed} m/s, ${windDirection(data.wind.deg)}`,
		`${data.clouds.all} %`, 
		`${data.main.pressure} hpa`, 
		`${data.main.humidity} %`, 
		`[${data.coord.lon} ${data.coord.lat}]`
		);
}

function infoHtml(wind, clouds, pressure, humidity, coords) {
	template = document.querySelector('#info');
	p = template.content.querySelectorAll('p');
	p[0].textContent = wind;
	p[1].textContent = clouds;
	p[2].textContent = pressure;
	p[3].textContent = humidity;
	p[4].textContent = coords;
	return template.content.cloneNode(true);
}

function cityHtml(city) {
	template = document.querySelector('#city');
	template.content.firstElementChild.setAttribute('class', city);
	template.content.querySelector('h3').textContent = city;
	return template.content.cloneNode(true).firstElementChild;
}

function execCallback() {
	if (callback == null) {
		return;
	}
	try {
		callback();
		callback = null;
	} catch(err) {
		console.log(err);
		callback = null;
	}
}

exports.getMainCity = function(callback_) {
	callback = callback_;
	getMainCity();
}

exports.addNewFavouriteCity = function(city, callback_) {
	callback = callback_;
	addNewFavouriteCity(city);
}

exports.addFavoriteCities = function(callback_) {
	callback = callback_;
	addFavoriteCities();
}

exports.addCity = function(city) {
	addCity(city);
}