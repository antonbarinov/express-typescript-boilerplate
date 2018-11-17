// Enironment
process.env.NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();

//Ensure we're in the project directory, so relative paths work as expected no matter where we actually lift from.
const rootDir = __dirname + '/../'
process.chdir(rootDir);

// Absolute modules require's without node_modules
process.env.NODE_PATH = rootDir;
process.env.ROOT_DIR = rootDir;
require('module').Module._initPaths();



import util from 'util';
import fs from 'fs';
const readdir = util.promisify(fs.readdir);
const fStat = util.promisify(fs.stat);
import path from 'path';

import PgPool from 'lib/pgsql_wrapper';
import config from 'helpers/config';

// Init PostresSQL connections pool
const pgPool = new PgPool(config.postgres);

const dir = path.join(__dirname, 'migrations');
(async () => {
    try {
        console.log(`DATABASE MIGRATIONS STARTED`);
        const client = await pgPool.getTransactionClient();

        // Create migrations table if not exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS "migrations" (
                "script" VARCHAR(255) NOT NULL,
                PRIMARY KEY ("script")
            );
        `);

        let files = await readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fStat(filePath);
            const ext = path.extname(file);
            if (stat.isFile() && ext == '.js') {
                const scriptName = path.basename(filePath);

                const alreadyMigrate = await client.selectOne(`SELECT * FROM "migrations" WHERE "script" = :scriptName`, { scriptName });
                if (alreadyMigrate) continue;

                // Begin transaction
                await client.beginTransaction();

                try {
                    const migration_script = require(filePath);

                    // Exec migration
                    await migration_script(client);
                    
                    // Save migration into migrations table
                    client.add('script', scriptName);
                    await client.insert('migrations');

                    // Commit transaction
                    await client.commitTransaction();
                } catch (e) {
                    // Rollback transaction
                    await client.rollbackTransaction();
                    console.error(`[${scriptName}] ${e.message}`);
                    process.exit(1); // This means that procces finished with errors
                }
            }
        }
        
        console.log(`DATABASE MIGRATIONS FINISHED`);
        process.exit(0); // This means that procces finished success
    } catch (e) {
        console.error(e);
        process.exit(1); // This means that procces finished with errors
    }
})();