const {
  selectGalleries,
  selectGalleryByUserId,
  removeGalleryByGalleryId,
  removeAllGalleriesByUserId,
  insertGallery,
  updateGallery,
} = require("../models/galleries-model");

exports.getGalleries = (req, res, next) => {
  selectGalleries()
    .then((galleries) => {
      res.status(200).send({ galleries });
    })
    .catch((err) => next(err));
};

exports.getGalleriesByUserId = (req, res, next) => {
  const { user_id } = req.params;
  selectGalleryByUserId(user_id)
    .then((transaction) => {
      res.status(200).send({ transaction });
    })
    .catch((err) => next(err));
};

exports.deleteGalleryByGalleryId = (req, res, next) => {
  const { user_id, gallery_id } = req.params;
  removeGalleryByGalleryId(user_id, gallery_id)
    .then(() => {
      res.status(204).send();
    })
    .catch((err) => next(err));
};

exports.deleteAllGalleriesByUserId = (req, res, next) => {
  const { user_id } = req.params;
  removeAllGalleriesByUserId(user_id)
    .then(() => {
      res.status(204).send();
    })
    .catch((err) => next(err));
};

exports.postGallery = (req, res, next) => {
  const requestBody = req.body;
  const { user_id } = req.params;
  insertGallery(requestBody, user_id)
    .then((gallery) => {
      res.status(201).send({ gallery });
    })
    .catch((err) => next(err));
};

exports.patchGallery = (req, res, next) => {
  const requestBody = req.body;
  const { user_id, gallery_id } = req.params;
  updateGallery(requestBody, user_id, gallery_id)
    .then((transaction) => {
      res.status(200).send({ transaction });
    })
    .catch((err) => next(err));
};
