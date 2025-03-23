const galleriesRouter = require("express").Router();

const {
  getGalleries,
  getGalleriesByUserId,
  deleteGalleryByGalleryId,
  deleteAllGalleriesByUserId,
  postGallery,
  patchGallery,
} = require("../controllers/galleries-controller");

galleriesRouter.get("/", getGalleries);
galleriesRouter.get("/user/:user_id", getGalleriesByUserId);
galleriesRouter.delete("/:gallery_id", deleteGalleryByGalleryId);
galleriesRouter.delete("/user/:user_id", deleteAllGalleriesByUserId);
galleriesRouter.post("/user/:user_id", postGallery);
galleriesRouter.patch("/:gallery_id/:user_id", patchGallery);

module.exports = galleriesRouter;
