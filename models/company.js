"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

//There is a lot of repettitive code here. chatGPT had a condensed way that i'll use going forward but, for now I'll leeave it as it is until I speak with mentor.

  static async filter(name = null, minEmployees = null, maxEmployees = null) {
    /***********  NAME PORTION ***********/
  if (name && minEmployees && maxEmployees){
      const companiesRes = await db.query(
        `SELECT DISTINCT 
                handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies       
         WHERE LOWER(name) LIKE LOWER($1) AND num_employees >= $2 AND num_employees <= $3
         ORDER BY num_employees DESC`, [`%${name}%`, minEmployees, maxEmployees]);
         if(minEmployees > maxEmployees && maxEmployees !== null ) {
          throw new BadRequestError(`Min employees cannot be greater or equal to max employees`)
         }
         //else if (!companiesRes.rows[0]) throw new NotFoundError(`No companies fit criteria`); 
         return companiesRes.rows;
      }
    else if (name && !minEmployees && !maxEmployees) {
    const companiesRes = await db.query(
      `SELECT handle,
              name,
              description,
              logo_url AS "logoUrl"
       FROM companies       
       WHERE LOWER(name) LIKE LOWER($1)`, [`%${name}%`]);
       if (!companiesRes.rows[0]) throw new NotFoundError(`No companies fit criteria`);
       return companiesRes.rows;
    }

    else if (name && minEmployees && !maxEmployees){
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies       
         WHERE LOWER(name) LIKE LOWER($1) AND num_employees >= $2`, [`%${name}%`, minEmployees]);
         if (!companiesRes.rows[0]) throw new NotFoundError(`No companies fit criteria`);
         return companiesRes.rows;
      }

    else if (name && !minEmployees && maxEmployees){
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies       
         WHERE LOWER(name) LIKE LOWER($1) AND num_employees <= $2
         ORDER BY num_employees DESC`, [`%${name}%`, maxEmployees]);
         if (!companiesRes.rows[0]) throw new NotFoundError(`No companies fit criteria`);
         return companiesRes.rows;
      }

      /***** END OF NAME PORTION ***********/

      /**** MIN EMPLOYEES AND MAX EMPLOYEES PORTION ******/

    else if (!name && !minEmployees && maxEmployees) {
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies       
         WHERE num_employees <= $1
         ORDER BY num_employees DESC
         `, [maxEmployees]);
         if (!companiesRes.rows[0]) throw new NotFoundError(`No companies fit criteria`);
         return companiesRes.rows      
    }

    else if (!name && minEmployees && !maxEmployees) {
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies       
         WHERE num_employees >= $1
         ORDER BY num_employees ASC
         `, [minEmployees]);
         if (!companiesRes.rows[0]) throw new NotFoundError(`No companies fit criteria`);
         return companiesRes.rows;
    }

    else if (!name && minEmployees && maxEmployees) {
      const companiesRes = await db.query(
        `SELECT DISTINCT 
                handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies       
         WHERE num_employees >= $1 AND num_employees <= $2
         ORDER BY num_employees ASC`, [minEmployees, maxEmployees]);

        if ( (minEmployees > maxEmployees && maxEmployees !== null)){
          throw new BadRequestError(`Min employees cannot be greater or equal to max employees`);
        }
         else if (!companiesRes.rows[0]) throw new NotFoundError(`No companies fit criteria`);
         return companiesRes.rows;
    }
    else if (!name && !minEmployees && !maxEmployees) {
      const companiesRes = await db.query(
        `SELECT DISTINCT
                handle,
                name,
                description,
                logo_url AS "logoUrl"
         FROM companies`
    )
      if (!companiesRes.rows[0]) throw new NotFoundError(`No companies fit criteria`);
      return companiesRes.rows;
  }
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const jobsRes = await db.query(
          `SELECT id, 
                  title, 
                  salary, 
                  equity, 
                  company_handle
            FROM jobs
            WHERE company_handle = $1`,
            [handle]);

    const company = companyRes.rows[0];


    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return { company, jobs: jobsRes.rows };
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
