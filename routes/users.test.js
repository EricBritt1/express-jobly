"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u3AdminToken,
} = require("./_testCommon");
const { ensureIsUser } = require("../middleware/auth.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("Works: Admin creates new user", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("Works for admin: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("Fails: User creates new user", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/********************************************************Submitting job applications for users */
describe("POST /users/:username/jobs/:id", function () {

  test("Allows admin to submit job application for user", async function() {
      const resp = await request(app)
            .post("/users/u1/jobs/1")
            .set("authorization", `Bearer ${u3AdminToken}`)

      const applicationSubmitted = await db.query(
        `SELECT *
         FROM applications
         WHERE job_id=1 `
      )


    expect(applicationSubmitted.rows).toEqual(
      [{
        username: 'u1',
        job_id: 1
      }]
    )
    expect(resp.statusCode).toEqual(201)
    expect(resp.body).toEqual({ applied: "1"})
  });


  test("Allows user to submit job applcation", async function() {
    const resp = await request(app)
          .post("/users/u1/jobs/1")
          .set("authorization", `Bearer ${u1Token}`)

    const applicationSubmitted = await db.query(
      `SELECT *
       FROM applications
       WHERE job_id=1 `
    )



  expect(applicationSubmitted.rows).toEqual(
    [{
      username: 'u1',
      job_id: 1
    }]
  )
  expect(resp.statusCode).toEqual(201)
  expect(resp.body).toEqual({ applied: "1"})
});


  test("Fails: u1 attempt to submit job applcation for u2", async function() {
    const resp = await request(app)
          .post("/users/u2/jobs/1")
          .set("authorization", `Bearer ${u1Token}`)

    expect(resp.statusCode).toEqual(401)
});

  test("Fails: a user that isn't logged in attempts to submit an application for u1", async function() {
    const resp = await request(app).post("/users/u1/jobs/1")

    expect(resp.statusCode).toEqual(401);
  });

  test("Fails: Improper data entry", async function () {
    const resp = await request(app)
          .post("/users/123123/jobs/u1")
          .set("authorization", `Bearer ${u3AdminToken}`)

    expect(resp.statusCode).toEqual(400);
  })
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins only", async function () {
    await db.query(
      ` INSERT INTO applications (username, job_id) VALUES ('u1', 1)`
    )
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u3AdminToken}`);
        console.log(resp.body)
    expect(resp.body).toEqual(
      {
        users: [
          {
            username: 'u1',
            firstName: 'U1F',
            lastName: 'U1L',
            email: 'user1@user.com',
            isAdmin: false,
            jobs: [{
              id: 1,
              title: 'j1',
              salary: 100,
              equity: '0.1',
              company_handle: 'c1',
            }]
          },
          {
            username: 'u2',
            firstName: 'U2F',
            lastName: 'U2L',
            email: 'user2@user.com',
            isAdmin: false,
            jobs: []
          },
          {
            username: 'u3',
            firstName: 'U3F',
            lastName: 'U3L',
            email: 'user3@user.com',
            isAdmin: true,
            jobs: []
          }
        ]
      }
  
    );
  });

  
    test("Fails: Non-admin user attempt", async function () {
      const resp = await request(app)
          .get("/users")
          .set("authorization", `Bearer ${u1Token}`);
          expect(resp.statusCode).toEqual(401)
      });
    

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("Works for user accessing own data", async function () {
    await db.query(
      ` INSERT INTO applications (username, job_id) VALUES ('u1', 1)`
    )
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false
      },
      jobs: [
        {
          id: 1,
          title: 'j1',
          salary: 100,
          equity: '0.1',
          company_handle: 'c1',
          username: 'u1'
        }
      ]
    }
);
  });

  test("Works: Admin attempts to access user information other than their own", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u3AdminToken}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
          user: {
            username: "u1",
            firstName: "U1F",
            lastName: "U1L",
            email: "user1@user.com",
            isAdmin: false,
          }, jobs: []
     });
})
  

  test("Fails: Non-admin attempts to access user information other than their own", async function () {
    const resp = await request(app)
        .get(`/users/u3`)
        .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for users updating themselves", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("Fails: users updating another user", async function () {
    const resp = await request(app)
        .patch(`/users/u3`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    });
  


  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });


  test("Fails: Admin attempting to update a user that doesn't exist", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("Works for specified user deleting their own account", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("Works for admin deleting a users account", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("Works for admin deleting their account", async function () {
    const resp = await request(app)
        .delete(`/users/u3`)
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.body).toEqual({ deleted: "u3" });
  });

  test("Fails: Specified user deleting another users account", async function () {
    const resp = await request(app)
        .delete(`/users/u2`)
        .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
  });


  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

 test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    
  });

});
