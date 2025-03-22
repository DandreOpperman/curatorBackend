const db = require("../../db/connection");
const { checkValueExists, checkValueTaken } = require("../../db/utils");
exports.selectFavorites = (user_id) => {
  const queryPromises = [];
  const userPromise = db.query(
    `
      SELECT * FROM favorites
      WHERE user_id = $1`,
    [user_id]
  );
  queryPromises.push(checkValueExists("users", "user_id", user_id));
  queryPromises.push(userPromise);
  return Promise.all(queryPromises).then((data) => {
    let output = data[1].rows;
    if (!output) {
      return Promise.reject({ status: 404, msg: "NOT FOUND" });
    }
    return output;
  });
};
exports.insertFavorite = (user_id, { item_id }) => {
  if (!user_id || !item_id) {
    return Promise.reject({ status: 400, msg: "BAD REQUEST" });
  }
  const queryProms = [];
  let queryStr = `
  INSERT INTO favorites
    (user_id, item_id)
  VALUES
    ($1, $2)
  RETURNING *;
  `;
  queryProms.push(checkValueExists("users", "user_id", user_id));
  queryProms.push(db.query(queryStr, [user_id, item_id]));
  return Promise.all(queryProms).then((result) => {
    if (!result) {
      return Promise.reject({ status: 409, msg: "Already in favorites" });
    }
    return result[1].rows[0];
  });
};

exports.removeFavorite = (user_id, favorites_id) => {
  const queryProms = [];
  let queryStr = `
          DELETE FROM favorites
          WHERE user_id = $1 AND favorite_id = $2 RETURNING *;
          `;
  queryProms.push(db.query(queryStr, [user_id, favorites_id]));
  return Promise.all(queryProms);
};
exports.removeFavoriteByFavoriteId = (user_id, favorites_id) => {
  console.log(user_id, "<-u", favorites_id);
  const queryProms = [];
  let queryStr = "DELETE FROM favorites WHERE favorite_id = $1 RETURNING *;";
  queryProms.push(checkValueExists("favorites", "favorite_id", favorites_id));
  queryProms.push(checkValueExists("users", "user_id", user_id));
  queryProms.push(db.query(queryStr, [favorites_id]));
  return Promise.all(queryProms);
};
