const format = require("pg-format");
const db = require("../connection");
const { convertTimestampToDate } = require("../utils");

const seed = ({ userData, itemData, favoriteData, galleryData }) => {
  return db
    .query(`DROP EXTENSION IF EXISTS pgcrypto CASCADE;`)
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS galleries;`);
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS favorites;`);
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS items;`);
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS users;`);
    })
    .then(() => {
      return db.query(`CREATE EXTENSION pgcrypto;`);
    })
    .then(() => {
      return db.query(`
      CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        user_name VARCHAR(400) NOT NULL,
        email VARCHAR(400) NOT NULL,
        password VARCHAR(500) NOT NULL,
        avatar_url VARCHAR(500) DEFAULT 'https://cdn-icons-png.flaticon.com/512/6097/6097300.png'
      );`);
    })
    .then(() => {
      return db.query(`
      CREATE TABLE items (
        item_id SERIAL PRIMARY KEY,
        name VARCHAR(400) NOT NULL,
        creator VARCHAR(400) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        description VARCHAR(500) NOT NULL,
        year_date integer CHECK (year_date > -1 and year_date < 2026),
        year_BCE integer CHECK (year_BCE = 0 or year_BCE = 1)
      );`);
    })
    .then(() => {
      return db.query(`
      CREATE TABLE favorites (
        favorite_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) NOT NULL,
        item_id INT REFERENCES items(item_id) NOT NULL
      );`);
    })
    .then(() => {
      return db.query(`
      CREATE TABLE galleries (
        gallery_id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        image_url VARCHAR(500),
        title VARCHAR(50) NOT NULL,
        description VARCHAR(500) NOT NULL,
        user_id INT REFERENCES users(user_id) NOT NULL
      );`);
    })
    .then(() => {
      //   const formattedUserData = userData.map(convertTimestampToDate);
      const insertUserQueryStr = format(
        "INSERT INTO users (user_name, email, password, avatar_url) VALUES %L;",
        userData.map(({ user_name, email, password, avatar_url }) => [
          user_name,
          email,
          password,
          avatar_url,
        ])
      );
      return db.query(insertUserQueryStr);
    })
    .then(() => {
      const insertItemQueryStr = format(
        "INSERT INTO items (name, creator, image_url, description, year_date, year_BCE) VALUES %L;",
        itemData.map(
          ({ name, creator, image_url, description, year_date, year_BCE }) => [
            name,
            creator,
            image_url,
            description,
            year_date,
            year_BCE,
          ]
        )
      );
      return db.query(insertItemQueryStr);
    })
    .then(() => {
      const insertFavoriteQueryStr = format(
        "INSERT INTO favorites (user_id, item_id) VALUES %L;",
        favoriteData.map(({ user_id, item_id }) => [user_id, item_id])
      );
      return db.query(insertFavoriteQueryStr);
    })
    .then(() => {
      const formattedGalleryData = galleryData.map(convertTimestampToDate);
      const insertGalleryQueryStr = format(
        "INSERT INTO galleries (created_at, image_url, title, description, user_id) VALUES %L;",
        formattedGalleryData.map(
          ({ created_at, image_url, title, description, user_id }) => [
            created_at,
            image_url,
            title,
            description,
            user_id,
          ]
        )
      );
      return db.query(insertGalleryQueryStr);
    });
};

module.exports = seed;
