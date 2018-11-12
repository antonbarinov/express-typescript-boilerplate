import { Validator, Validate } from '@antonbarinov/ovalidator';
import { badRequest, successResponse } from 'helpers/responses';
import { asyncWrapper } from 'helpers/functions';
import { UserTypes } from 'typings/user';


const validationSchema = {
    // Required
    country_code: new Validator().required().typeString().regexp(/^[0-9]{1,5}$/, (objPath) => `${objPath} invalid International country code format`),
    phone_number: new Validator().required().typeString().regexp(/^[0-9]{6,10}$/, (objPath) => `${objPath} invalid International phone number format`),
    device_platform: new Validator().required().typeString().customFunction(
        // Validation
        (value) => value === 'ios' || value === 'android',
        // Error msg
        (objPath) => `${objPath} "ios" or "android" expected`
    ),
    account_type: new Validator().required().typeInteger().customFunction(
        // Validation
        (value) => UserTypes[value] !== undefined,
        // Error msg
        (objPath) => `${objPath} invalid`
    ),


    // Optional
    push_token: new Validator().typeString(),
    email: new Validator().typeString().email(),
    name: new Validator().typeString(),
};


export default asyncWrapper(async (req, res, next) => {
    const data = req.body;
    //let validationErrors = Validate(validationSchema, data) || [];
    //if (validationErrors.length) return badRequest(req, res, next, validationErrors);

    // Connection for non transactional query's
    const dbClient = await req.getDbClient();
    // Connection for transactions
    const dbClientTransactions = await req.getTransactionsDbClient();
    // Redis client
    const  { redisClient } = req;

    let result = await dbClient.selectOne(`SELECT NOW() as now`);
    let result2 = await dbClientTransactions.selectOne(`SELECT NOW() as now`);

    
    successResponse(req, res, next, {
        now: result,
        now2: result2
    });
});