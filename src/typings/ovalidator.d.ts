declare module '@antonbarinov/ovalidator' {
    interface IErrorMsgFunction{
        (objPathStr: string, maxnValue: number): string;
    }

    export class Validator {
        required() : Validator;
        typeString(): Validator;
        typeInteger(): Validator;
        typeFloat(): Validator;
        typeObject(): Validator;
        typeBoolean(): Validator;
        min(minValue: number, errMsgFunc?: IErrorMsgFunction): Validator;
        max(maxnValue: number, errMsgFunc?: IErrorMsgFunction): Validator;
        email(errMsgFunc?: IErrorMsgFunction): Validator;
        default(value: any): Validator;
        minLength(minValue: number, errMsgFunc?: IErrorMsgFunction): Validator;
        maxLength(maxnValue: number, errMsgFunc?: IErrorMsgFunction): Validator;
        regexp(regexp: RegExp, errMsgFunc?: IErrorMsgFunction): Validator;
        customFunction(func: (any) => any, errMsgFunc?: IErrorMsgFunction): Validator;
    }

    export function Validate(schema: any, objToValidate: any, allowUnexpectedFiends?: boolean): string[];
}
