const app = require("../app");
const request = require("supertest");
const db = require("../db/connection");
const seed = require("../db/seed/seed");
const {
  userData,
  favoriteData,
  galleryData,
  itemData,
} = require("../db/test-data/index");
const endpointsData = require("../endpoints.json");
const { jwtDecode } = require("jwt-decode");

beforeEach(() => seed({ userData, favoriteData, galleryData, itemData }));
afterAll(() => db.end());

describe("/not-a-route", () => {
  it("GET:404 responds with not found", () => {
    return request(app).get("/not-a-route").expect(404);
  });
});

describe("/api", () => {
  it("GET:200 responds with an object detailing all of the available endpoints", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toEqual(endpointsData);
      });
  });
});

describe("/api/user/:user_id", () => {
  it("GET:200 responds with all of the users data", () => {
    return request(app)
      .get("/api/user/1")
      .expect(200)
      .then(({ body: { user } }) => {
        // console.log(user);
        expect(user).toMatchObject({
          user_id: expect.any(Number),
          email: "jimmy1@gmail.com",
          password: expect.any(String),
          user_name: "Jimmy1",
          favorites: [
            { favorite_id: 1, item_id: 1, user_id: 1 },
            {
              favorite_id: 2,
              item_id: 2,
              user_id: 1,
            },
          ],
          galleries: [],
        });
      });
  });
  it("GET:404 sends an appropriate status and error message when given a valid but non-existent id", () => {
    return request(app)
      .get("/api/user/999")
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("NOT FOUND");
      });
  });
  it("GET:400 sends an appropriate status and error message when given an invalid id", () => {
    return request(app)
      .get("/api/user/jhvkjhbkh")
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
  it("PATCH:201 responds with the edited user", () => {
    const newEmail = { email: "whopper@gmail.com" };
    return request(app)
      .patch("/api/user/1")
      .send(newEmail)
      .expect(201)
      .then(
        ({
          body: {
            user: { email },
          },
        }) => {
          expect(email).toBe("whopper@gmail.com");
        }
      );
  });
  it("PATCH:201 responds with the edited user when the patch request contains multiple values", () => {
    const newEmail = {
      email: "bigmac@gmail.com",
      user_name: "WOOPER",
      password: "H0oD3ini£",
    };
    return request(app)
      .patch("/api/user/1")
      .send(newEmail)
      .expect(201)
      .then(
        ({
          body: {
            user: { email, user_name, password },
          },
        }) => {
          expect(email).toBe("bigmac@gmail.com");
          expect(user_name).toBe("WOOPER");
          expect(typeof password).toBe("string");
        }
      );
  });
  it("PATCH:400 responds with bad request if email, password or name are invalid", () => {
    const badEmail = { email: "notanemailaddress.net" };
    const badPass = { password: 123 };
    const badName = { user_name: '%%^%£"£$%^$' };
    const emailTest = request(app)
      .patch("/api/user/2")
      .expect(400)
      .send(badEmail)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
    const passTest = request(app)
      .patch("/api/user/2")
      .expect(400)
      .send(badPass)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
    const nameTest = request(app)
      .patch("/api/user/2")
      .expect(400)
      .send(badName)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
    return Promise.all([emailTest, passTest, nameTest]);
  });
  it("PATCH:400 responds with bad request when passed multiple invalid values", () => {
    const requestBody = {
      email: "notanemailaddress.net",
      password: "fsdfsf",
      name: 12345,
    };
    return request(app)
      .patch("/api/user/2")
      .expect(400)
      .send(requestBody)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
  it("PATCH:400 responds with bad request when passed an invalid property", () => {
    const requestBody = {
      shoeSize: 9,
      email: "shoeKing@outlook.com",
    };
    return request(app)
      .patch("/api/user/2")
      .expect(400)
      .send(requestBody)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
  it("PATCH:404 responds with not found when passed a non existent user_id", () => {
    const requestBody = {
      email: "shoeKing@outlook.com",
    };
    return request(app)
      .patch("/api/user/9999")
      .expect(404)
      .send(requestBody)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("NOT FOUND");
      });
  });
  it("PATCH:201 if patching password, this must be stored as a hash", () => {
    const requestBody = {
      user_name: "James",
      password: "Password123%",
    };
    return request(app)
      .patch("/api/user/1")
      .send(requestBody)
      .expect(201)
      .then(({ body: { user } }) => {
        expect(user.user_name).toBe("James");
        expect(user.password).not.toBe("Password123%");
      });
  });
  it("DELETE:204 deletes the specified user", () => {
    return request(app)
      .delete("/api/user/3")
      .expect(204)
      .then(() => {
        return request(app).get("/api/user/3").expect(404);
      })
      .then(({ body: { msg } }) => {
        expect(msg).toBe("NOT FOUND");
      });
  });
  it("DELETE:204 also deletes all of a user's associated data (favorites, galleries)", () => {
    return request(app)
      .delete("/api/user/1")
      .expect(204)
      .then(() => {
        return request(app).get("/api/user/1").expect(404);
      })
      .then(() => {
        return request(app).get("/api/user/1/favorites").expect(404);
      })
      .then(() => {
        return request(app).get("/api/user/1/galleries").expect(404);
      });
  });
  it("DELETE:400 responds with bad request for an invalid user_id", () => {
    return request(app)
      .delete("/api/user/imnotarealuser")
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
});

describe("/api/user", () => {
  it("POST:201 responds with the newly created user", () => {
    const requestBody = {
      email: "markimoo55@gmail.com",
      password: "Jwisper5$",
      user_name: "Mark",
      galleries: [],
      favorites: [],
    };
    return request(app)
      .post("/api/user")
      .expect(201)
      .send(requestBody)
      .then(({ body: { user } }) => {
        expect(user).toMatchObject({
          user_id: 5,
          email: "markimoo55@gmail.com",
          password: expect.any(String),
          user_name: "Mark",
          galleries: [],
          favorites: [],
        });
      });
  });
  it("POST:400 responds with appropriate error message if bad request body", () => {
    const requestBody = {
      email: "marki55@gmail.com",
      user_name: "Marko",
    };
    return request(app)
      .post("/api/user")
      .expect(400)
      .send(requestBody)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
  it("POST:201 ignores unnecessary properties on the request body", () => {
    const requestBody = {
      email: "weemn@gmail.com",
      password: "Jwisper5$",
      user_name: "halala",
      banana: true,
      giveMoney: "yes",
      income: 10000000000,
    };
    return request(app)
      .post("/api/user")
      .expect(201)
      .send(requestBody)
      .then(({ body: { user } }) => {
        expect(user).toMatchObject({
          user_id: 5,
          email: "weemn@gmail.com",
          password: expect.any(String),
          user_name: "halala",
        });
      });
  });
  it("POST:400 responds with appropriate error message if values do not satisfy validation regex", () => {
    const invalidEmail = {
      email: 333,
      password: "Pa5$word",
      user_name: "Mark",
    };
    const invalidPass = {
      email: "markimoo55@gmail.com",
      password: "password123",
      user_name: "Mark",
    };
    const invalidName = {
      email: "markimoo55@gmail.com",
      password: "Pa5$word",
      user_name: "$$$",
    };
    const emailTest = request(app)
      .post("/api/user")
      .expect(400)
      .send(invalidEmail)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
    const passTest = request(app)
      .post("/api/user")
      .expect(400)
      .send(invalidPass)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
    const nameTest = request(app)
      .post("/api/user")
      .expect(400)
      .send(invalidName)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
    return Promise.all([emailTest, nameTest, passTest]);
  });
  it("POST:409 responds with an appropriate message if email is already taken", () => {
    const requestBody = {
      email: "jimmy4@gmail.com",
      password: "Jwisper5$",
      user_name: "josh",
    };
    return request(app)
      .post("/api/user")
      .expect(409)
      .send(requestBody)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("EMAIL TAKEN");
      });
  });
});

describe("/api/user/:user_id/favorites", () => {
  it("GET:200 responds with an array of all of the users favorites", () => {
    return request(app)
      .get("/api/user/1/favorites")
      .expect(200)
      .then(({ body: { favorites } }) => {
        favorites.map((favorite) => {
          expect(favorite).toMatchObject({
            user_id: 1,
            favorite_id: expect.any(Number),
            item_id: expect.any(Number),
          });
        });
      });
  });
  it("GET:200 responds with an empty array if user has no favorites yet", () => {
    return request(app)
      .get("/api/user/3/favorites")
      .expect(200)
      .then(({ body: { favorites } }) => {
        expect(Array.isArray(favorites)).toBe(true);
        expect(favorites.length).toBe(0);
      });
  });
  it("GET:404 sends an appropriate status and error message when given a valid but non-existent id ", () => {
    return request(app)
      .get("/api/user/999999/favorites")
      .then(({ body: { msg } }) => {
        expect(msg).toBe("NOT FOUND");
      });
  });
  it("GET:400 sends an appropriate status and error message when given an invalid id", () => {
    return request(app)
      .get("/api/user/wljkfn/favorites")
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
  it("POST:201 responds with the newly created favorite, and ignores additional properties", () => {
    const requestBody = {
      item_id: 2,
    };
    return request(app)
      .post("/api/user/3/favorites")
      .expect(201)
      .send(requestBody)
      .then(({ body: { favorite } }) => {
        expect(favorite).toMatchObject({
          user_id: 3,
          item_id: 2,
        });
      });
  });
  it("POST:400 sends an appropriate status and error message when given an invalid id", () => {
    const requestBody = {
      name: "rent",
      cost: 500,
    };
    return request(app)
      .post("/api/user/wljkfn/favorites")
      .expect(400)
      .send(requestBody)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
  it("POST:400 responds with appropriate error message if bad request body", () => {
    const requestBody = {
      email: "marki55@gmail.com",
      password: "Jwisper5$",
      fname: "Marko",
      banana: true,
      giveMoney: "yes",
      income: 10000000000,
    };
    return request(app)
      .post("/api/user/1/favorites")
      .expect(400)
      .send(requestBody)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
  it("POST:404 sends an appropriate status and error message when given a valid but non-existant user_id", () => {
    const requestBody = {
      item_id: 4,
    };
    return request(app)
      .post("/api/user/999/favorites")
      .expect(404)
      .send(requestBody)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("NOT FOUND");
      });
  });
});
describe("/api/user/:user_id/favorites/:favorites_id", () => {
  it("DELETE:204 deletes the specified favorite", () => {
    return request(app)
      .delete("/api/user/1/favorites/1")
      .expect(204)
      .then(() => {
        return request(app).get("/api/user/1/favorites").expect(200);
      })
      .then(({ body: { favorites } }) => {
        expect(favorites).toMatchObject([
          { favorite_id: 2, item_id: 2, user_id: 1 },
        ]);
      });
  });
  it("DELETE:400 responds with bad request for an invalid user_id", () => {
    return request(app)
      .delete("/api/user/imnotarealuser/favorites/1")
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("BAD REQUEST");
      });
  });
  it("DELETE:404 responds with bad request for a valid but non existant user_id", () => {
    return request(app)
      .delete("/api/user/12345/favorites/1")
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("NOT FOUND");
      });
  });
});
describe("/api/galleries", () => {
  it("GET:200 responds with an array of all of the gallery objects", () => {
    return request(app)
      .get("/api/galleries")
      .expect(200)
      .then(({ body: { galleries } }) => {
        galleries.map((gallery) => {
          expect(gallery).toMatchObject({
            gallery_id: expect.any(Number),
            created_at: expect.any(Number),
            image_url: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            user_id: expect.any(Number),
          });
        });
      });
  });
});
