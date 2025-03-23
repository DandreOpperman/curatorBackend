const db = require("../../db/connection");
const {
  checkValueExists,
  checkForItems,
  checkIfItemInGallery,
} = require("../../db/utils");

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
  const checkExists = checkValueExists("users", "user_id", user_id);
  return checkExists
    .then(() => {
      return db.query(
        `
      SELECT *
      FROM galleries 
      WHERE user_id = $1;`,
        [user_id]
      );
    })
    .then(({ rows }) => {
      return rows;
    });
};

exports.removeGalleryByGalleryId = (gallery_id) => {
  const checkExists = checkValueExists("galleries", "gallery_id", gallery_id);
  return checkExists.then(() => {
    return db.query(
      `
    DELETE FROM galleries
    WHERE gallery_id = $1;`,
      [gallery_id]
    );
  });
};

exports.removeAllGalleriesByUserId = (user_id) => {
  const checkExists = checkValueExists("users", "user_id", user_id);
  return checkExists.then(() => {
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
    checkIfItemInGallery(user_id, gallery_id, patchBody.items),
  ];
  let sameItem = false;
  console.log("here");
  return Promise.all(checkExists)
    .then((res) => {
      sameItem = res[2];
      let galleryHasItems = checkForItems(user_id);
      return galleryHasItems;
    })
    .then((galleryHasItems) => {
      let patchHasItems = patchBody.items ? true : false;
      let addingToExistingItems = galleryHasItems && patchHasItems;
      if (addingToExistingItems && sameItem) {
        let name = patchBody.items.name;
        let queryStr = `
      UPDATE galleries
      SET items = COALESCE((
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(items) = 'array' THEN items 
            ELSE '[]'::jsonb 
          END
        ) elem
        WHERE elem->>'name' != $3
      ), '[]'::jsonb)
      WHERE user_id = $1 AND gallery_id = $2
      RETURNING *;
    `;
        let queryParams = [user_id, gallery_id, name];
        return db.query(queryStr, queryParams);
      } else {
        console.log({ sameItem }, "<---");
        const allowedColumns = ["image_url", "title", "description", "items"];
        const queryParams = [user_id, gallery_id];
        let queryStr = "UPDATE galleries SET ";

        const setClauses = Object.entries(patchBody)
          .filter(([key]) => allowedColumns.includes(key))
          .map(([key, value], index) => {
            if (key === "items" && addingToExistingItems) {
              console.log({ value });
              return `${key} = items || '[${JSON.stringify(value)}]'::jsonb `;
            } else {
              queryParams.push(value);
              return `${key} = $${index + 3} `;
            }
          });

        if (setClauses.length === 0) {
          return Promise.reject({
            status: 400,
            msg: "BAD REQUEST",
          });
        }

        queryStr += setClauses.join(", ");
        queryStr += `WHERE user_id = $1 AND gallery_id = $2 RETURNING *;`;
        return db.query(queryStr, queryParams);
      }
    })
    .then(({ rows: [gallery] }) => {
      if (!gallery) {
        return Promise.reject({ status: 400, msg: "BAD REQUEST" });
      }
      return gallery;
    });
};
