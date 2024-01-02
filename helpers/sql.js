const { BadRequestError } = require("../expressError");

/*
Note from student: I did not write the documentation. I copied it from the GitHub copilot suggestion. This was extremely hard for me to understand since I didn't have any refernce anywhre else in the code. So when I make the test for this function, I will make sure to try to get a solid understanding of what is going on here.
*/

/**
 * GITHUB COPILOT DOCUMENTATION
 * This function creates a SQL query for updating some fields in a database record.
 *
 * @param {Object} dataToUpdate - The data you want to update.
 * @param {Object} jsToSql - A map from JavaScript names to SQL column names.
 *
 * @returns {Object} An object with two properties:
 * - 'setCols': a string for the SQL SET clause (e.g., '"first_name"=$1, "age"=$2')
 * - 'values': an array of the new values for the fields (e.g., ['Aliya', 32])
 *
 * @example
 * sqlForPartialUpdate({firstName: 'Aliya', age: 32}, {firstName: 'first_name'})
 * // returns {setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32]}
 */



/**
 * MY DOCUMENTATION WITH EXAMPLES TO SHOW WHAT I LEARNED (Had some help from chatGPT)
 * @param {*} dataToUpdate - Pass in an object with the data you want to update. This will later be turned into an array of they keys of values in object. 
 * @param {*} jsToSql - I have no idea at what this could be. I got an explannation from chatGPT and it appears to be purposeful. Maps javascript style names to SQL column names. Allows you to keep code in javaScript convention and not have to worry about strict SQL conventions when writing SQL queries. Keeps javascript and SQL code separate.
 * 
 * @example
 * 
 * const jsToSql = {
  firstName: 'first_name',
  lastName: 'last_name',
  userAge: 'age',
  emailAddress: 'email_address',
};

const dataToUpdate = {
  firstName: 'John',
  lastName: 'Doe',
  userAge: 30,
  emailAddress: 'john.doe@gg.com',
};
 *
 * @description - So if passed into sqlForPartialUpdate, When the columns are being set, if dataToUpdate has a key that matches a key in jsToSql, it'll use that KEY's value as the column name BECAUSE it's proper SQL column naming convention. If it doesn't match, it'll just use dataToUpdate's key as the column name. You can either just pass in dataToUpdate with proper SQL column names or you can pass in dataToUpdate with javascript style names and use jsToSql to map them to SQL column names.
 * 
 * @returns - An object with two properties: setCols and values. SetCols is a string that can be used to set clasues in SQL. The values are the values that will be used to update the $(number) in setCols stirng.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
