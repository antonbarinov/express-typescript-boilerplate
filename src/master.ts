import cluster from 'cluster';
import * as os from 'os';
const numCPUs = os.cpus().length;

(async () => {
    // If process is master
    if (cluster.isMaster) {
        console.log(`Master ${process.pid} is running`);

        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        // When worker dies we do new fork
        cluster.on('exit', (worker, code, signal) => {
            console.log('worker %d died (%s). restarting...',
                worker.process.pid, signal || code);
            cluster.fork();
        });
    }
    // If process is worker
    else {
        console.log('Worker is forked...');
        require('./index');
    }
})();