const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const NotFoundError = require('../errors/notFoundError');
const NotValidError = require('../errors/notValidError');
const ConflictError = require('../errors/conflictError');
const UnauthorizedError = require('../errors/unauthorizedError');

require('dotenv')
  .config();

const { JWT_SECRET = 'dev-secret' } = process.env;

const getAuthUser = (req, res, next) => {
  const { _id: userId } = req.user;

  User.findById(userId)
    .then((user) => res.status(200)
      .send(user))
    .catch((error) => {
      if (error.name === 'CastError') return next(new NotFoundError('Пользователь по указанному _id не найден'));

      return next(next);
    });
};

const createUser = (req, res, next) => {
  const {
    name,
    about,
    avatar,
    email,
    password,
  } = req.body;

  bcrypt.hash(password, 10)
    .then((hash) => User.create(
      {
        name,
        about,
        avatar,
        email,
        password: hash,
      },
    ))

    .then((user) => res.status(201)
      .send({
        _id: user._id,
        name: user.name,
        about: user.about,
        avatar: user.avatar,
        email: user.email,
      }))
    .catch((error) => {
      if (error.name === 'ValidationError') return next(new NotValidError('Переданы некорректные данные при создании пользователя'));
      if (error.code === 11000) return next(new ConflictError('Пользователь с таким email уже зарегистрирован'));

      return next(error);
    });
};
const getUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.status(200)
      .send(users))
    .catch(next);
};

const getUserById = (req, res, next) => {
  const { userId } = req.params;

  User.findById(userId)
    .then((user) => {
      if (!user) throw new NotFoundError('Пользователь по указанному _id не найден');

      return res.status(200)
        .send(user);
    })
    .catch((error) => {
      if (error.name === 'CastError') return next(new NotValidError('Пользователь по указанному _id не найден'));

      return next(error);
    });
};

const updateUser = (req, res, next) => {
  const {
    name,
    about,
  } = req.body;
  const { _id: userId } = req.user;

  User.findByIdAndUpdate(
    userId,
    {
      name,
      about,
    },
    {
      new: true,
      runValidators: true,
      upsert: false,
    },
  )
    .then((user) => res.status(200)
      .send(user))
    .catch((error) => {
      if (error.name === 'CastError') return next(new NotFoundError('Пользователь по указанному _id не найден'));
      if (error.name === 'ValidationError') return next(new NotValidError('Переданы некорректные данные при обновлении профиля'));

      return next(error);
    });
};

const updateAvatarUser = (req, res, next) => {
  const { avatar } = req.body;
  const { _id: userId } = req.user;

  User.findByIdAndUpdate(
    userId,
    { avatar },
    {
      new: true,
      runValidators: true,
      upsert: false,
    },
  )
    .then((user) => res.status(200)
      .send(user))
    .catch((error) => {
      if (error.name === 'CastError') return next(new NotFoundError('Пользователь по указанному _id не найден'));
      if (error.name === 'ValidationError') return next(new NotValidError('Переданы некорректные данные при обновлении аватара'));

      return next(error);
    });
};

const login = (req, res, next) => {
  const {
    email,
    password,
  } = req.body;

  User.findOne({ email })
    .select('+password')
    .then((user) => {
      if (!user) throw new UnauthorizedError('Неправильные почта или пароль');

      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!user || !matched) throw new UnauthorizedError('Неправильные почта или пароль');

          const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '7d' });

          res
            .cookie('jwt', token, {
              maxAge: 604800,
              httpOnly: true,
              sameSite: true,
            })
            .status(200)
            .send({ message: 'Авторизация прошла успешно!' })
            .end();
        });
    })
    .catch(next);
};

const signOut = (req, res) => {
  res.clearCookie('jwt').send({ message: 'cookie удалена!' });
};

const successfulAuth = (req, res) => {
  res.send({ message: 'Пользователь авторизован!' });
};

module.exports = {
  getAuthUser,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateAvatarUser,
  login,
  signOut,
  successfulAuth,
};
