const Card = require('../models/card');
const NotValidError = require('../errors/notValidError');
const NotFoundError = require('../errors/notFoundError');
const ForbiddenError = require('../errors/forbiddenError');

const createCard = (req, res, next) => {
  const {
    name,
    link,
  } = req.body;

  Card.create({
    name,
    link,
    owner: req.user._id,
  })
    .then((card) => res.status(201)
      .send(card))
    .catch((error) => {
      if (error.name === 'ValidationError') return next(new NotValidError('Переданы некорректные данные при создании карточки'));

      return next(error);
    });
};
const getCards = (req, res, next) => {
  Card.find({})
    .then((cards) => res.status(200)
      .send(cards))
    .catch(next);
};

const deleteCardById = (req, res, next) => {
  const { cardId } = req.params;
  const { _id: userId } = req.user;

  Card.findById(cardId)
    .populate('owner')
    .then((card) => {
      if (!card) throw new NotFoundError('Карточка с указанным _id не найдена');
      if (card.owner._id.valueOf() !== userId) throw new ForbiddenError('Нельзя удалить чужую карточку');

      Card.findByIdAndDelete(card._id)
        .then((removedCard) => res.status(200)
          .send(removedCard))
        .catch(next);
    })
    .catch(next);
};

const addLikeCard = (req, res, next) => {
  const { cardId } = req.params;

  Card.findByIdAndUpdate(
    cardId,
    { $addToSet: { likes: req.user._id } },
    {
      new: true,
      runValidators: true,
      upsert: false,
    },
  )
    .then((card) => {
      if (!card) return next(new NotFoundError('Передан несуществующий _id'));

      return res.status(200)
        .send(card);
    })
    .catch((error) => {
      if (error.name === 'CastError') return next(new NotValidError('Передан несуществующий _id карточки'));
      if (error.name === 'ValidationError') return next(new NotValidError('Переданы некорректные данные для постановки/снятии лайка'));

      return next(error);
    });
};

const deleteLikeCard = (req, res, next) => {
  const { cardId } = req.params;

  Card.findByIdAndUpdate(
    cardId,
    { $pull: { likes: req.user._id } },
    {
      new: true,
      runValidators: true,
      upsert: false,
    },
  )
    .then((card) => {
      if (!card) throw new NotFoundError('Передан несуществующий _id');

      res.status(200)
        .send(card);
    })
    .catch((error) => {
      if (error.name === 'CastError') return next(new NotValidError('Передан несуществующий _id карточки'));

      return next(error);
    });
};

module.exports = {
  createCard,
  getCards,
  deleteCardById,
  addLikeCard,
  deleteLikeCard,
};
