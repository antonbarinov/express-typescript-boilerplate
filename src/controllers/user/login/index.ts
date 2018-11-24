import { Validate } from '@antonbarinov/ovalidator';
import { badRequest, successResponse } from 'helpers/responses';
import { asyncWrapper } from 'helpers/functions';

// Validation schema
import validationSchema from './validator_schema';
import { amqpSendEmail } from 'helpers/amqp';


export default asyncWrapper(async (req, res, next) => {
    const data = req.body;
    
    // Validate body params
    //let validationErrors = Validate(validationSchema, data) || [];
    //if (validationErrors.length) return badRequest(req, res, next, validationErrors);

    // Connection for non transactional query's
    const dbClient = await req.getDbClient();

    // Connection for transactions
    const dbClientTransactions = await req.getTransactionsDbClient();

    // Redis client
    const  { redisClient } = req;

    await redisClient.set('time', new Date());

    let result = await dbClient.selectOne(`SELECT NOW() as now`);
    let result2 = await dbClientTransactions.selectOne(`SELECT NOW() as now`);
    let result3 = await redisClient.get('time');

    
    /*
    // Send email
    amqpSendEmail({
        to: 'example@example.com', // Put your email here, to test it
        subject: 'Testing',
        html: '<b>Hello</b>',
        text: 'Hello'
    });
    */
    
    
    successResponse(req, res, next, {
        hello: 'world',
        result,
        result2,
        result3,
    });
});