document.addEventListener("DOMContentLoaded", function () {
    const menu = document.querySelector('.menu');
    const cover = document.querySelector('.cover');
    const info = document.querySelector('.info');
    const services = document.querySelector('.services');
    const news = document.querySelector('.news');
    const contacts = document.querySelector('.contacts');
    const overlay = document.querySelector('.service-details-overlay');
    const articlesList = document.getElementById('articlesList');
    const loadMoreButton = document.getElementById('loadMoreNews');

    let visibleNewsCount = 3; // Количество видимых новостей
    let allArticles = []; // Все статьи

    // ОПРЕДЕЛЕНИЕ УСТРОЙСТВА ПОЛЬЗОВАТЕЛЯ
    function detectDevice() {
        // Проверяем наличие сенсорного ввода
        const hasTouchScreen = 'ontouchstart' in window || 
                               (window.DocumentTouch && document instanceof DocumentTouch) ||
                               navigator.maxTouchPoints > 0;
    
        // Определение платформы
        const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
        // Дополнительная проверка для iOS устройств (включая iPad Air и iPad Pro)
        const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && typeof MessageEvent !== 'undefined' && !MessageEvent.prototype.source)) &&
                      !window.MSStream;
    
        // Специальная проверка для iPad Air и iPad Pro
        const isIPad = isIOS || 
                       (navigator.platform === 'MacIntel' && hasTouchScreen && 
                        window.screen.width >= 768 && window.screen.height >= 1024);
    
        // Проверка для планшетов
        const isTablet = isIPad || 
                         /Android|Tablet/i.test(navigator.userAgent);
    
        // Если устройство является планшетом или мобильным, и есть сенсорный ввод
        if ((isTablet || isMobile) && hasTouchScreen) {
            return 'mobile';
        }
    
        return 'desktop';
    }

    // ПРИМЕНЕНИЕ СТИЛЯ В ЗАВИСИМОСТИ ОТ УСТРОЙСТВА
    function applyStyleBasedOnDevice() {
        const deviceType = detectDevice();
        const existingLink = document.querySelector('link[rel="stylesheet"][href*="mainPage"]');
        if (existingLink) {
            existingLink.remove(); // Удаляем существующий стиль, если он есть
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        if (deviceType === 'mobile') {
            link.href = '/styles/mainPagePortal.css'; // Для мобильных устройств
        } else {
            link.href = '/styles/mainPage.css'; // Для десктопов
        }
        document.head.appendChild(link);
    }
    // ВЫЗОВ ФУНКЦИИ ДЛЯ ПРИМЕНЕНИЯ СТИЛЯ
    applyStyleBasedOnDevice();

    // Прокрутка к разделам при нажатии на пункты меню
    document.querySelectorAll('.nav-links a, .footer-links a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const deviceType = detectDevice();
                if (deviceType === 'mobile') {
                    // Для мобильных устройств скроллим на 10vh выше центра
                    const offset = window.innerHeight * 0.09; // 10vh выше центра
                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                } else {
                    // Для десктопов стандартный скролл
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Анимация появления при скролле
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.25 });
    observer.observe(cover);
    observer.observe(info);
    observer.observe(services);
    observer.observe(news);
    observer.observe(contacts);

    // Карусель
    let currentIndex = 0;
    const servicesArray = Array.from(document.querySelectorAll('.service'));
    const totalServices = servicesArray.length;
    let autoScrollInterval;

    function updateCarousel() {
        servicesArray.forEach((service, index) => {
            let position = (index - currentIndex + totalServices) % totalServices;
            service.classList.remove('left', 'center', 'right', 'hidden');
            if (position === 0) {
                service.classList.add('center');
            } else if (position === 1 || position === -6) {
                service.classList.add('right');
            } else if (position === -1 || position === 6) {
                service.classList.add('left');
            } else {
                service.classList.add('hidden');
            }
        });
    }

    function moveCarousel(direction) {
        currentIndex = (currentIndex - direction + totalServices) % totalServices;
        updateCarousel();
        resetAutoScroll();
    }

    function startAutoScroll() {
        autoScrollInterval = setInterval(() => {
            moveCarousel(-1);
        }, 4500);
    }

    function resetAutoScroll() {
        clearInterval(autoScrollInterval);
        startAutoScroll();
    }

    window.moveCarousel = moveCarousel;

    servicesArray.forEach(service => {
        service.addEventListener('click', function (e) {
            if (service.classList.contains('center')) {
                const detailsText = service.querySelector('.service-details').textContent;
                overlay.querySelector('.service-details-content').textContent = detailsText;
                overlay.classList.add('active');
                services.classList.add('blurred');
            } else if (service.classList.contains('left')) {
                moveCarousel(1);
            } else if (service.classList.contains('right')) {
                moveCarousel(-1);
            }
        });
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.classList.contains('service-details-overlay')) {
            overlay.classList.remove('active');
            services.classList.remove('blurred');
        }
    });

    updateCarousel();
    startAutoScroll();

    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
            moveCarousel(1);
        } else if (e.key === 'ArrowRight') {
            moveCarousel(-1);
        }
    });

    // Инициализация Яндекс Карты
    ymaps.ready(initMap);

    function initMap() {
        const myMap = new ymaps.Map('map', {
            center: [56.6382808, 47.8736806],
            zoom: 17
        });
        const myPlacemark = new ymaps.Placemark([56.6382808, 47.8736806], {
            hintContent: 'Компания «Астрент»',
            balloonContent: '3 подъезд, вход со двора'
        });
        myMap.geoObjects.add(myPlacemark);
    }

    // Загрузка списка статей
    async function loadArticles() {
        try {
            const response = await fetch('/api/articles');
            const articles = await response.json();
            allArticles = articles; // Сохраняем все статьи
            displayArticles(0, visibleNewsCount); // Отображаем первые три статьи
        } catch (error) {
            console.error('Ошибка загрузки статей:', error);
        }
    }


// Функция для отображения статей
function displayArticles(startIndex, endIndex) {
    articlesList.innerHTML = ''; // Очищаем список статей
    const articlesToShow = allArticles.slice(startIndex, endIndex);

    articlesToShow.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article-item';
        articleElement.dataset.articleId = article.id;

        const imagePath = article.imagePath ? `/newsPaper/newsImages/${article.imagePath.split('/').pop()}` : '/mainAssets/standart_news_photo.png';
        const title = article.title || 'Без названия'; // Убираем обрезание заголовка
        const contentPreview = article.content || 'Нет содержания'; // Используем уже обрезанный контент (первые 50 символов)
        const date = article.createdAt || 'Дата не указана'; // Используем createdAt, который приходит с сервера

        articleElement.innerHTML = `
            <img src="${imagePath}" alt="${title}" class="article-image">
            <div class="article-title">${title}</div> <!-- Заголовок без обрезания -->
            <div class="article-preview">${contentPreview}</div> <!-- Отображаем первые 50 символов контента -->
            <div class="article-date">${date}</div> <!-- Дата в формате ДД.ММ.ГГГГ -->
        `;

        // Добавляем обработчик клика для открытия статьи
        articleElement.addEventListener('click', () => {
            openArticle(article.id);
        });

        articlesList.appendChild(articleElement);
    });

    // Показываем кнопку "Ещё", если есть ещё статьи
    if (endIndex < allArticles.length) {
        loadMoreButton.style.display = 'block';
    } else {
        loadMoreButton.style.display = 'none';
    }
}

    // Функция для открытия статьи
    function openArticle(articleId) {
        window.location.href = `/newsPaper/newsArticles/${articleId}.html`;
    }

    // Обработчик кнопки "Ещё"
    loadMoreButton.addEventListener('click', () => {
        visibleNewsCount += 3; // Увеличиваем количество видимых новостей
        displayArticles(0, visibleNewsCount); // Отображаем новые статьи

        // Расширяем контейнер новостей
        news.classList.add('expanded');
    });

    // Вызов функции загрузки статей после загрузки DOM
    loadArticles();
});