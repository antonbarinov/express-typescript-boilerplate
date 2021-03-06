import * as express from 'express';
import loginController from 'controllers/user/login';
import authOnlyMiddleware from 'middleware/authOnly';
import { app } from 'app';

app.post('/user/signup', loginController);
app.post('/user/login', loginController);
app.get('/user/login', loginController);
app.get('/', loginController);
app.get('/error', (req, res) => {
    throw new Error('Some unhandled error');
});