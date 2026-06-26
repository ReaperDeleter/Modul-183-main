const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const header = require('./fw/header');
const footer = require('./fw/footer');
const login = require('./login');
const index = require('./index');
const adminUser = require('./admin/users');
const editTask = require('./edit');
const saveTask = require('./savetask');
const search = require('./search');
const searchProvider = require('./search/v2/index');

const app = express();
const PORT = 3000;

// Rate-Limiting für Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Zu viele Login-Versuche. Bitte warte 15 Minuten.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Routen
app.get('/', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await index.html(req), req);
        res.send(html);
    } else {
        res.redirect('login');
    }
});

app.post('/', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await index.html(req), req);
        res.send(html);
    } else {
        res.redirect('login');
    }
});

app.get('/admin/users', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await adminUser.html(req), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

app.get('/edit', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await editTask.html(req), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// Login — GET zeigt Formular, POST verarbeitet
app.get('/login', async (req, res) => {
    if (activeUserSession(req)) return res.redirect('/');
    const content = await login.handleLogin(req, res);
    let html = await wrapContent(content.html, req);
    res.send(html);
});

app.post('/login', loginLimiter, async (req, res) => {
    const content = await login.handleLogin(req, res);
    if (content.user.userid !== 0) {
        login.startUserSession(req, res, content.user);
    } else {
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('username', { httpOnly: true, secure: true, sameSite: 'strict' });
    res.clearCookie('userid',   { httpOnly: true, secure: true, sameSite: 'strict' });
    res.redirect('/login');
});

app.get('/profile', (req, res) => {
    if (activeUserSession(req)) {
        res.send(`Welcome, ${req.session.username}! <a href="/logout">Logout</a>`);
    } else {
        res.send('Please login to view this page');
    }
});

app.post('/savetask', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await saveTask.html(req), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

app.post('/search', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await search.html(req);
        res.send(html);
    } else {
        res.redirect('/login');
    }
});

app.get('/search/v2/', async (req, res) => {
    if (activeUserSession(req)) {
        let result = await searchProvider.search(req);
        res.send(result);
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

async function wrapContent(content, req) {
    let headerHtml = await header(req);
    return headerHtml + content + footer;
}

function activeUserSession(req) {
    return req.session && req.session.userId !== undefined;
}