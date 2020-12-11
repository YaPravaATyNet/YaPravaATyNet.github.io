var jsdom = require("jsdom");
var JSDOM = jsdom.JSDOM;
html = `<head>
	<meta charset="UTF-8">
	<title>Lab1</title>
	<link rel="stylesheet" href="css/default.css">
</head>
<body>
	<header class="head">
		<h1>Погода здесь</h1>
		<button class="update-btn">Обновить геолокацию</button>
		<button class="update-btn-image"></button>
	</header>

	<main class="container">
		<section>
			<p class="wait">Подождите, данные загружаются</p>
		</section>
		<section class="info">
		</section>
		<h2>Избранное</h2>
		<form class="add-new-city">
			<input type="text" class="add-new-city-input" placeholder="Добавьте новый город">
			<button class="plus-btn"></button>
		</form>
	</main>

	<template id="main-city">
		<h2 class="main-city-name"></h2>
		<img class="main-weather-img" src="">
		<p class="main-temp"></p>
	</template>

	<template id="info">
		<div class="weather-property">
			<h4>Ветер</h4>
			<p></p>
		</div>
		<div class="weather-property">
			<h4>Облачность</h4>
			<p></p>
		</div>
		<div class="weather-property">
			<h4>Давление</h4>
			<p></p>
		</div>
		<div class="weather-property">
			<h4>Влажность</h4>
			<p></p>
		</div>
		<div class="weather-property">
			<h4>Координаты</h4>
			<p></p>
		</div>
	</template>

	<template id="city">
		<section class="">
			<div class="city-weather">
				<h3></h3>
				<button class="circle-btn"></button>
			</div>
			<div class="info">
				<p class="wait-city">Подождите, данные загружаются</p>
			</div>
		</section>
	</template>
</body>`
window = new JSDOM(html).window;
global.document = window.document;
global.window = window;
global.localStorage = storageMock();
global.fetch = require("node-fetch");
global.navigator = {
  userAgent: 'node.js'
};
const geolocate = require('mock-geolocation');
geolocate.use();
const fetchMock = require('fetch-mock');
const expect = require('chai').expect;
const sinon = require("sinon");
const script = require('../script');

const baseURL = 'http://localhost:3000';

mockCity = {
		base: "stations",
		clouds: {all: 0},
		cod: 200,
		coord: {lon: 25, lat: 50},
		main: {temp: 257.15, feels_like: 252.98, temp_min: 257.15, temp_max: 257.15, pressure: 1039, humidity: 91},
		name: "Chelyabinsk",
		weather: [{
			description: "mist",
			icon: "50n",
			id: 701,
			main: "Mist"}],
		wind: {speed: 1, deg: 350}	
	};

mainSection = `
		<h2 class="main-city-name">Chelyabinsk</h2>
		<img class="main-weather-img" src="https://openweathermap.org/img/wn/50n@2x.png">
		<p class="main-temp">-16°</p>
	`.replace(/\s+/g,' ');

info = `
		<div class="weather-property"> <h4>Ветер</h4> <p>1 m/s, North</p> </div> 
		<div class="weather-property"> <h4>Облачность</h4> <p>0 %</p> </div> 
		<div class="weather-property"> <h4>Давление</h4> <p>1039 hpa</p> </div>       	 
		<div class="weather-property"> <h4>Влажность</h4> <p>91 %</p> </div> 
		<div class="weather-property"> <h4>Координаты</h4> <p>[25 50]</p> </div>
	`.replace(/\s+/g,' ');

errorSection = `<p class="wait">О нет, что-то пошло не так</p>`.replace(/\s+/g,' ');

citySection = `
		<div class="city-weather">
		<h3>Chelyabinsk</h3>
		<p class="city-temp">-16°</p>
		<img class="city-weather-img" src="https://openweathermap.org/img/wn/50n@2x.png">
		<button class="circle-btn"></button>
		</div>
		<div class="info">`.replace(/\s+/g,' ')

errorSectionCity = `<p class="wait-city">О нет, что-то пошло не так</p>`.replace(/\s+/g,' ');

describe('load main city', () => {

	it('load existed main city from local storage', (done) => {
		localStorage.setItem('lat', 25);
		localStorage.setItem('lon', 50);
		fetchMock.get(`${baseURL}/weather/coordinates?lat=25&lon=50`, mockCity);
		script.getMainCity(() => {
			expect(document.querySelector('main > section').innerHTML.replace(/\s+/g,' ')).to.equal(mainSection);
            expect(document.querySelector('.info').innerHTML.replace(/\s+/g,' ')).to.equal(info)
            fetchMock.done();
            fetchMock.restore();
			done();
		});
	})

	it('load main city by position', (done) => {
		localStorage.clear();
		fetchMock.get(`${baseURL}/weather/coordinates?lat=1&lon=2`, mockCity);
		script.getMainCity(() => {
			expect(document.querySelector('main > section').innerHTML.replace(/\s+/g,' ')).to.equal(mainSection);
            expect(document.querySelector('.info').innerHTML.replace(/\s+/g,' ')).to.equal(info)
            fetchMock.done();
            fetchMock.restore();
			done();
		});
		geolocate.send({latitude: 1, longitude: 2});
	})

	it('load default main city', (done) => {
		localStorage.clear();
		fetchMock.get(`${baseURL}/weather/coordinates?lat=59.894444&lon=30.264168`, mockCity);
		script.getMainCity(() => {
			expect(document.querySelector('main > section').innerHTML.replace(/\s+/g,' ')).to.equal(mainSection);
            expect(document.querySelector('.info').innerHTML.replace(/\s+/g,' ')).to.equal(info)
            fetchMock.done();
            fetchMock.restore();
			done();
		});
		geolocate.sendError({code: 1, message: "DENIED"});
	})

	it('load main city with error', (done) => {
		localStorage.setItem('lat', 25);
		localStorage.setItem('lon', 50);
		fetchMock.get(`${baseURL}/weather/coordinates?lat=25&lon=50`, 500);
		script.getMainCity(() => {
			expect(document.querySelector('main > section').innerHTML.replace(/\s+/g,' ')).to.equal(errorSection);
            fetchMock.done();
            fetchMock.restore();
			done();
		});
	})

})

describe('add favourite city', () => {

	afterEach(() => {
		window = new JSDOM(html).window;
		global.document = window.document;
		global.window = window;
	})

	it('add city OK', (done) => {
		cityInput = 'Chelyabinsk';
		fetchMock.get(`${baseURL}/weather/city?q=${cityInput}`, mockCity);
		fetchMock.post(`${baseURL}/favourites`, {});
		script.addNewFavouriteCity(cityInput, () => {
            expect(document.querySelector('main').lastChild.innerHTML.replace(/\s+/g,' ')).to.equal(citySection + info + '</div> ');
            fetchMock.done();
            fetchMock.restore();
			done();
		});
	})

	it('add city with error', (done) => {
		cityInput = 'Chelyabinsk';
		fetchMock.get(`${baseURL}/weather/city?q=${cityInput}`, mockCity);
		fetchMock.post(`${baseURL}/favourites`, 500);
		script.addNewFavouriteCity(cityInput, () => {
            expect(document.querySelector('main').lastChild.lastElementChild.innerHTML.replace(/\s+/g,' ')).to.equal(errorSectionCity);	
            fetchMock.restore();
			done();
		});
	})
})

describe('get favourites cities', () => {
	afterEach(() => {
		window = new JSDOM(html).window;
		global.document = window.document;
		global.window = window;
	})

	it('get cities OK', (done) => {
		cityInput = 'Chelyabinsk';
		fetchMock.get(`${baseURL}/weather/city?q=${cityInput}`, mockCity);
		fetchMock.get(`${baseURL}/favourites`, ['Chelyabinsk']);
		script.addFavoriteCities(() => {
			expect(document.querySelector('main').lastChild.innerHTML.replace(/\s+/g,' ')).to.equal(citySection + info + '</div> ');
			fetchMock.done();
            fetchMock.restore();
			done();
		});
	})

	it('get cities with error', (done) => {
		cityInput = 'Chelyabinsk';
		fetchMock.get(`${baseURL}/favourites`, 500);
		script.addFavoriteCities(() => {
			expect(document.documentElement.innerHTML.replace(/\s+/g,' ')).to.equal(html.replace(/\s+/g,' '));
			fetchMock.done();
            fetchMock.restore();
			done();
		});	
	})

	it('get cities with bad network', (done) => {
		cityInput = 'Chelyabinsk';
		fetchMock.get(`${baseURL}/weather/city?q=${cityInput}`, 500);
		fetchMock.get(`${baseURL}/favourites`, ['Chelyabinsk']);
		script.addFavoriteCities(() => {
			expect(document.querySelector('main').lastChild.lastElementChild.innerHTML.replace(/\s+/g,' ')).to.equal(errorSectionCity);
			fetchMock.done();
            fetchMock.restore();
			done();
		});
	})

})

function storageMock() {
	let storage = {};

	return {
		setItem: function(key, value) {
			storage[key] = value || '';
		},
		getItem: function(key) {
			return key in storage ? storage[key] : null;
		},
		removeItem: function(key) {
			delete storage[key];
		},
		clear: function() {
			storage = {}
		},
		get length() {
			return Object.keys(storage).length;
		},
		key: function(i) {
			const keys = Object.keys(storage);
			return keys[i] || null;
		}
	};
}
