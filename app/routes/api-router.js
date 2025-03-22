const apiRouter = require("express").Router();
const userRouter = require("./user-router.js");
const galleriesRouter = require("./galleries-router.js");
const endpoints = require("../../endpoints.json");

apiRouter.use("/user", userRouter);
apiRouter.use("/galleries", galleriesRouter);

apiRouter.get("/", (req, res) => {
  res.status(200).send({ endpoints });
});

module.exports = apiRouter;
