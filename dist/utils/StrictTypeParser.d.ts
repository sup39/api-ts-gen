import { FullDate } from './FullDate';
export declare module StrictTypeParser {
    class BadValueError extends Error {
        label: string;
        constructor(label: string, message: string);
    }
    class BadTypeError extends BadValueError {
        label: string;
        type: string;
        value: any;
        constructor(label: string, type: string, value: any);
    }
    function _int32(x: any, label: string): number;
    function _number(x: any, label: string): number;
    function _string(x: any, label: string): string;
    function _boolean(x: any, label: string): boolean;
    function _Date(x: any, label: string): Date;
    function _FullDate(x: any, label: string): FullDate;
    function _byte(x: any, label: string): string;
    function _binary(x: any, label: string): string;
    function _Array<T>(x: any, label: string, mapper: (x: any) => T): Array<T>;
    function parse<T>(stp: (val: any, label: string) => T, val: any, label: string): T;
    function nullableParse<T>(stp: (val: any, label: string) => T, val: any, label: string): T | null;
    const supportTypes: string[];
}
