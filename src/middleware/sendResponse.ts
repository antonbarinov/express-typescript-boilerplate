import * as express from 'express';
import { performance } from 'perf_hooks';

export default (app: express.Express) => {
    app.use(async (req, res, next) => {
        if (req.response) {
            const millis = performance.now() - req.__performanceStart;
            const millisStr = millis.toFixed(2);
            res.setHeader('performance', millisStr + 'ms');
            res.send(req.response);
        } else {
            next();
        }
    });
}
