// Enironment
process.env.NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();

// Ensure we're in the project directory, so relative paths work as expected no matter where we actually lift from.
process.chdir(__dirname);

// Absolute modules require's without node_modules
process.env.NODE_PATH = __dirname;
process.env.ROOT_DIR = __dirname;
require('module').Module._initPaths();


// Import app
import "./app";