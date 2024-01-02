const db = require('../db');
const { NotFoundError, BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Job {
    static async getAll() {
        const result = await db.query(`
            SELECT id, title, salary, equity, company_handle
            FROM jobs
        `);
        if (result.rows.length === 0) {
            throw new NotFoundError(`No available jobs`);
        }
        return result.rows;
    }

    static async getById(id) {
        const result = await db.query(`
            SELECT id, title, salary, equity, company_handle
            FROM jobs
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0 ) {
            throw new NotFoundError(`Cannot find job with id ${id}`);
        }

        return result.rows[0];
    }

//Credit to chatGPT for this. I coudl've done this myself as can be seen in company.js BUT I wanted to learn a neater more organized way of creating the filter function.

    static async filter(title = null, minSalary = null, hasEquity = null) {
        let query = `
            SELECT DISTINCT
                id,
                title,
                salary,
                equity,
                company_handle
            FROM jobs
        `;

        const params = [];

        let conditions = [];

        if (title !== null) {
            conditions.push(`LOWER(title) LIKE LOWER($${params.length + 1})`);
            params.push(`%${title}%`);
        }

        if (minSalary !== null) {
            conditions.push(`salary >= $${params.length + 1}`);
            params.push(minSalary);
        }

        if (hasEquity !== null) {
            // Handle hasEquity as a condition in an if statement
            if (hasEquity) {
                conditions.push(`equity > 0`);
            } else {
                conditions.push(`equity = 0`);
            }
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        const jobsRes = await db.query(query, params);

        return jobsRes.rows;
    }

    static async create({ title, salary, equity, company_handle }) {
        const duplicateCheck = await db.query(
            `SELECT company_handle
             FROM jobs
             WHERE title = $1`,
          [title]);
        
          if (duplicateCheck.rows[0])
          throw new BadRequestError(`Duplicate job: ${company_handle}`);

        const result = await db.query(`
            INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle
        `, [title, salary, equity, company_handle]);

        return result.rows[0];
    }

    static async update(id, { title, salary, equity}) {
        const result = await db.query(`
            UPDATE jobs
            SET title = $1, salary = $2, equity = $3
            WHERE id = $4
            RETURNING id, title, salary, equity, company_handle
        `, [title, salary, equity, id]);

        if (result.rows.length === 0) {
            throw new NotFoundError(`Cannot find job with id ${id}`);
        }

        return result.rows[0];
    }

    // Realized I should've been using sqlForPartialUpdate AFTER I made update.
    static async update2(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
              title: "title",
              salary: "salary",
              equity: "equity"
            });
        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                                    title, 
                                    salary, 
                                    equity, 
                                    company_handle`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job with id of ${id}`);
    
        return job;
      }

    static async remove(id) {
        const result = await db.query(`
            DELETE FROM jobs
            WHERE id = $1
            RETURNING id, title, salary, equity, company_handle
        `, [id]);

        if (result.rows.length === 0) {
            throw new NotFoundError(`Cannot find job with id ${id}`);
        }

        return result.rows[0];
    }
}

module.exports = Job;
