"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job.js")
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await db.query("DROP TABLE applications CASCADE")

  await db.query("DROP TABLE jobs CASCADE");



  await db.query(`
  CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    salary INTEGER CHECK (salary >= 0),
    equity NUMERIC CHECK (equity >= 0 AND equity <= 1.0),
    company_handle VARCHAR(25) NOT NULL REFERENCES companies ON DELETE CASCADE
  );`
);

    await db.query(
    `
    CREATE TABLE applications (
      username VARCHAR(25) REFERENCES users ON DELETE CASCADE,
      job_id INTEGER REFERENCES jobs ON DELETE CASCADE,
      PRIMARY KEY (username, job_id)
    );
  `
  );

  

  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });
    
    await Job.create({
        title: "j1",
        salary: 100,
        equity: "0.1",
        company_handle: "c1"
      });
    
    await Job.create({
        title: "j2",
        salary: 200,
        equity: "0.2",
        company_handle: "c2"
      });
    
    await Job.create({
        title: "j3",
        salary: 300,
        equity: "0.3",
        company_handle: "c3"
      });


  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: true,
  });
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });

const u3AdminToken = createToken({ username: "u3", isAdmin: true})


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u3AdminToken,
};




