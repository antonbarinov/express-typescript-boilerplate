import * as express from 'express';
import { sendResponse } from 'helpers/responses';
import { handleExpressUnexpectedError } from 'helpers/functions';
import { app } from 'app';


app.use(handleExpressUnexpectedError);
