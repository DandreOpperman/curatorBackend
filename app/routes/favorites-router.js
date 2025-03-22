const favoritesRouter = require("express").Router({ mergeParams: true });
const {
  getFavorites,
  postFavorite,
  deleteFavorite,
} = require("../controllers/favorites-controller");

favoritesRouter.get("/", getFavorites);
favoritesRouter.post("/", postFavorite);
favoritesRouter.delete("/:favorites_id", deleteFavorite);

module.exports = favoritesRouter;
