const db = require("../../db/connection");
const { checkValueExists } = require("../../db/utils");

exports.selectGalleries = () => {
  return db
    .query(
      `
    SELECT * FROM galleries;`
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.selectGalleriesByUserId = (user_id) => {
  return Promise.all(checkValueExists("users", "user_id", user_id))
    .then(() => {
      return db.query(
        `
      SELECT *
      FROM galleries 
      WHERE user_id = $1;`,
        [user_id, gallery_id]
      );
    })
    .then(({ rows: [gallery] }) => {
      return gallery;
    });
};

exports.removeGalleryByGalleryId = (user_id, gallery_id) => {
  const checkExists = [
    checkValueExists("galleries", "gallery_id", gallery_id),
    checkValueExists("users", "user_id", user_id),
  ];
  return Promise.all(checkExists).then(() => {
    return db
      .query(
        `
    SELECT user_id FROM galleries
    WHERE gallery_id = $1;`,
        [gallery_id]
      )
      .then(({ rows: [owner] }) => {
        if (owner.user_id !== +user_id) {
          return Promise.reject({ status: 400, msg: "BAD REQUEST" });
        }
      })
      .then(() => {
        return db.query(
          `
    DELETE FROM galleries
    WHERE user_id = $1 AND gallery_id = $2;`,
          [user_id, gallery_id]
        );
      });
  });
};

exports.removeAllGalleriesByUserId = (user_id) => {
  const checkExists = [
    checkValueExists("galleries", "gallery_id", gallery_id),
    checkValueExists("users", "user_id", user_id),
  ];
  return Promise.all(checkExists).then(() => {
    return db.query(
      `
    DELETE FROM galleries
    WHERE user_id = $1;`,
      [user_id]
    );
  });
};

exports.insertGallery = (
  { created_at, image_url, title, description },
  user_id
) => {
  return db
    .query(
      `
    INSERT INTO galleries
        (created_at,
        image_url,
        title,
        description,
        user_id)
    VALUES
        ($1, $2, $3, $4, $5)
    RETURNING *;`,
      [created_at, image_url, title, description, user_id]
    )
    .then(({ rows: [gallery] }) => {
      return gallery;
    });
};

exports.updateGallery = (patchBody, user_id, gallery_id) => {
  const checkExists = [
    checkValueExists("galleries", "gallery_id", gallery_id),
    checkValueExists("users", "user_id", user_id),
  ];
  return Promise.all(checkExists)
    .then(() => {
      const queryParams = [];
      const allowedColumns = [image_url, title, description];
      let count = Object.keys(patchBody).length;
      let queryStr = "UPDATE galleries SET ";
      for (const key in patchBody) {
        if (!allowedColumns.includes(key)) {
          return Promise.reject({ status: 400, msg: "BAD REQUEST" });
        }
        const value = patchBody[key];
        queryStr += `${key} = $${count + 2}`;
        queryParams.unshift(value);
        queryStr += count > 1 ? ", " : " ";
        count--;
      }
      queryParams.unshift(user_id, gallery_id);
      queryStr += `WHERE user_id = $1 AND gallery_id = $2 RETURNING *;`;
      return db.query(queryStr, queryParams);
    })
    .then(({ rows: [gallery] }) => {
      if (!gallery) {
        return Promise.reject({ status: 400, msg: "BAD REQUEST" });
      }
      return gallery;
    });
};
