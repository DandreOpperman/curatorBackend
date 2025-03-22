const db = require("../../db/connection");
const { checkValueExists } = require("../../db/utils");

exports.selectUser = (user_id) => {
  const queryPromises = [];
  const userPromise = db.query(
    `
      SELECT * FROM users
      WHERE user_id = $1`,
    [user_id]
  );
  queryPromises.push(userPromise);

  const favoritePromise = db.query(
    `
      SELECT * FROM favorites
      WHERE user_id = $1`,
    [user_id]
  );
  queryPromises.push(favoritePromise);

  const galleryPromise = db.query(
    `
      SELECT * FROM galleries
      WHERE user_id = $1`,
    [user_id]
  );
  queryPromises.push(galleryPromise);

  return Promise.all(queryPromises).then(
    ([
      {
        rows: [user],
      },
      { rows: favorites },
      { rows: galleries },
    ]) => {
      if (!user) {
        return Promise.reject({ status: 404, msg: "NOT FOUND" });
      }
      user.favorites = favorites;
      user.galleries = galleries;
      return user;
    }
  );
};

exports.insertUser = ({ email, password, user_name }) => {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  const passRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$£!%*?&])[A-Za-z\d@$£!%*?&]{8,}$/;
  const nameRegex = /^[A-Za-z]+([ -][A-Za-z]+)?$/;
  if (
    !emailRegex.test(email) ||
    !passRegex.test(password) ||
    !nameRegex.test(user_name)
  ) {
    return Promise.reject({ status: 400, msg: "BAD REQUEST" });
  }
  return checkValueExists("users", "email", email)
    .catch(() => {
      return db.query(
        `
      INSERT INTO users
        (email, password, user_name)
      VALUES
        ($1, crypt($2, gen_salt('md5')), $3)
      RETURNING *;
      `,
        [email, password, user_name]
      );
    })
    .then((result) => {
      if (!result) {
        return Promise.reject({ status: 409, msg: "EMAIL TAKEN" });
      }
      const user = result.rows[0];
      user.favorites = [];
      user.galleries = [];
      return user;
    });
};

exports.updateUser = (user_id, patchBody) => {
  return checkValueExists("users", "user_id", user_id)
    .then(() => {
      const queryParams = [];
      const allowedColumns = ["email", "password", "avatar_url", "user_name"];

      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      const passRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$£!%*?&])[A-Za-z\d@$£!%*?&]{8,}$/;
      const nameRegex = /^[A-Za-z]+([ -][A-Za-z]+)?$/;

      const validateRegex = [emailRegex, passRegex, nameRegex];
      const propsToValidate = ["email", "password", "user_name"];

      for (let [index, prop] of propsToValidate.entries()) {
        if (Object.keys(patchBody).includes(prop)) {
          if (!validateRegex[index].test(patchBody[prop])) {
            return Promise.reject({ status: 400, msg: "BAD REQUEST" });
          }
        }
      }

      let count = Object.keys(patchBody).length;
      let queryStr = "UPDATE users SET ";

      for (const key in patchBody) {
        if (!allowedColumns.includes(key)) {
          return Promise.reject({ status: 400, msg: "BAD REQUEST" });
        }
        const value = patchBody[key];
        key === "password"
          ? (queryStr += `password = crypt($${count + 1}, gen_salt('md5'))`)
          : (queryStr += `${key} = $${count + 1}`);
        queryParams.unshift(value);
        queryStr += count > 1 ? ", " : " ";
        count--;
      }

      queryParams.unshift(user_id);
      queryStr += `WHERE user_id = $1 RETURNING *;`;
      return db.query(queryStr, queryParams);
    })
    .then(({ rows: [user] }) => {
      return user;
    });
};

exports.removeUser = (user_id) => {
  return db
    .query(
      `
      DELETE FROM galleries
      WHERE user_id = $1;
      `,
      [user_id]
    )
    .then(() => {
      return db.query(
        `
      DELETE FROM favorites
      WHERE user_id = $1;`,
        [user_id]
      );
    })
    .then(() => {
      return db.query(
        `
      DELETE FROM users
      WHERE user_id = $1 
      RETURNING *;
      `,
        [user_id]
      );
    });
};
