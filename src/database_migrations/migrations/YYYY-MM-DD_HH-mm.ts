import wrapper from '../migrationScriptWrapper';;

module.exports = wrapper(async (client) => {
    await client.selectOne(`SELECT NOW()`);
    //await client.query(`ALTER TABLE ...`); // For fails test

    return true;
});