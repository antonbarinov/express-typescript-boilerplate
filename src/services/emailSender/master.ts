import cluster from 'cluster';

// from pm2.config.js app name
const serviceName = process.env.name;

(async () => {
    // If process is master
    if (cluster.isMaster) {
        console.log(`Master (${serviceName}) ${process.pid} is running`);

        // Fork workers.
        cluster.fork();

        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker (${serviceName}) %d died (%s). restarting...`,
                worker.process.pid, signal || code);
            cluster.fork();
        });
    }
    // If process is worker
    else {
        console.log(`Starting ${serviceName}`);
        require('./index');
        console.log(`${serviceName} started`);
    }
})();