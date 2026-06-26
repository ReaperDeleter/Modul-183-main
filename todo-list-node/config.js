module.exports = {
    host:     process.env.DB_HOST     || 'm183-lb2-db',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME     || 'm183_lb2'
};