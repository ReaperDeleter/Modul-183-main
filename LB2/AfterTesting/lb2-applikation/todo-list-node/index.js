const tasklist = require('./user/tasklist');
const bgSearch = require('./user/backgroundsearch');

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function getHtml(req) {
    let taskListHtml = await tasklist.html(req);
    const username = escHtml(req.cookies.username);
    return `<h2>Welcome, ${username}!</h2>` + taskListHtml + '<hr />' + bgSearch.html(req);
}

module.exports = {
    html: getHtml
};