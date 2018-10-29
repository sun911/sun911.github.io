'use strict';

const pageDimension = { width: document.body.clientWidth, height: document.body.clientHeight };
const fileInput = document.getElementById('fileInput');
const menu = document.querySelector('.menu');
const newPic = document.querySelector('.new');
const drag = document.querySelector('.drag');
const burger = document.querySelector('.burger');
const share = document.querySelector('.share');
const shareTools = document.querySelector('.share-tools');
const draw = document.querySelector('.draw');
const comments = document.querySelector('.comments');
const img = document.querySelector('.current-image');
const imgLoader = document.querySelector('.image-loader');
const errorWrap = document.querySelector('.error');
const errorMessage = document.querySelector('.error__message');
const url = document.querySelector('.menu__url');
const copyButton = document.querySelector('.menu_copy');
const menuToggle = document.querySelector('.menu__toggle-bg');
const mask = document.querySelector('.mask');
const shiftMenu = {x: 0, y: 0};
let emptyCanvasSize = 0;
let currentCanvasSize = 0;
let isDraw = false;
let needReload = false;
let imgID = null;
let bounds;
let connection;
let response;
let countComments;

// скрытие описания ошибки

document.addEventListener('click', () => errorWrap.classList.add('hidden'));

// выбор изображения

fileInput.addEventListener('change', event => {
    console.log(`Файл выбран. Функция onSelectFiles(). Запускаю функцию sendFile(file)...`);
    const file = event.target.files[0];
    if (file) sendFile(file);
});

// копирование ссылки в буфер обмена

copyButton.addEventListener('click', () => {
    url.select();
document.execCommand('copy');
console.log(`Текст скопирован в буфер обмена...`);
});

// Работа со Storage 

function dataToStorage(title, value) {
    sessionStorage.setItem(title, value);
    console.log("TCL: dataToStorage -> sessionStorage", sessionStorage);
}

// загрузка картинки

function loadMask(url) {
    console.log('TCL: loadMask -> url', url);
    return new Promise(resolve => {
        mask.src = url;
        mask.addEventListener('load', () => resolve())
    });
}

function loadImg(url) {
    console.log('TCL: loadImg -> url', url);
    return new Promise(resolve => {
        img.src = url;
        img.addEventListener("load", () => resolve());
    });
}

// определение размера канваса

function canvasSize() {
    console.log("Изображение загрузилось. Меняю размер ХОЛСТА...");
    canvas.removeAttribute('class');
    canvas.width = img.width;
    canvas.height = img.height;
    checkMenuWidth();
    checkFormsPosition();
}

// определение размера маски

function maskSize() {
    console.log('Изображение загрузилось. Меняю размер МАСКИ...');
    console.log("TCL: maskSize -> img.width", img.width);
    mask.width = img.width;
    mask.height = img.height;
    checkFormsPosition();
}

// уточнение положения форм с комментариями относительно картинки

function checkFormsPosition() {
    console.log("Запущена функция checkFormsPosition...");
    const forms = document.querySelectorAll(".comments__form");
    const imageHeight = document.querySelector("img").getBoundingClientRect().height;
    const imageWidth = document.querySelector("img").getBoundingClientRect().width;
    const imageLeft = document.querySelector("img").getBoundingClientRect().x;
    const imageTop = document.querySelector("img").getBoundingClientRect().y;

    const movingForm = form => {
        form.style.top = `${parseFloat(form.dataset.aspectTop) * imageHeight + imageTop}px`;
        form.style.left = `${parseFloat(form.dataset.aspectLeft) * imageWidth + imageLeft}px`;
    }

    forms.forEach(form => movingForm(form));
}

// перемещение меню

document.addEventListener('mousedown', event => {
    if(event.target.classList.contains('drag')) {
        movedPiece = event.target.parentNode;
        bounds = event.target.getBoundingClientRect();
        shiftMenu.x = event.pageX - bounds.left - window.pageXOffset;
        shiftMenu.y = event.pageY - bounds.top - window.pageYOffset;
    }
});

// переключение режимов

menu.addEventListener('click', event => {
    const element = event.target;
    const parent = event.target.parentNode;
    const currentMode = document.querySelector('.menu__item[data-state = selected]');

    if (element.tagName === 'LI' || parent.tagName === 'LI') {
        if (parent.classList.contains('burger') || element.classList.contains('burger')) {
            toggleMenu(currentMode, menu, "", "default");
            currentMode.dataset.state = '';
            menu.dataset.state = 'default';
            removeEmptyComment();
            closeAllForms();
            sendMask(response);
            checkMenuWidth();
        }

        if(parent.classList.contains('new') || element.classList.contains('new')) {
            fileInput.click();
        }

        if (parent.classList.contains('comments') || element.classList.contains('comments')) {
            toggleMenu(menu, comments);
        }

        if(parent.classList.contains('draw') || element.classList.contains('draw')) {
            isDraw = true;
            toggleMenu(menu, draw);
        }
        
        if(parent.classList.contains('share') || element.classList.contains('share')) {
            toggleMenu(menu, share);
            checkMenuWidth();
        }
    }
});

function toggleMenu(pointCne, pointTwo, attrOne, attrTwo) {
    if (!attrOne) {
        pointCne.dataset.state = "selected";
    } else {
        pointCne.dataset.state = attrOne;
    }

    if (!attrTwo) {
        pointTwo.dataset.state = "selected";
    } else {
        pointTwo.dataset.state = attrTwo;  
    }
}

// проверка раскрытия меню

function checkMenuWidth() {
    const menuShareWidth = drag.getBoundingClientRect().width
        + burger.getBoundingClientRect().width
        + share.getBoundingClientRect().width
        + parseFloat(getComputedStyle(shareTools).width)
        + parseFloat(getComputedStyle(shareTools).borderWidth || getComputedStyle(shareTools).borderLeftWidth) * 2;

    const menuDefaultWitdh = drag.getBoundingClientRect().width
        + comments.getBoundingClientRect().width+draw.getBoundingClientRect().width
        + share.getBoundingClientRect().width
        + newPic.getBoundingClientRect().width
        + parseFloat(getComputedStyle(shareTools).borderWidth || getComputedStyle(shareTools).borderLeftWidth) * 2;

    if (menu.dataset.state === 'selected' && menu.getBoundingClientRect().x + menuShareWidth > pageDimension.width) {
        menu.style.left = `${pageDimension.width - menuShareWidth - parseInt(getComputedStyle(menu).borderWidth || getComputedStyle(shareTools).borderLeftWidth)*2}px`;
        checkMenuWidth();
    }

    if (menu.dataset.state === 'default' && menu.getBoundingClientRect().x + menuDefaultWitdh > pageDimension.width) {
        menu.style.left = `${pageDimension.width - menuDefaultWitdh - parseInt(getComputedStyle(menu).borderWidth || getComputedStyle(shareTools).borderLeftWidth)*2}px`;
        checkMenuWidth();
    }
}

// форматирование даты

function timeParser(miliseconds) {
    const date = new Date(miliseconds);
    const options = {day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'};
    const formatDate = new Intl.DateTimeFormat("ru-RU", options).format;
    return formatDate(date);
}

//---Рисование---

window.addEventListener('resize', maskSize);
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const colorButtons = document.querySelector('.draw-tools');
let curves = [];
let color = {'red': '#ea5d56', 'yellow': '#f3d135', 'green': '#6cbe47', 'blue': '#53a7f5', 'purple': '#b36ade'};
let drawing = false;
let needsRepaint = false;

canvas.addEventListener('dblclick', clearCanvas);

colorButtons.addEventListener('click', event => {
    if (event.target.name === 'color') {
        const currentColor = document.querySelector('.menu__color[checked]');
        currentColor.removeAttribute('checked');
        event.target.setAttribute('checked', '');
    }
});

function clearCanvas() {
    console.log(`Запущена функция clearCanvas()`);
    curves = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    needsRepaint = true;
}

function getColor() {
    const currentColor = document.querySelector('.menu__color:checked');
    return color[currentColor.value];
}

function smoothCurveBetween (p1, p2) {
    const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle =  getColor();
    ctx.quadraticCurveTo(...p1, ...cp);
}

function smoothCurve(points) {
    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.moveTo(...points[0]);
    for(let i = 1; i < points.length - 1; i++) {
        smoothCurveBetween(points[i], points[i + 1]);
    }
    ctx.stroke();
}

canvas.addEventListener("mousedown", event => {
    if (draw.dataset.state === 'selected') {
        const curve = [];
        drawing = true;
        curve.push([event.offsetX, event.offsetY]);
        curves.push(curve);
        needsRepaint = true;
    }
});

canvas.addEventListener("mouseup", () => {
    curves = [];
    drawing = false;
});

canvas.addEventListener("mouseleave", () => {
    curves = [];
    drawing = false;
});

canvas.addEventListener("mousemove", event => {
    if (drawing) {
        const point = [event.offsetX, event.offsetY]
        curves[curves.length - 1].push(point);
        needsRepaint = true;
    }
});

function repaint () {
    curves.forEach((curve) => smoothCurve(curve));
}

function tick () {
    if(needsRepaint) {
        repaint();
        needsRepaint = false;
    }
    window.requestAnimationFrame(tick);
}

tick();

//---перетаскивание меню---

document.body.addEventListener('dragover', event => event.preventDefault());
document.body.addEventListener('drop', onFilesDrop);
document.addEventListener('mousemove', dragStart, false);
let movedPiece = null;
document.addEventListener('mouseup', () => {
    if (movedPiece) {
        movedPiece = null;
    }
});

function dragStart(event) {
    if (movedPiece) {
        event.preventDefault();
        const cords = {x: event.pageX - shiftMenu.x, y: event.pageY - shiftMenu.y};
        const maxX = pageDimension.width - movedPiece.offsetWidth - 1;
        const maxY = pageDimension.height - movedPiece.offsetHeight - 1;
        cords.x = Math.min(cords.x, maxX);
        cords.y = Math.min(cords.y, maxY);
        cords.x = Math.max(cords.x, 0);
        cords.y = Math.max(cords.y, 0);
        movedPiece.style.left = `${cords.x}px`;
        movedPiece.style.top = `${cords.y}px`;
    }
}

function onFilesDrop(event) {
    console.log(`Файл выбран. Функция onFilesDrop()`);
    event.preventDefault();
    if (!img.getAttribute('src')) {
        const files = event.dataTransfer.files;
        sendFile(files[0]);
    } else {
        errorWrap.classList.remove('hidden');
        errorMessage.innerText = 'Чтобы загрузить новое изображение, пожалуйста воспользуйтесь пунктом "Загрузить новое" в меню.';
    }
}

//---Комментарии---

canvas.addEventListener("click", createNewComment);
// canvas.addEventListener('click', createComments);
document.querySelector('.app').addEventListener('click', messageHandler);
document.addEventListener('click', markerClick);
document.addEventListener('click', closeForm);
menuToggle.addEventListener('click', toggleComments);

// переключатель видимости комментариев

function toggleComments(event) {
    const commentsForm = document.querySelectorAll('.comments__form');
    const commentsOn = document.getElementById('comments-on');
    const commentsOff = document.getElementById('comments-off');

    if (commentsOn.checked) {
        commentsOff.removeAttribute('checked');
        commentsOn.setAttribute('checked', '');
        for (const comment of commentsForm) {
            comment.classList.remove('hidden');
        }
        closeAllForms();
        console.log('toggleComments() : Комментарии Включены!');
    } else {
        removeEmptyComment();
        commentsOn.removeAttribute('checked');
        commentsOff.setAttribute('checked', '');

        for (const comment of commentsForm) {
            comment.classList.add('hidden');
        }
        if (document.querySelector('.comments__marker-checkbox') && !document.querySelector('.app').lastChild.querySelector('.comments__marker-checkbox[type]')){
            document.querySelector('.app').removeChild(document.querySelector('.app').lastChild);
        }
        console.log('toggleComments() : Комментарии выключены!');
    }
}

// показ/скрытие формы

function markerClick(event) {
    const bodyForm = event.target.nextElementSibling;
    if (bodyForm) {
        if (event.target.className === 'comments__marker-checkbox') {
            removeEmptyComment();

            if (bodyForm.style.display === 'block') {
                closeAllForms();
                bodyForm.style.display = 'none';
            } else {
                closeAllForms();
                bodyForm.style.display = 'block';
            }
        }
    }
}

// удаление пустую форму из DOM

function removeEmptyComment() {
    console.log(`Запущена функция removeEmptyComment()`);
    const isNewComment = document.getElementsByClassName('comments__form new')[0];
    console.log(isNewComment);
    if (isNewComment) {
        document.querySelector('.app').removeChild(isNewComment);
    }
}

// закрытие текущей формы

function closeForm(event) {
    if (event.target.className === 'comments__close') {
        console.log(`Запущена функция closeForm()`);
        event.target.parentNode.style.display = 'none';
    }
}

// закрытие всех форм

function closeAllForms() {
    console.log(`Запущена функция closeAllForms()`);
    const otherForms = document.querySelectorAll('.comments__body');
    for (const body of otherForms) {
        body.style.display = 'none';
    }
}

// удаление всех существующих форм из DOM

function clearForms() {
    if (document.querySelector('.comments__form')) {
        console.log(`Запущена функция clearForms()`);
        const forms = document.querySelectorAll('.comments__form');
        console.log("TCL: clearForms -> forms", forms);
        for (const form of forms) {
            document.querySelector('.app').removeChild(form);
        }
    }
}

// создание новой (пустой) формы

function createNewComment(event) {
    const isCommentsOn = document.getElementById('comments-on').checked;
    if (comments.dataset.state === 'selected' && isCommentsOn) {
        console.log(`Запущена функция createNewComment()`);
        const app = document.querySelector('.app');
        removeEmptyComment();
        closeAllForms();

        const form = document.createElement('div');
        form.className = 'comments__form new';

        const marker = document.createElement('span');
        marker.className = 'comments__marker';

        const commentsBody = document.createElement('div');
        commentsBody.className = 'comments__body';

        const createMessaege = document.createElement('div');
        createMessaege.className = 'comment';

        const loader = document.createElement('div');
        loader.className = 'loader hidden';

        const span = document.createElement('span');

        const commentsInput = document.createElement('textarea');
        commentsInput.className = 'comments__input';
        commentsInput.setAttribute('type', 'text');
        commentsInput.setAttribute('placeholder', 'Напишите ответ...');

        const commentsClose = document.createElement('input');
        commentsClose.className = 'comments__close';
        commentsClose.type = 'button';
        commentsClose.value = 'Закрыть';

        const commentsSubmit = document.createElement('input');
        commentsSubmit.className = 'comments__submit';
        commentsSubmit.type = 'submit';
        commentsSubmit.value = 'Отправить';

        createMessaege.appendChild(loader);
        loader.appendChild(span);
        loader.appendChild(span);
        loader.appendChild(span);
        loader.appendChild(span);
        loader.appendChild(span);
        commentsBody.appendChild(createMessaege);
        commentsBody.appendChild(commentsInput);
        commentsBody.appendChild(commentsClose);
        commentsBody.appendChild(commentsSubmit);

        form.style.left = event.pageX + 'px';
        form.style.top = event.pageY + 'px';

        form.appendChild(marker);
        form.appendChild(commentsBody);
        app.appendChild(form);
        commentsClose.addEventListener('click', removeEmptyComment);
        commentsBody.style.display = 'block';
    }
}

// обработка ввода нового комментария и создание объекта с параметрами нового комментария

function messageHandler(event) {
    if (event.target.className === 'comments__submit') {
    console.log(`Запущена функция messageHandler()`);
        event.preventDefault();
        const element = event.target.parentNode.querySelector('textarea');
        const form = event.target.parentNode.parentNode;
        const pic = document.querySelector("img");
        const imageHeight = pic.getBoundingClientRect().height;
        const imageWidth = pic.getBoundingClientRect().width;
        const imageLeft = pic.getBoundingClientRect().x;
        const imageTop = pic.getBoundingClientRect().y;

        if (element.value) {
            const comment = {
                'message': element.value, 
                'left': ((parseFloat(form.style.left) - imageLeft) / imageWidth).toFixed(3), 
                'top': ((parseFloat(form.style.top) - imageTop) / imageHeight).toFixed(3)
            };
            needReload = true;
            sendNewComment(sessionStorage.id, comment, form);
            element.value = '';
        }
    }
}

// создание массива с коментариями, полученными с сервера

function createCommentsArray(comments) {
    console.log(`Запущена функция createCommentsArray()`);
    const commentArray = [];

    console.log('TCL: createCommentsArray -> commentArray', commentArray);

    for (const comment in comments) {
        commentArray.push(comments[comment]);
    }
    clearForms();
    createCommentForm(commentArray);
}

// наполнение DOM комментариями

function createCommentForm(comments) {
    console.log('TCL: createCommentForm -> comments', comments);
    console.log(`Запущена функция createCommentForm()`);
    const app = document.querySelector('.app');

    const imageHeight = document.querySelector('img').getBoundingClientRect().height;
    const imageWidth = document.querySelector('img').getBoundingClientRect().width;
    const imageLeft = document.querySelector('img').getBoundingClientRect().x;
    const imageTop = document.querySelector('img').getBoundingClientRect().y;

    for (let comment of comments) {
        console.log('TCL: createCommentForm -> comment', comment);
        closeAllForms();

        const form = document.createElement('div');
        form.className = 'comments__form';

        const marker = document.createElement('span');
        marker.className = 'comments__marker';

        const markerCheckbox = document.createElement('input');
        markerCheckbox.className = 'comments__marker-checkbox';
        markerCheckbox.type = 'checkbox';

        const commentsBody = document.createElement('div');
        commentsBody.className = 'comments__body';
        commentsBody.style.display = 'block';

        const commit = document.createElement('div');
        commit.className = 'comment';

        const time = document.createElement('p');
        time.className = 'comment__time';
        time.innerText = timeParser(comment.timestamp);

        const message = document.createElement('p');
        message.className = 'comment__message';
        message.innerText = comment.message;

        commit.appendChild(time);
        commit.appendChild(message);

        const current = document.querySelector(`.comments__form[data-aspect-left='${comment.left}'], [data-aspect-top='${comment.top}']`);

        if (!current) {
            commentsBody.appendChild(commit);
            form.style.left = `${imageWidth * comment.left + imageLeft}px`;
            form.style.top = `${comment.top * imageHeight + imageTop}px`;
            form.dataset.aspectLeft = comment.left;
            form.dataset.aspectTop = comment.top;
            app.appendChild(form);
        } else {
            form.dataset.aspectLeft = comment.left;
            form.dataset.aspectTop = comment.top;
            appendComment(commit, current);
        }

        const createMessage = document.createElement('div');
        createMessage.className = 'comment load';

        const loader = document.createElement('div');
        loader.className = 'loader hidden';

        const commentsInput = document.createElement('textarea');
        commentsInput.className = 'comments__input';
        commentsInput.setAttribute('type', 'text');
        commentsInput.setAttribute('placeholder', 'Напишите ответ...');

        const commentsClose = document.createElement('input');
        commentsClose.className = 'comments__close';
        commentsClose.type = 'button';
        commentsClose.value = 'Закрыть';

        const commentsSubmit = document.createElement('input');
        commentsSubmit.className = 'comments__submit';
        commentsSubmit.type = 'submit';
        commentsSubmit.value = 'Отправить';

        loader.appendChild(document.createElement('span'));
        loader.appendChild(document.createElement('span'));
        loader.appendChild(document.createElement('span'));
        loader.appendChild(document.createElement('span'));
        loader.appendChild(document.createElement('span'));
        createMessage.appendChild(loader);
        commentsBody.appendChild(createMessage);
        commentsBody.appendChild(commentsInput);
        commentsBody.appendChild(commentsClose);
        commentsBody.appendChild(commentsSubmit);

        form.appendChild(marker);
        form.appendChild(markerCheckbox);
        form.appendChild(commentsBody);
    }
}

// добавления комментария в существующую форму

function appendComment(element, target) {
    console.log(target)
    console.log(`Запущена функция appendComment()`);
    const comments = target.querySelector('.comments__body').querySelectorAll('.comment');
    closeAllForms();
    if (target) {
        target.querySelector('.comments__body').insertBefore(element, target.querySelector('.load'));
        target.querySelector('.comments__body').style.display = 'block';
    }
    needReload = false;
}

// создание новой формы комментариев

function createComments(event) {
    const isCommentsOn = document.getElementById('comments-on').checked;
    if (comments.dataset.state === 'selected' && isCommentsOn) {
        removeEmptyComment();
        closeAllForms();
        const app = document.querySelector('.app');
        const emptyFragment = document.createDocumentFragment();
        emptyFragment.appendChild(commentTemplateEngine(commentTemplate(event)));
        app.appendChild(emptyFragment);
        const newComment = document.querySelector('.comments__form new');
        console.log(newComment)
        newComment.querySelector('.comments__close')
            .addEventListener('click', removeEmptyComment);
        newComment.style.left = event.pageX + "px";
        newComment.style.top = event.pageY + "px";
    }
}

function commentTemplateEngine(comment) {
    if (comment === undefined || comment === null || comment === false) {
        return document.createTextNode("");
    }

    if (typeof comment === "string" || typeof comment === "number") {
        return document.createTextNode(comment);
    }

    if (Array.isArray(comment)) {
        return comment.reduce((emptyElement, el) => {
            emptyElement.appendChild(commentTemplateEngine(el));
            return emptyElement;
        }, document.createDocumentFragment())
    }

    const element = document.createElement(comment.tag || "div");

    [].concat(comment.className || []).forEach(cls => element.classList.add(cls));

    if (comment.attr) {
        Object.keys(comment.attr).forEach(key => element.setAttribute(key, comment.attr[key]));
    }

    element.appendChild(commentTemplateEngine(comment.content));

    return element;
}

function commentTemplate(event) {
    return {
        tag: 'div', 
        className: ['comments__form', 'new'],
        attr: { style: `left: ${event.pageX}px; top: ${event.pageY}px` },
        content: [
            { 
                tag: 'span', 
                className: 'comments__marker' 
            },

            { 
                tag: 'div', 
                className: 'comments__body', 
                attr: { style: 'display: block' }, 
                content: [
                    { 
                        tag: 'div', 
                        className: 'comment', 
                        content: [
                            {
                                tag: 'div', 
                                className: ['loader', 'hidden'], 
                                content: [
                                    { tag: 'span' },
                                    { tag: 'span' },
                                    { tag: 'span' },
                                    { tag: 'span' },
                                    { tag: 'span' }
                                ]
                            }
                        ] 
                    },
                    {
                        tag: 'textarea', 
                        className: 'comments__input', 
                        attr: { type: 'text', placeholder: 'Напишите ответ...' }
                    },
                    {
                        tag: 'input',
                        className: 'comments__close',
                        attr: { type: 'button', value: 'Закрыть' }
                    },
                    {
                        tag: 'input',
                        className: 'comments__submit',
                        attr: { type: 'submit', value: 'Отправить' }
                    }
                ]
            }
        ]
    }
}

//---Отправка на сервер---

function sendFile(file) {
    console.log(`Запущена функция sendFile()`);
    errorWrap.classList.add('hidden');
    const imageTypeRegExp = /^image\/jpg|jpeg|png/;
    if (imageTypeRegExp.test(file.type)) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('title', file.name);
        formData.append('image', file);
        xhr.open('POST', 'https://neto-api.herokuapp.com/pic/');
        xhr.addEventListener("loadstart", () => imgLoader.style.display = 'block');
        xhr.addEventListener("loadend", () => imgLoader.style.display = 'none');
        xhr.addEventListener("error", () => {
          errorWrap.classList.remove("hidden");
          errorMessage.innerText = `Произошла ошибка! Повторите попытку позже... `;
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const result = JSON.parse(xhr.responseText);
                console.log(`Изображение опубликовано! Дата публикации: ${timeParser(result.timestamp)}`);
                if(connection) {
                    connection.close(1000, 'Работа закончена');
                }
                dataToStorage('id', result.id);
                dataToStorage('url', result.url);
                url.value = `${location.origin + location.pathname}?${sessionStorage.id}`;
                mask.src = '';
                mask.classList.add('hidden');
                loadImg(result.url)
                    .then(() => canvasSize())
                    .then(() => maskSize());
                toggleMenu(menu, share);
                clearForms();
                getWSConnect();
            } else {
                errorWrap.classList.remove('hidden');
                errorMessage.innerText = `Произошла ошибка ${xhr.status}! ${xhr.statusText}... Повторите попытку позже... `;
            }
        })
        xhr.send(formData);
    } else {
        errorWrap.classList.remove('hidden');
        errorMessage.innerText = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
    }
}

// открытие WebSocket соединения

function getWSConnect() {
    connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${sessionStorage.id}`);
    console.log('TCL: getWSConnect -> sessionStorage', sessionStorage);
    connection.addEventListener('open', () => console.log('Вебсокет-соединение открыто...'));
    connection.addEventListener('message', event => sendMask(JSON.parse(event.data)));
    connection.addEventListener('close', event => console.log('Вебсокет-соединение закрыто'));
    connection.addEventListener('error', error => {
        errorWrap.classList.remove('hidden');
        errorMessage.innerText = `WebSocket: произошла ошибка ! Повторите попытку позже... `;
    });
}

// проверяем сессию - если есть ID подгружаем картинку

if (sessionStorage.id) {
    console.log("TCL: sessionStorage.id)", sessionStorage.id);
    console.log(`Перехожу по ссылке ${`\`${location.origin + location.pathname}?${sessionStorage.id}\``}`);
    getShareData(location.search.replace(/^\?/, ""));
}

// открытие страницы по ссылке

if (location.search) {
    console.log(`Перехожу по ссылке ${`\`${location.origin + location.pathname}?${imgID || sessionStorage.id}\``}`);
    getShareData((location.search).replace(/^\?/, ''));
}

// запрос информации по ID через ссылку

function getShareData(id) {
    console.log("TCL: getShareData -> sessionStorage.id", id);
    console.log(`Запущена функция getShareData()`);
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://neto-api.herokuapp.com/pic/${sessionStorage.id || id}`);
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            loadShareData(JSON.parse(xhr.responseText));
        } else {
            errorWrap.classList.remove('hidden');
            errorMessage.innerText = `Произошла ошибка ${xhr.status}! ${xhr.statusText}... Повторите попытку позже... `;
        }
})
    xhr.send();
}

// обработка данных запроса информации по ID через ссылку

function loadShareData(result) {
    console.log('TCL: loadShareData -> result', result);
    console.log(`loadShareData() : Изображение получено! Дата публикации: ${timeParser(result.timestamp)}`);

    toggleMenu(menu, comments);
    dataToStorage('id', result.id);
    dataToStorage('url', result.url);
    loadImg(result.url).then(() => canvasSize());

    url.value = `${location.href}`;
    if (result.comments) {
        createCommentsArray(result.comments);
    }
    if (result.mask) {
        mask.src = result.mask;
        mask.classList.remove('hidden');
        loadMask(result.mask)
            .then(() => loadImg(result.url))
            .then(() => maskSize());
    }
    if (document.getElementById('comments-off').checked) {
        const commentsForm = document.querySelectorAll('.comments__form');
        for (const comment of commentsForm) {
            comment.classList.add('hidden');
        }
    }
    getWSConnect()
    closeAllForms();
}

// отправка комментария на сервер

function sendNewComment(id, comment, target) {
    console.log('TCL: sendNewComment -> id', id);
    console.log('TCL: sendNewComment -> comment', comment);
    console.log(`Запущена функция sendNewComment()`);
    const xhr = new XMLHttpRequest();
    const body = 'message=' + encodeURIComponent(comment.message) +
        '&left=' + comment.left +
        '&top=' + comment.top;
    xhr.open("POST", `https://neto-api.herokuapp.com/pic/${id}/comments`, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.addEventListener("loadstart", () => target.querySelector('.loader').classList.remove('hidden'));
    xhr.addEventListener("loadend", () => target.querySelector('.loader').classList.add('hidden'));
    xhr.addEventListener('load', () => {
        if(xhr.status === 200) {
            console.log('Комментарий был отправвлен!');
            const result = JSON.parse(xhr.responseText);
            createCommentsArray(result.comments);
            needReload = false;
        } else {
            errorWrap.classList.remove('hidden');
            errorMessage.innerText = `Произошла ошибка ${xhr.status}! ${xhr.statusText}... Повторите попытку позже... `;
        }
})
    xhr.send(body);
}

// отправка маски на сервер

function sendMask(response) {
    console.log('TCL: sendMask -> response', response);
    console.log(`Запущена функция sendMask()`);
    if (!response) {
        if (isDraw) {
            canvas.toBlob(blob => {
                currentCanvasSize = blob.size;
                console.log('TCL: sendMask -> emptyCanvasSize', emptyCanvasSize);
                console.log('TCL: sendMask -> currentCanvasSize', currentCanvasSize);
            if (currentCanvasSize !== emptyCanvasSize) {
                connection.send(blob);
            }
        })
            isDraw = false;
        } else {
            if (img.naturalHeight !== 0) {
                canvas.toBlob(blob => (emptyCanvasSize = blob.size));
            }
        }
    } else {
        if (response.event === 'mask') {
            console.log('Событие mask...');
            mask.classList.remove('hidden');
            clearCanvas(); 
            loadMask(response.url)
                .then(() => maskSize())
                .then(() => console.log('Mask loaded and resized!'));
        } else if (response.event === 'comment') {
            console.log('Событие comment...');
            pullComments(response);
        } else {
            if(response.pic) loadImg(response.pic.url).then(() => canvasSize());
        }
    }
}

// обработка коментариев из данных запроса информации по ID через ссылку

function pullComments(result) {
    console.log(`Запущена функция pullComments()`);
    countComments = 0;
    const countCurrentComments = document.getElementsByClassName('comment').length - document.getElementsByClassName('comment load').length;
    needReload = (countComments === countCurrentComments) ? false : true;
    if (result) {
        createCommentForm([result.comment]);
    }
    if (document.getElementById('comments-off').checked) {
        const commentsForm = document.querySelectorAll('.comments__form');
        for (const comment of commentsForm) {
            comment.classList.add('hidden');
        }
    }
}