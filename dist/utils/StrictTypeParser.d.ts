import { FullDate } from './FullDate';
export declare module StrictTypeParser {
    class BadValueError extends Error {
        attr: string;
        type: string;
        value: any;
        constructor(attr: string, type: string, value: any);
    }
    function _number(x: any, attr: string): number;
    function _string(x: any, attr: string): string;
    function _boolean(x: any, attr: string): boolean;
    function _Date(x: any, attr: string): Date;
    function _FullDate(x: any, attr: string): FullDate;
    function _byte(x: any, attr: string): string;
    function _binary(x: any, attr: string): string;
    function _Array(x: any, attr: string): Array<any>;
    const supportTypes: string[];
}
