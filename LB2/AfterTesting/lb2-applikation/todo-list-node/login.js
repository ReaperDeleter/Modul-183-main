const db = require('./fw/db');
const bcrypt = require('bcrypt');

async function handleLogin(req, res) {
    let msg = '';
    let user = { username: '', userid: 0 };
    const username = req.body?.username;
    const password = req.body?.password;

    if (
        typeof username === 'string' &&
        typeof password === 'string'
    ) {
        const result = await validateLogin(
            username.trim(),
            password
        );
        if (result.valid) {
            user.username = username.trim();
            user.userid = result.userId;
            msg = result.msg;
        } else {
            msg = result.msg;
        }
    }
    return {
        html: msg + getHtml(),
        user: user
    };
}

function startUserSession(req, res, user) {
    console.log(`login valid for userid ${user.userid}`);
    const secureCookie = process.env.NODE_ENV === 'production';

    req.session.userId   = user.userid;
    req.session.username = user.username;

    res.cookie('username', user.username, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24
    });
    res.cookie('userid', user.userid, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24
    });
    res.redirect('/');
}

async function validateLogin(username, password) {
    const result = {
        valid: false,
        msg: 'Invalid username or password',
        userId: 0
    };
    if (!username || !password) {
        return result;
    }
    if (username.length > 255 || password.length > 255) {
        return result;
    }
    let dbConnection;
    try {
        dbConnection = await db.connectDB();
        const sql =
            'SELECT id, username, password FROM users WHERE username = ? LIMIT 1';
        const [results] = await dbConnection.query(sql, [username]);
        if (results.length === 0) {
            return result;
        }
        const dbUser = results[0];
        const passwordValid = await bcrypt.compare(
            password,
            dbUser.password
        );
        if (passwordValid) {
            result.valid = true;
            result.userId = dbUser.id;
            result.msg = 'Login successful';
        }
    } catch (err) {
        console.error('Login error:', err.message);
    }
    return result;
}

function getHtml() {
    return `
    <h2>Login</h2>
    <form id="form" method="post" action="/login">
        <div class="form-group">
            <label for="username">Username</label>
            <input
                type="text"
                class="form-control size-medium"
                name="username"
                id="username"
                maxlength="255"
                required
                autocomplete="username">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input
                type="password"
                class="form-control size-medium"
                name="password"
                id="password"
                maxlength="255"
                required
                autocomplete="current-password">
        </div>
        <div class="form-group">
            <input
                id="submit"
                type="submit"
                class="btn size-auto"
                value="Login">
        </div>
    </form>`;
}

module.exports = {
    handleLogin,
    startUserSession
};