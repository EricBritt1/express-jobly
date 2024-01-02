const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

// This is a common file that will be used by all the test files.
// This specific function will be used to clear the database and insert some test data.
async function commonBeforeAll() {
  try {
    // Delete existing data
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM users");
    await db.query("DROP TABLE jobs CASCADE");
    await db.query(`
  CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    salary INTEGER CHECK (salary >= 0),
    equity NUMERIC CHECK (equity <= 1.0),
    company_handle VARCHAR(25) NOT NULL REFERENCES companies ON DELETE CASCADE
  );
`);


    // Insert test data
    await db.query(`
      INSERT INTO companies(handle, name, num_employees, description, logo_url)
      VALUES 
        ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
        ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
        ('c3', 'C3', 3, 'Desc3', 'http://c3.img')
    `);

    await db.query(`
      INSERT INTO users(username, password, first_name, last_name, email)
      VALUES 
        ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
        ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
      RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);

    await db.query(`
      INSERT INTO jobs(title, salary, equity, company_handle)
      VALUES 
        ('j1', 100, 0.1, 'c1'),
        ('j2', 200, 0.2, 'c2'),
        ('j3', 300, 0, 'c3')
      RETURNING id;
    `);
    

  } catch (error) {
    console.error('Error in commonBeforeAll:', error.message);
    throw error; // Rethrow the error to indicate test setup failure
  }
}

//This marks the beginning of a transaction(When the changes to the test database are made)
async function commonBeforeEach() {
  await db.query("BEGIN");
}

// This rolls back the transaction beginning of the transaction where the changes to the test database were not made.
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

// Ends the connection to the test database.
async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};




