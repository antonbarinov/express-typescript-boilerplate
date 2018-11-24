declare module 'queue-holder' {
    export default class Validator {
        hold(): Promise<boolean>;
        release(): boolean;
        sleep(seconds?: number): Promise<void>;
        inQueue(): boolean;
    }
}
