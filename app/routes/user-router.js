const userRouter = require("express").Router();
const favoritesRouter = require("./favorites-router");

const {
  getUser,
  postUser,
  patchUser,
  deleteUser,
} = require("../controllers/user-controller");

userRouter.use("/:user_id/favorites", favoritesRouter);

userRouter.post("/", postUser);
userRouter.patch("/:user_id", patchUser);
userRouter.delete("/:user_id", deleteUser);
userRouter.get("/:user_id", getUser);
module.exports = userRouter;
