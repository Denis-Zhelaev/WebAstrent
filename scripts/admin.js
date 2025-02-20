let incorrectAttempts = 0;
let selectedImage = null;

// Функция для возврата на главную страницу
function goToHomePage() {
    window.location.href = '/';  // ПЕРЕХОД НА ГЛАВНУЮ СТРАНИЦУ
}

// Аутентификация
function checkPassword() {
    const password = document.getElementById('password').value;
    fetch('/api/authenticate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.authenticated) {
            document.getElementById('overlay').style.display = 'none';
            document.querySelector('.admin-panel').style.display = 'flex';
        } else {
            incorrectAttempts++;
            alert('Неверный пароль');
            if (incorrectAttempts >= 3) {
                window.location.href = '/';
            }
        }
    })
    .catch(error => console.error('Ошибка:', error));
}

// Переключение между редактором и менеджером
function toggleEditor() {
    const editorContainer = document.getElementById('editorContainer');
    editorContainer.style.display = editorContainer.style.display === 'block' ? 'none' : 'block';
    document.getElementById('articleManagerContainer').style.display = 'none';
}

function toggleArticleManager() {
    const articleManagerContainer = document.getElementById('articleManagerContainer');
    articleManagerContainer.style.display = articleManagerContainer.style.display === 'block' ? 'none' : 'block';
    document.getElementById('editorContainer').style.display = 'none';
    if (articleManagerContainer.style.display === 'block') {
        loadArticles();
    }
}

// Загрузка статей
async function loadArticles() {
    try {
        const response = await fetch('/api/articles');
        const articles = await response.json();
        const articlesList = document.getElementById('articlesList');
        articlesList.innerHTML = '';

        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'article-item';
            const imagePath = article.imagePath ? `/newsPaper/newsImages/${article.imagePath.split('/').pop()}` : '/mainAssets/standart_news_photo.png';
            const title = article.title || 'Без названия';
            articleElement.innerHTML = `
                <img src="${imagePath}" alt="${title}" class="article-image">
                <div class="article-title">${title}</div>
                <div class="article-content">${article.content}</div>
                <div class="article-date">${article.createdAt}</div>
                <button class="delete-button" onclick="confirmDelete('${article.id}')">✖</button>
            `;
            articlesList.appendChild(articleElement);
        });
    } catch (error) {
        console.error('Ошибка загрузки статей:', error);
    }
}

// Удаление статьи
function confirmDelete(articleId) {
    if (confirm('Вы уверены, что хотите удалить эту статью?')) {
        deleteArticle(articleId);
    }
}

async function deleteArticle(articleId) {
    try {
        const response = await fetch(`/api/articles/${articleId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            loadArticles();
        } else {
            throw new Error('Ошибка при удалении');
        }
    } catch (error) {
        console.error('Ошибка удаления статьи:', error);
        alert('Произошла ошибка при удалении статьи');
    }
}

// Сохранение статьи
async function saveArticle() {
    const title = document.getElementById('titleInput').value;
    const content = document.getElementById('contentInput').innerHTML;
    const createdAt = new Date().toLocaleDateString('ru-RU');

    if (!title || !content) {
        alert('Заполните заголовок и содержание статьи!');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('createdAt', createdAt);
    if (selectedImage) {
        formData.append('image', selectedImage);
    }

    try {
        const response = await fetch('/api/save-article', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            alert('Статья успешно сохранена!');
            document.getElementById('titleInput').value = '';
            document.getElementById('contentInput').innerHTML = '';
            document.getElementById('imagePreview').textContent = '';
            document.getElementById('imagePreview').style.display = 'none';
            selectedImage = null;
        } else {
            throw new Error(data.error || 'Ошибка при сохранении');
        }
    } catch (error) {
        alert('Произошла ошибка при сохранении статьи: ' + error.message);
        console.error('Ошибка:', error);
    }
}

// Перетаскивание изображения
function handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[files.length - 1];
        if (file.type.startsWith('image/')) {
            selectedImage = file;
            const preview = document.getElementById('imagePreview');
            preview.textContent = file.name;
            preview.style.display = 'block';
        }
    }
}

function handleDragOver(e) {
    e.preventDefault();
}

// Форматирование текста в редакторе
function formatDoc(command) {
    document.execCommand(command, false, null);
}