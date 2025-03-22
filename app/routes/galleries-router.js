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
galleriesRouter.get("/:user_id", getGalleriesByUserId);
galleriesRouter.delete("/:gallery_id", deleteGalleryByGalleryId);
galleriesRouter.delete("/user_id", deleteAllGalleriesByUserId);
galleriesRouter.post("/:gallery_id", postGallery);
galleriesRouter.patch("/:gallery_id/:user_id", patchGallery);

module.exports = galleriesRouter;
