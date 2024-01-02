"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ExpressError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}


/*
Checks if current logged in user is Admin. This will determine their privilidges amongst various routes

If user is not admin for
- post (in companies)
- patch (in companies)
- delete (in companies)

Raises Unauthorized
 */

function ensureAdmin(req, res, next) {
  try {
  if(!res.locals.user || res.locals.user.isAdmin === false) throw new UnauthorizedError()
    return next();
  } catch (err) {
    return next(err);
  }
}


function ensureIsUser(req, res, next) {
  try {
    if(res.locals.user.isAdmin) {
      return next()
    } 
    else if (Object.values(res.locals.user).includes(req.params.username) === true) {
        return next();
    } 
    throw new UnauthorizedError()
    } catch (err) {
      return next(err);
    }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureIsUser
};
