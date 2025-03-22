const {
  selectFavorites,
  insertFavorite,
  removeFavoriteByFavoriteId,
} = require("../models/favorites-model");

exports.getFavorites = (req, res, next) => {
  const { user_id } = req.params;
  selectFavorites(user_id)
    .then((favorites) => {
      res.status(200).send({ favorites });
    })
    .catch((err) => next(err));
};

exports.postFavorite = (req, res, next) => {
  const newFavorite = req.body;
  const { user_id } = req.params;
  insertFavorite(user_id, newFavorite)
    .then((favorite) => {
      res.status(201).send({ favorite });
    })
    .catch((err) => next(err));
};

exports.deleteFavorite = (req, res, next) => {
  const { user_id, favorites_id } = req.params;
  removeFavoriteByFavoriteId(user_id, favorites_id)
    .then((favorite) => {
      res.status(204).send();
    })
    .catch((err) => {
      next(err);
    });
};
