from flask import Flask, request, jsonify, send_from_directory, Markup
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import re
from bs4 import BeautifulSoup 
import secrets

# Создаем экземпляр Flask
application = Flask(__name__)

# Конфигурация
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'newsPaper/newsImages')
ARTICLES_FOLDER = os.path.join(os.path.dirname(__file__), 'newsPaper/newsArticles')
application.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
application.config['ARTICLES_FOLDER'] = ARTICLES_FOLDER
application.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  

# Объявляем статические папки
application.add_url_rule('/mainAssets/<path:filename>', endpoint='mainAssets', view_func=lambda filename: send_from_directory('mainAssets', filename))
application.add_url_rule('/scripts/<path:filename>', endpoint='scripts', view_func=lambda filename: send_from_directory('scripts', filename))
application.add_url_rule('/styles/<path:filename>', endpoint='styles', view_func=lambda filename: send_from_directory('styles', filename))
application.add_url_rule('/newsPaper/newsImages/<path:filename>', endpoint='newsImages', view_func=lambda filename: send_from_directory('newsPaper/newsImages', filename))
application.add_url_rule('/newsPaper/newsArticles/<path:filename>', endpoint='newsArticles', view_func=lambda filename: send_from_directory('newsPaper/newsArticles', filename))

# Пароль администратора
ADMIN_PASSWORD = 'admin123'

# Счетчик неудачных попыток входа
incorrect_attempts = 0

# Хранение токенов
active_tokens = set()

# Загрузка страниц
@application.route('/')
def main_page():
    return send_from_directory('index', 'mainPage.html')

@application.route('/admin')
def admin_page():
    return send_from_directory('index', 'admin.html')

# API
@application.route('/api/authenticate', methods=['POST'])
def authenticate():
    global incorrect_attempts  
    data = request.get_json()
    if data.get('password') == ADMIN_PASSWORD:
        incorrect_attempts = 0
        token = secrets.token_hex(16)
        active_tokens.add(token)
        return jsonify({'authenticated': True, 'token': token})
    else:
        incorrect_attempts += 1
        if incorrect_attempts >= 3:
            return jsonify({'authenticated': False, 'redirect': '/'}), 401
        return jsonify({'authenticated': False}), 401

@application.route('/api/check-token', methods=['POST'])
def check_token():
    data = request.get_json()
    token = data.get('token')
    if token in active_tokens:
        return jsonify({'valid': True})
    else:
        return jsonify({'valid': False}), 401

@application.route('/api/articles', methods=['GET'])
def get_articles():
    articles = []
    try:
        for filename in os.listdir(application.config['ARTICLES_FOLDER']):
            if filename.endswith('.html'):
                with open(os.path.join(application.config['ARTICLES_FOLDER'], filename), 'r', encoding='utf-8') as file:
                    content = file.read()
                    title = content.split('<h2 class="title">')[1].split('</h2>')[0] if '<h2 class="title">' in content else 'Без названия'
                    image_path = content.split('<img src="')[1].split('"')[0] if '<img src="' in content else None
                    created_at = content.split('<p class="created-at">')[1].split('</p>')[0] if '<p class="created-at">' in content else '01.01.1970'
                    short_content = content.split('<p class="text">')[1].split('</p>')[0][:50] + '...' if '<p class="text">' in content else ''
                    articles.append({
                        'id': filename.split('.')[0],
                        'title': title,
                        'content': short_content,
                        'imagePath': image_path,
                        'createdAt': created_at
                    })
        
        # Сортировка статей по дате (сначала свежие)
        articles.sort(key=lambda x: datetime.strptime(x['createdAt'], '%d.%m.%Y'), reverse=True)
        
        return jsonify(articles)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application.route('/api/articles/<article_id>', methods=['DELETE'])
def delete_article(article_id):
    try:
        article_path = os.path.join(application.config['ARTICLES_FOLDER'], f'{article_id}.html')
        if os.path.exists(article_path):
            os.remove(article_path)
            return jsonify({'success': True})
        return jsonify({'error': 'Статья не найдена'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application.route('/api/save-article', methods=['POST'])
def save_article():
    try:
        title = request.form.get('title')
        content = request.form.get('content')
        created_at = request.form.get('createdAt', datetime.now().strftime('%d.%m.%Y'))
        image = request.files.get('image')

        if not title or not content:
            return jsonify({'error': 'Заполните заголовок и содержание статьи'}), 400

        # Генерация имени файла с поддержкой кириллицы
        title_cleaned = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')
        article_filename = f"{title_cleaned}.html"

        image_path = None
        if image:
            filename = secure_filename(f"{datetime.now().timestamp()}-{image.filename}")
            image.save(os.path.join(application.config['UPLOAD_FOLDER'], filename))
            image_path = f'/newsImages/{filename}'

        # Использование Markup для корректного отображения HTML
        content = Markup(content)

        article_html = f"""
                        <!DOCTYPE html>
                        <html lang="ru">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>{title}</title>
                            <link rel="stylesheet" href="../../styles/instance_news.css">
                        </head>
                        <body>
                            <header class="menu">
                                <a href="/" class="back-button">Назад</a>
                                <h1 class="menu-title">Астрент.Новости</h1>
                            </header>
                            <main class="content">
                                <h2 class="title">{title}</h2>
                                {f'<img src="..{image_path}" alt="Фото новости" class="news-image">' if image_path else ''}
                                <p class="text">{content}</p>
                                <p class="created-at">{created_at}</p>
                            </main>
                            <button class="scroll-to-top" onclick="scrollToTop()">↑</button>
                            <script>
                                function scrollToTop() {{
                                    window.scrollTo({{
                                        top: 0,
                                        behavior: 'smooth'
                                    }});
                                }}

                                window.onscroll = function() {{
                                    var scrollButton = document.querySelector('.scroll-to-top');
                                    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {{
                                        scrollButton.style.display = 'block';
                                    }} else {{
                                        scrollButton.style.display = 'none';
                                    }}
                                }};
                            </script>
                        </body>
                        </html>
        """
        with open(os.path.join(application.config['ARTICLES_FOLDER'], article_filename), 'w', encoding='utf-8') as file:
            file.write(article_html)

        return jsonify({'success': True, 'fileName': article_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Запуск
if __name__ == '__main__':
    os.makedirs(application.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(application.config['ARTICLES_FOLDER'], exist_ok=True)
    application.run(host='0.0.0.0', port=5000, debug=True)