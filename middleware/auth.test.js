"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
     //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    /*
    - Create req object with headers property. This contains an authorization property with a value of `Bearer ${testJwt}`.
    - This line initializes a mock response object (res) with an empty locals property. Res will be used to store information related to the authenticated user.

    -To note AuthenticateJWT sets user property on res.locals to the decoded token payload.
    - The decoded token payload is an object (user) with the following properties:
    user : {
    - iat: expect.any(Number)
    - username: "test"
    - isAdmin: false
    }

    - In summary, const res = { locals: {} }; initializes a mock response object with an empty locals property, and this object is used to test whether the authenticateJWT function correctly modifies the response object during the authentication process.

    

    */
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


//The assertion is being triggered by the NEXT in ensureLoggedIn(req, res, next);, which is the last line of the test.
describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });


// The assertion is being triggered by the next(err) in ensureLoggedIn(req, res, next);, which is the last line of the test.
  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});
