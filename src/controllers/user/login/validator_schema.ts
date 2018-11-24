import { Validator } from '@antonbarinov/ovalidator';
import { UserTypes } from 'typings/user';

export default {
    // Required
    email: new Validator().required().typeString().email(),
    password: new Validator().required().typeString(),
    account_type: new Validator().required().typeInteger().customFunction(
        // Validation
        (value) => UserTypes[value] !== undefined,
        // Error msg
        (objPath) => `${objPath} invalid`
    ),
};