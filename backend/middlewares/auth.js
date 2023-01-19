const jwt = require('jsonwebtoken');
const UnauthorizedError = require('../errors/unauthorizedError');
require('dotenv')
  .config();

const { JWT_SECRET, NODE_ENV = 'dev' } = process.env;

module.exports = (req, res, next) => {
  const jwtKey = req.cookies.jwt;

  if (!jwtKey) return next(new UnauthorizedError('Необходима авторизация'));

  let payload;

  try {
    payload = jwt.verify(jwtKey, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');
  } catch (err) {
    return next(new UnauthorizedError('Авторизация не пройдена'));
  }

  req.user = payload;

  return next();
};
