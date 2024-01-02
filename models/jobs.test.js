"use strict";

const db = require("../db.js");
const { NotFoundError, BadRequestError } = require("../expressError");
const Job = require("./job.js");
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

// ********************** getAll() */

// ('j1', 100, '0.1', 'c1'),
//('j2', 200, '0.2', 'c2'),
//('j3', 300, '0', 'c3')
describe("getAll() Job method", function () {
      test("Returns all jobs currently inside database", async function () {
       // console.log()
        //console.log()
       // console.log()
        let result = await Job.getAll()
        expect(result).toEqual([
          {
            id: 1,
            title: 'j1',
            salary: 100,
            equity: "0.1",
            company_handle: 'c1'
          },
          {
            id: 2,
            title: 'j2',
            salary: 200,
            equity: "0.2",
            company_handle: 'c2'
          },
          {
            id: 3,
            title: 'j3',
            salary: 300,
            equity: "0",
            company_handle: "c3"
          }])
      })
})


describe("getById(id) Job Method", function () {
  test("Return specified job according to id", async function() {
    let result = await Job.getById(1)
    
    expect(result).toEqual(
      {
        id: 1,
        title: 'j1',
        salary: 100,
        equity: "0.1",
        company_handle: "c1"
      })
  });

  test("Error: Cannot find job with id", async function () {
    try {
    await Job.getById(29)
    fail()
    } catch(err) {
      expect(err instanceof BadRequestError).toBeTruthy
    }
  });
})

/************************ filter() */

//Input edge cases will be handled gracefully in jobsRoute.test. Schema made to handle things such as title = integer.

describe("Filter() Job method", function () {

  test("Return all jobs in database Note: Filter() with no params", async function () {
    let result = await Job.filter()

    expect(result).toEqual(
      [
        {
          id: 1,
          title: 'j1',
          salary: 100,
          equity: "0.1",
          company_handle: 'c1'
        },
        {
          id: 2,
          title: 'j2',
          salary: 200,
          equity: "0.2",
          company_handle: 'c2'
        },
        {
          id: 3,
          title: 'j3',
          salary: 300,
          equity: "0",
          company_handle: "c3"
        }
      ])
  });

  test("Return all jobs like title", async function () {
    let result = await Job.filter('j', null, null)

    expect(result).toEqual(
      [
        {
          id: 1,
          title: 'j1',
          salary: 100,
          equity: "0.1",
          company_handle: 'c1'
        },
        {
          id: 2,
          title: 'j2',
          salary: 200,
          equity: "0.2",
          company_handle: 'c2'
        },
        {
          id: 3,
          title: 'j3',
          salary: 300,
          equity: "0",
          company_handle: "c3"
        }
      ]
    )
  })

  test("Return all jobs > minSalary", async function () {
    let result = await Job.filter(null, 200, null)

    expect(result).toEqual(
      [{
        id: 2,
        title: 'j2',
        salary: 200,
        equity: "0.2",
        company_handle: 'c2'
      },
      {
        id: 3,
        title: 'j3',
        salary: 300,
        equity: "0",
        company_handle: "c3"
      }]
    )
  })

  test("Return all jobs with equity", async function() {
    let result = await Job.filter(null, null, true)

    expect(result).toEqual(
      [
        {
          id: 2,
          title: 'j2',
          salary: 200,
          equity: "0.2",
          company_handle: 'c2'
        },
        {
          id: 1,
          title: 'j1',
          salary: 100,
          equity: "0.1",
          company_handle: 'c1'
        }
      ]
    )
  })

  test("Return all jobs with 0 equity", async function() {
    let result = await Job.filter(null, null, false)

    expect(result).toEqual(
      [
        {
          id: 3,
          title: 'j3',
          salary: 300,
          equity: "0",
          company_handle: "c3"
        }
      ]
    )
  })
});


/************************** Create({title, salary, equity, companyHandle}) */

describe("Create() Job method", function () {

  const test_job = {
      title: "cart_associate", 
      salary : 19, 
      equity : 0, 
      company_handle: 'c1'
  };

  test("Creates instance of Job class", async function () {
    const result = await Job.create(test_job)

    expect(result).toEqual({
      title: "cart_associate", 
      salary : 19, 
      equity : '0', 
      company_handle: 'c1',
      id: 4
    })
  });

  test("Error if creation of duplicate job", async function() {
    try {
    await Job.create(test_job);
    await Job.create(test_job);
    fail();
  } catch(err) {
    expect(err instanceof BadRequestError).toBeTruthy();
  }
  });
})

describe("Update(id, {title, salary, equity}) Job method", function(){
      test("Works Updating full job", async function () {
        const result = await Job.update(1, {
          title: 'j5',
          salary: 500,
          equity: 0.5,
        });

        expect(result).toEqual({
          id: 1,
          title: 'j5',
          salary: 500,
          equity: "0.5",
          company_handle: "c1" 
      })

      });

      // Though, not requested of me, I'd like to learn how to retain the original values of object that aren't being updated.
      test("Works Updating a specific portion of job", async function() {
        const result = await Job.update(1, {title: 'j4'})
        expect(result).toEqual({
          id: 1,
          title: 'j4',
          salary: null,
          equity: null,
          company_handle: "c1"
        })
      });

      test("Fails: No corresponding job id", async function(){
        try {
        await Job.update(99, {
          title: 'j5',
          salary: 500,
          equity: 0.5,
        })
        fail()
      } catch(err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
      });
    });

    describe("update2(id, data) Job method", function () {
      test("Return an updated object", async function () {
        const result = await Job.update2(1, {title: 'j4'})
        console.log(result)
        expect(result).toEqual({
          id: 1,
          title: 'j4',
          salary: 100,
          equity: "0.1",
          company_handle: "c1"
        })
      })
    })

    describe("update2(id, data) Job method", function () {
      test("Pass: Eevn if id is a string", async function () {
        const result = await Job.update2('1', {title: 'j4'})
        expect(result).toEqual({
          id: 1,
          title: 'j4',
          salary: 100,
          equity: "0.1",
          company_handle: "c1"
        })
      })
    })

    describe("remove(id) Job method", function () {
      test("Works: Remove job with corresponding id", async function() {
        const result = await Job.remove(1);
        expect(result).toEqual(
          {
            id: 1,
            title: 'j1',
            salary: 100,
            equity: '0.1',
            company_handle: 'c1'
          }
        );
        try {
          await Job.getById(1)
          fail()
        } catch(err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });

      test("Fails: No corresponding job id", async function() {
        try {
        await Job.remove(99)
        fail()
        } catch(err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      })
    })