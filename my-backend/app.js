const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8081;

// MIME типы
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.JPG': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Обработка отправки формы
    if (req.method === 'POST' && pathname === '/submit-form') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                // Парсим данные формы
                const formData = JSON.parse(body);
                const { name, email, comment } = formData;
                
                // Проверяем данные
                if (!name || !email || !comment) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Заполните все поля' }));
                    return;
                }
                
                // Проверяем email
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Некорректный email' }));
                    return;
                }
                
                // Сохраняем в файл
                const submission = {
                    date: new Date().toISOString(),
                    name: name.trim(),
                    email: email.trim(),
                    comment: comment.trim()
                };
                
                const data = JSON.stringify(submission, null, 2) + '\n---\n';
                fs.appendFileSync('submissions.txt', data);
                
                console.log('📩 Новая заявка:', submission);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Заявка принята' }));
                
            } catch (error) {
                console.error('Ошибка обработки формы:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Ошибка сервера' }));
            }
        });
        
        return;
    }
    
    // Раздача статических файлов
    if (req.method === 'GET') {
        let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
        
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // Файл не найден - отдаем index.html
                    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
                        if (err) {
                            res.writeHead(500);
                            res.end('Server Error');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(content, 'utf8');
                        }
                    });
                } else {
                    res.writeHead(500);
                    res.end('Server Error');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf8');
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Доступен по адресу: http://localhost:${PORT}`);
});