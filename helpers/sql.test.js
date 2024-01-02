
const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
    //JS convention to be mapped to SQL convention
  const jsToSql = {
    firstName: 'first_name',
    lastName: 'last_name',
    userAge: 'age',
    emailAddress: 'email_address',
  };

  // JS convention to be mapped to SQL convention. This is the same as jsToSql but with underscores instead of camelCase. The function will use coresponding values in jsToSql.
  const dataToUpdate = {
    firstName: 'John',
    lastName: 'Doe',
    userAge: 30,
    emailAddress: 'test.doe@gg.com'
  };

  // JS convention to be mapped to SQL convention. This is the same as jsToSql but with underscores instead of camelCase. The function should use the keys in this object as the column names because it's already in SQL convention.
  const dataToUpdate2 = {
    first_name: 'John',
    last_name: 'Doe',
    age: 30,
    email_address: 'test.doe@gg.com'
  };

  test("works with jsToSql", function () {
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2, "age"=$3, "email_address"=$4',
      values: ['John', 'Doe', 30, 'test.doe@gg.com']
    });
});

test("Error thrown with no data", function () {
    try {
        sqlForPartialUpdate({}, {})
    } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
    }
});

test("Works with just dataToUpdate2", function () {
    const result = sqlForPartialUpdate(dataToUpdate2, {});
    expect(result).toEqual({
        setCols: '"first_name"=$1, "last_name"=$2, "age"=$3, "email_address"=$4',
        values: ['John', 'Doe', 30, 'test.doe@gg.com']
    })
});

test("Doesn't work with just jsToSql", function () {
    try {
        sqlForPartialUpdate({}, jsToSql)
    } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
    }
});

});