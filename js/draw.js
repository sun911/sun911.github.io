'use strict';

// Здесь расписываем логику рисования Создаём объект с выбором цвета

//window.addEventListener('resize', maskSize);
window.addEventListener('resize', maskSize);
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const colorButtons = document.querySelector('.draw-tools');
let curves = [];
let color = {
	'red': '#ea5d56',
	'yellow': '#f3d135',
	'green': '#6cbe47',
	'blue': '#53a7f5',
	'purple': '#b36ade'
};
let drawing = false;
let needsRepaint = false;

// Создаём событие удаления изображения по двойному клику

canvas.addEventListener('dblclick', clearCanvas);

// Отслеживаем событие выбора цвета

colorButtons.addEventListener('click', event => {
	if (event.target.name === 'color') {
		const currentColor = document.querySelector('.menu__color[checked]');
		currentColor.removeAttribute('checked');
		event.target.setAttribute('checked', '');
	}
});

// Отслеживаем событие выбора цвета

function clearCanvas() {
	console.log(`Запущена функция clearCanvas()`);
	curves = [];
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	needsRepaint = true;
}

// Выбираем цвет

function getColor() {
	const currentColor = document.querySelector('.menu__color:checked');
	return color[currentColor.value];
}

// Рисуем и задаём толщину линии и цвет

function smoothCurveBetween(p1, p2) {
	const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
	ctx.lineWidth = 4;
	ctx.strokeStyle = getColor();
	ctx.quadraticCurveTo(...p1, ...cp);
}

// Функция канвас

function smoothCurve(points) {
	ctx.beginPath();
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.moveTo(...points[0]);
	for (let i = 1; i < points.length - 1; i++) {
		smoothCurveBetween(points[i], points[i + 1]);
	}
	ctx.stroke();
}

// Отслеживаем перемещение мыши и запоминаем

canvas.addEventListener("mousedown", event => {
	if (draw.dataset.state === 'selected') {
		const curve = [];
		drawing = true;
		curve.push([event.offsetX, event.offsetY]);
		curves.push(curve);
		needsRepaint = true;
	}
});

// Очищаем массив с данными при отпускании клавиши мышки, чтобы продолжить рисовать с любого места

canvas.addEventListener("mouseup", () => {
	curves = [];
	drawing = false;
});

// Так же очищаем массив с данными при покидании мышки, зоны холста чтобы начать рисовать с любого места

canvas.addEventListener("mouseleave", () => {
	curves = [];
	drawing = false;
});

// Записываем координаты

canvas.addEventListener("mousemove", event => {
	if (drawing) {
		const point = [event.offsetX, event.offsetY]
		curves[curves.length - 1].push(point);
		needsRepaint = true;
	}
});

// Передаём данные для отрисовки

function repaint() {
	curves.forEach((curve) => smoothCurve(curve));
}

// Разрешаем отрисовку

function tick() {
	if (needsRepaint) {
		repaint();
	}
	window.requestAnimationFrame(tick);
}

tick();