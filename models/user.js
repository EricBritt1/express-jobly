"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  // Help with chatGPT on this one. Had the ideas written on paper but, needed it properly formatted.
  // chatGPT had a better way but, wanted to use example FROM chatGPT that resembled mine/what I was aiming for on paper.
  static async findAll() {
    // Query to fetch all users
    const usersResult = await db.query(
        `SELECT username,
                first_name AS "firstName",
                last_name AS "lastName",
                email,
                is_admin AS "isAdmin"
         FROM users
         ORDER BY username`
    );

    // Query to fetch all jobs
    const jobsResult = await db.query(
        `SELECT jobs.id,
                jobs.title,
                jobs.salary,
                jobs.equity,
                jobs.company_handle,
                applications.username AS "applicantUsername"
         FROM jobs
         LEFT JOIN applications ON jobs.id = applications.job_id`
    );

    // Transform the results into a combined structure
    const users = usersResult.rows.map(user => {
        const userJobs = jobsResult.rows
            .filter(job => job.applicantUsername === user.username)
            .map(({ id, title, salary, equity, company_handle }) => ({
                id,
                title,
                salary,
                equity,
                company_handle,
            }));

        return {
            ...user,
            jobs: userJobs,
        };
    });

    return users;
}

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle,
              username
      FROM jobs
      INNER JOIN applications
      ON jobs.id = applications.job_id
      WHERE applications.username = $1
      `, [username]
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return {user, jobs : jobsRes.rows};
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  static async applyForJob(username, job_id) {

   const user = await db.query(`
      SELECT 
      FROM users
      WHERE username=$1
   `, [username])

   const job = await db.query(`
      SELECT
      FROM jobs
      WHERE id=$1
   `, [job_id])

   if(!user.rows[0]) throw new NotFoundError(`No user: ${username}`)
   if(!job.rows[0]) throw new NotFoundError(`No job with id: ${job_id}`)
   if(!job.rows[0] && !user.rows[0]) throw NotFoundError(`No job nor user found`)

    await db.query(
      `INSERT INTO applications
        (username, job_id)
        VALUES ($1, $2)`,[username, job_id]);
    
    

    return { applied: job_id}
  }
}


module.exports = User;
