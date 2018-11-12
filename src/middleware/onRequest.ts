import * as express from 'express';
import { performance } from 'perf_hooks';

export default (app: express.Express) => {
    app.use(async (req, res, next) => {
        req.__performanceStart = performance.now();
        
        next();
    });
}
