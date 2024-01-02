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

// Jobs currently in the test_database
    const j1 = {
                id: 1,
                title: "j1",
                salary: 100,
                equity: "0.1",
                company_handle: "c1"
            }
  

    const j2 = {
            id: 2,
            title: "j2",
            salary: 200,
            equity: "0.2",
            company_handle: "c2"
         };

  
    const j3 = {
                id: 3, 
                title: "j3",
                salary: 300,
                equity: "0.3",
                company_handle: "c3"
            };

         
describe("POST /jobs", function () {
    const newJob = {
        title: "OOGA",
        salary: 1000,
        equity: 0.8,
        company_handle: "c2"
    }

    test("Passes: Only admins can create jobs", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u3AdminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
                job : {
                    id: 4,
                    title: "OOGA",
                    salary: 1000,
                    equity: "0.8",
                    company_handle: "c2"
                }
            })
    });

    test("Fails: Non-admin user is not authorized", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401)
        expect(resp.body).toEqual({error: {
            message: "Unauthorized",
            status: 401
        }})
    });

    test("Fails: Incomplete data fields", async function () {
        const resp = await request(app)
                .post("/jobs")
                .send({
                    title : "only one field"
                })
                .set("authorization", `Bearer ${u3AdminToken}`);
            expect(resp.statusCode).toEqual(400)
    })


    test("Fails: bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
              title: 43,
              salary: "ee",
              equity: "ee",
              company_handle: "nah"
            })
            .set("authorization", `Bearer ${u3AdminToken}`);
        expect(resp.statusCode).toEqual(400);
      });
});

describe("GET /jobs", function () {

    test("Returns all jobs in database Securiy: All users", async function () {
        const resp = await request(app)
            .get("/jobs")
        expect(resp.body).toEqual({jobs : [
            j1,
            j2,
            j3
        ]
    })
    });

    test("Return jobs specified jobs (All query params: title, minSalary, equity)", async function () {
        const resp = await request(app)
            .get("/jobs?title=j&minSalary=200&hasEquity=true")
        expect(resp.body).toEqual({jobs : [
            j2,
            j3
        ]})

    });

    test("Returns specified jobs (Two query params: title, minSalary", async function () {
        const resp = await request(app)
            .get("/jobs?title=j&minSalary=200")
        expect(resp.body).toEqual({jobs : [
            j2,
            j3
        ]})
    });

    test("Returns specified jobs (Two query params: minSalary, hasEquity", async function() {
        const resp = await request(app)
            .get("/jobs?hasEquity=true&minSalary=200")
            console.log(resp.body)
        expect(resp.body).toEqual({jobs : [
            j2,
            j3
        ]})

    });

    test("Returns specified jobs (one query param: minSalary)", async function () {
        const resp = await request(app)
            .get("/jobs?minSalary=200")
        expect(resp.body).toEqual({jobs : [
            j2,
            j3
        ]})
    });

    test("Returns specified jobs (one query param: hasEquity", async function () {
        const resp = await request(app)
            .get("/jobs?hasEquity=true")
        expect(resp.body).toEqual({jobs : [
            j2,
            j1,
            j3
        ]})
    });

    test("Returns specified jobs (one query param: title)", async function () {
        const resp = await request(app)
        .get("/jobs?title=j")
    expect(resp.body).toEqual({jobs : [
        j1,
        j2,
        j3
    ]})
    });

    test("Fails: Bad data", async function() {
        const resp = await request(app)
            .get("/jobs?title=211&minSalary=eee&hasEquity=0232")
        expect(resp.statusCode).toEqual(400)
    });


})

describe("GET /jobs/:id" , function () {

    test("Return job with specified id. Security: All users", async function() {
        const resp = await request(app)
            .get("/jobs/2")
        expect(resp.body).toEqual({job : j2})
    })

    test("Fails: Invalid job id", async function () {
        const resp = await request(app)
            .get("/jobs/5")
        expect(resp.statusCode).toEqual(404)
    })


});


describe("PATCH /jobs/:id", function () {

    
    test("Pass: Admin user can update job", async function () {
        const resp = await request(app)
                    .patch("/jobs/1")
                    .send({
                        title: "the new title",
                        salary: 99,
                        equity: 0.5
                    })
                    .set("authorization", `Bearer ${u3AdminToken}`)
        
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            updatedJob: {
                id: 1,
                title: "the new title",
                salary: 99,
                equity: "0.5",
                company_handle: "c1"
            }
    })

    });

    test("Fails: User can't update job", async function() {
        const resp = await request(app)
        .patch("/jobs/1")
        .send({
            title: "the new title",
            salary: 99,
            equity: 0.5
        })
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toEqual(401)
    });

    test("Pass: Admin user can update job partially", async function () {
        const resp = await request(app)
                    .patch("/jobs/1")
                    .send({
                        title: "the new title"
                    })
                    .set("authorization", `Bearer ${u3AdminToken}`)
        
        
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
           updatedJob: {
                id: 1,
                title: "the new title",
                salary: 100,
                equity: "0.1",
                company_handle: "c1"
            }
        })
    });

    test("Fails: Invalid data", async function () {
        const resp = await request(app)
                    .patch("/jobs/1")
                    .send({
                        title: 5435324534252345
                    })
                    .set("authorization", `Bearer ${u3AdminToken}`)
        
        expect(resp.statusCode).toEqual(400)
    });

    test("Fails: Invalid job id", async function () {
        const resp = await request(app)
        .patch("/jobs/9")
        .send({
            title: "cool"
        })
        .set("authorization", `Bearer ${u3AdminToken}`)

        expect(resp.statusCode).toEqual(404)
    });

});


describe("DELETE /jobs/:id", function () {

    test("Pass: Admin user can remove job", async function () {
        const resp = await request(app)
            .delete("/jobs/1")
            .set("authorization", `Bearer ${u3AdminToken}`)
        
        expect(resp.body).toEqual({
            deleted: j1
        })
    });

    test("Fails: User can't remove job", async function () {
        const resp = await request(app)
            .delete("/jobs/1")
            .set("authorization", `Bearer ${u1Token}`)
        
        expect(resp.statusCode).toEqual(401)
    });

    test("Fails: Invalid job id", async function () {
        const resp = await request(app)
            .delete("/jobs/9")
            .set("authorization", `Bearer ${u3AdminToken}`)
        
        expect(resp.statusCode).toEqual(404)
    })
})