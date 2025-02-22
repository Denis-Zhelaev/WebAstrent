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
        const hasTouchScreen = 'ontouchstart' in window || 
                               (window.DocumentTouch && document instanceof DocumentTouch) ||
                               navigator.maxTouchPoints > 0;
        const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && typeof MessageEvent !== 'undefined' && !MessageEvent.prototype.source)) &&
                      !window.MSStream;
        const isIPad = isIOS || 
                       (navigator.platform === 'MacIntel' && hasTouchScreen && 
                        window.screen.width >= 768 && window.screen.height >= 1024);
        const isTablet = isIPad || 
                         /Android|Tablet/i.test(navigator.userAgent);
    
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
            existingLink.remove();
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = deviceType === 'mobile' ? '/styles/mainPagePortal.css' : '/styles/mainPage.css';
        document.head.appendChild(link);
    }
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
                    const offset = window.innerHeight * 0.09;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                } else {
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
        const deviceType = detectDevice(); // Определяем тип устройства
        const indicatorsContainer = document.querySelector('.carousel-indicators'); // Контейнер для индикаторов
    
        if (deviceType === 'mobile') {
            // Логика для мобильных устройств
            if (!indicatorsContainer) {
                // Создаем контейнер для индикаторов, если его нет
                const indicators = document.createElement('div');
                indicators.className = 'carousel-indicators';
                document.querySelector('.services-carousel').appendChild(indicators);
            }
    
            // Очищаем индикаторы и создаем новые
            const indicators = document.querySelector('.carousel-indicators');
            indicators.innerHTML = '';
            for (let i = 0; i < totalServices; i++) {
                const indicator = document.createElement('div');
                indicator.className = 'indicator';
                if (i === currentIndex) {
                    indicator.classList.add('active');
                }
                indicators.appendChild(indicator);
            }
    
            // Обновляем видимость карточек
            servicesArray.forEach((service, index) => {
                service.classList.remove('left', 'center', 'right', 'hidden');
                if (index === currentIndex) {
                    service.classList.add('center'); // Только центральная карточка видна
                    service.style.transform = 'translateX(0) scale(1)'; // Нормальный размер
                    service.style.opacity = '1';
                } else {
                    service.classList.add('hidden'); // Остальные карточки скрыты
                    service.style.opacity = '0';
                }
            });
        } else {
            // Логика для десктопов (оставляем текущую логику)
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
    
            // Удаляем индикаторы, если они есть (для десктопов они не нужны)
            if (indicatorsContainer) {
                indicatorsContainer.remove();
            }
        }
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

    // Логика свайпа для мобильных устройств
    let touchStartX = 0;
    let touchEndX = 0;

    if (detectDevice() === 'mobile') {
        servicesArray.forEach(service => {
            service.addEventListener('touchstart', handleTouchStart, { passive: true });
            service.addEventListener('touchmove', handleTouchMove, { passive: true });
            service.addEventListener('touchend', handleTouchEnd);
        });
    }

    function handleTouchStart(event) {
        touchStartX = event.touches[0].clientX;
    }

    function handleTouchMove(event) {
        touchEndX = event.touches[0].clientX;
    }

    function handleTouchEnd() {
        if (touchEndX < touchStartX) {
            moveCarousel(-1); // Свайп влево
        } else if (touchEndX > touchStartX) {
            moveCarousel(1); // Свайп вправо
        }
        touchStartX = 0;
        touchEndX = 0;
    }

    // Обработчик для кнопки "Подробнее"
    document.querySelectorAll('.details-button').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation(); // Останавливаем всплытие события
            const service = this.closest('.service');
            const detailsText = service.querySelector('.service-details').textContent;
            overlay.querySelector('.service-details-content').textContent = detailsText;
            overlay.classList.add('active');
            services.classList.add('blurred');
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
            allArticles = articles;
            displayArticles(0, visibleNewsCount);
        } catch (error) {
            console.error('Ошибка загрузки статей:', error);
        }
    }

    function displayArticles(startIndex, endIndex) {
        articlesList.innerHTML = '';
        const articlesToShow = allArticles.slice(startIndex, endIndex);

        articlesToShow.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'article-item';
            articleElement.dataset.articleId = article.id;

            const imagePath = article.imagePath ? `/newsPaper/newsImages/${article.imagePath.split('/').pop()}` : '/mainAssets/standart_news_photo.png';
            const title = article.title || 'Без названия';
            const contentPreview = article.content || 'Нет содержания';
            const date = article.createdAt || 'Дата не указана';

            articleElement.innerHTML = `
                <img src="${imagePath}" alt="${title}" class="article-image">
                <div class="article-title">${title}</div>
                <div class="article-preview">${contentPreview}</div>
            `;

            // Используем textContent для даты
            const dateElement = document.createElement('div');
            dateElement.className = 'article-date';
            dateElement.textContent = date; // Используем textContent вместо innerHTML
            articleElement.appendChild(dateElement);

            articleElement.addEventListener('click', () => {
                openArticle(article.id);
            });

            articlesList.appendChild(articleElement);
        });

        if (endIndex < allArticles.length) {
            loadMoreButton.style.display = 'block';
        } else {
            loadMoreButton.style.display = 'none';
        }
    }

    function openArticle(articleId) {
        window.location.href = `/newsPaper/newsArticles/${articleId}.html`;
    }

    loadMoreButton.addEventListener('click', () => {
        visibleNewsCount += 3;
        displayArticles(0, visibleNewsCount);
        news.classList.add('expanded');
    });

    loadArticles();
});