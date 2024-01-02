"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

/* - Tests the create function in the Company class. 
   - Checks to see if data was stored in database properly.
   - Checks to see if the function throws an error if the company already exists in database.
*/
describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */


/* 
      - Tests the findAll function in the Company class.
      - Tests to see if the function findAll returns all companies currently stored in database.
*/

describe("findAll", function () {
  test("works: no filter", async function () {

    let companies = await Company.findAll();
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });
});

/*********************************************************** filter *********/
/* 
      - Tests the filter function in the Company class.
      - Tests to see if the function filter properly does the following: 
        - Name should return ONLY specified name of company OR like names ("C" == "C1", "C2", "C3" BUT NOT "D3") Intended to also work with maxEMPLOYEES and or minEMPLOYEES
        - minEMPLOYEES < maxEMPLOYEES should return all companies within given range. Endpoints are included.
        - minEMPLOYEES > maxEMPLOYEES Should return Error
        - Properly returns Error if no arguments passed into params of function.

*/

describe("filter", function () {
  /******* THIS WILL HANDLE ALL NAME VARIATIONS Name and or Min and or Max ********/ 
  test("works: filter by name", async function() {
    let companies = await Company.filter("C1");
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        logoUrl: "http://c1.img",
      }
    ])
  })

  test("works: filter by Name + Min", async function(){
    let companies = await Company.filter("C", 2);
    expect(companies).toEqual([
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        }
    ])
  })

  test("works: filter by Name + Max", async function(){
    let companies = await Company.filter("C", null, 2);
    expect(companies).toEqual([
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        }
    ])
  })


/******* THIS WILL HANDLE ALL MIN VARIATIONS Min and or Name and or Max ********/
  test("works: filter by minEmployees", async function() {
    let companies = await Company.filter("", 2);
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      }
    ])
  })

  test("works: filter by minEmployees with maxEmployees", async function() {
    let companies = await Company.filter("", 2, 3);
    console.log(companies)
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      }
    ])
  })



/*********************** TESTS FOR maxEMPLOYEES *******************************/ 
  test("works: filter by maxEmployees", async function() {
    let companies = await Company.filter("", null, 2);
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      }
    ])
  })



  test('fails: minEmployees >= maxEmployees', async function() {
    try {
      await Company.filter("", 3, 2);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })

/***************** HANDLES ALL THREE PARAMS TOGETHER! *********************/
  test('works: filter by LIKE NAME, minEmployees, maxEmployees', async function () {
    let companies = await Company.filter("C", 2, 3)
    expect(companies).toEqual([
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
      {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img",
    }
    ])
  })


  test('works: no params, will return all companies', async function () {
    let companies = await Company.filter()
    expect(companies).toEqual([{
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
    }])
  })

})











/************************************** get */

/* 
    - Tests the get function in Company class.
    - Checks to see if get() returns specific company information based on company handle passed in.
    - Checks if error will be thrown if company handle passed in does not exist in database.
*/
describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({ company:{
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    }, jobs: [{
      id: 1,
      title: "j1",
      salary: 100,
      equity: "0.1",
      company_handle: "c1"
    }
    ]

  });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});



/************************************** update */

/*
    - Tests the updateData() function in Company class
    - Checks to see if company information is updated in database properly.
    - Checks to see if update still works when non-required fields have the value of null.
    - Checks to see if error is thrown if company handle passed in does not exist in database.
    - Checks to see if error is thrown if no data is passed in.
*/
describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

/*
    - Tests the remove() function in Company class
    - Checks to see if company is removed from database properly.
    - Checks to see if error is thrown if company handle passed in does not exist in database.
*/

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
