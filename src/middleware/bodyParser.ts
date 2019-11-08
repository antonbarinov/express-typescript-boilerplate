import * as express from 'express';
import bodyParser from 'body-parser';
import { app } from 'app';


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
