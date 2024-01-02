"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u3AdminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("Fails: Users who aren't admins", async function () {
    const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({error: {
      message: "Unauthorized",
      status: 401
    }
    });
  });

  test("Passes: Users who ARE admins", async function () {
    const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCompany,
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /companies", function () {
  test("Return all companies in database (without query params)", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies:
          [
            {
              handle: "c1",
              name: "C1",
              description: "Desc1",
              logoUrl: "http://c1.img",
            },
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              logoUrl: "http://c2.img",
            },
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              logoUrl: "http://c3.img",
            },
          ],
    });
  });
    // NAME PORTION ********************************************************
    test("Return companies with ONLY name query param", async function () {
    const res = await request(app).get("/companies?name=C1");
    expect(res.body).toEqual({
      companies:
        [
          {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            logoUrl: "http://c1.img"
          }
        ]
    })

    });

    //Note: SQL database queries for LIKE name. Anything with a C in it will be considered.
    test("Return companies with name and minEmployees query param", async function () {
      const res = await request(app).get("/companies?name=C&minEmployees=2");
      expect(res.body).toEqual({
        companies:
          [
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img"
            },
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              numEmployees: 3,
              logoUrl: "http://c3.img",
            }
          ]
      })
    });

    //Note: SQL database queries for LIKE name. Anything with a C in it will be considered.
    test("Return companies with name and maxEmployees query param", async function () {
      const res = await request(app).get("/companies?name=C&maxEmployees=1");
      expect(res.body).toEqual({
        companies:
          [
            {
              handle: "c1",
              name: "C1",
              description: "Desc1",
              numEmployees: 1,
              logoUrl: "http://c1.img"
            }
          ]
      })
      
    });

    // maxEmployees and minEmployees portion *************************************
    test("Return companies with ONLY minEmployees param", async function () {
      const res = await request(app).get("/companies?minEmployees=3");
      expect(res.body).toEqual({
        companies:
          [
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              numEmployees: 3,
              logoUrl: "http://c3.img"
            }
          ]
      })
      
    });

    test("Return companies with ONLY maxEmployees param", async function () {
      const res = await request(app).get("/companies?maxEmployees=1");
      expect(res.body).toEqual({
        companies:
          [
            {
              handle: "c1",
              name: "C1",
              description: "Desc1",
              numEmployees: 1,
              logoUrl: "http://c1.img"
            }
          ]
      })
      
    });

    test("Return companies with minEmployees and maxmployees param", async function () {
      const res = await request(app).get("/companies?minEmployees=2&maxEmployees=2");
      expect(res.body).toEqual({
        companies:
          [
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img"
            }
          ]
      })

    });

    // Special edge cases ***********************************************************
    test("Return companies that fit criteria whilst using ALL params", async function () {
      const res = await request(app).get("/companies?name=c&minEmployees=2&maxEmployees=2");
      expect(res.body).toEqual({
        companies:
          [
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img"
            }
          ]
      })
    });

    test ("Return error with minEmployees > maxEmployees", async function () {
      const res = await request(app).get("/companies?name=c&minEmployees=5&maxEmployees=1")
      expect(res.body).toEqual({
        "error": {
          "message": "Min employees cannot be greater or equal to max employees",
          "status": 400
        }
      })
      expect(res.statusCode).toEqual(400);
    });

    test ("Return 'No results found' if array empty", async function() {
      const res = await request(app).get("/companies?name=AB?minEmployees=100&maxEmployees=200")
      expect(res.body).toEqual({
        "error": {
          "message": "No companies fit criteria",
          "status": 404
        }
      })
    });
  });


  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
        .get("/companies")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      }, jobs : [{
        id: 1,
        title: "j1",
        salary: 100,
        equity: "0.1",
        company_handle: "c1"
      }]
    });
  });


  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  test("works for users with isAdmin flag", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new"
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img"
      }
    });
  });

  test("Fails for users without isAdmin flag", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({error: {
      message: "Unauthorized",
      status: 401
    }
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/companies/nope`)
        .send({
          name: "new nope",
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
  test("Fails: for users without isAdmin flag", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual(
      {error: 
      {
          message: "Unauthorized",
          status: 401
      }
      });
  });

  test("Works: for users with isAdmin flag", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
