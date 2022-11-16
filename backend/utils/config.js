require('dotenv').config()

const { DATABASE_URL, JWT_SECRET, NODE_ENV } = process.env

const SALT_ROUNDS = 10
const JWT_EXPIRATION_DAYS = 7
const JWT_EXPIRATION_SECONDS = JWT_EXPIRATION_DAYS * 24 * 60 * 60

module.exports = {
    DATABASE_URL,
    JWT_SECRET,
    JWT_EXPIRATION_DAYS,
    JWT_EXPIRATION_SECONDS,
    NODE_ENV,
    SALT_ROUNDS,
}
