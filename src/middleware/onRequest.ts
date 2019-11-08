import * as express from 'express';
import { performance } from 'perf_hooks';
import { app } from 'app';


app.use(async (req, res, next) => {
    req.__performanceStart = performance.now();
    
    next();
});