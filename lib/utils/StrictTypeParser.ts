import {FullDate} from './FullDate';

export module StrictTypeParser {
  export class BadValueError extends Error {
    constructor(public label: string, message: string) {
      super(message);
      console.error(this.message);
      Object.setPrototypeOf(this, BadTypeError.prototype);
    }
  }
  export class BadTypeError extends BadValueError {
    constructor(public label: string, public type: string, public value: any) {
      super(label, `${label}: Can not convert \`${
        ['object', 'array'].includes(typeof value) ?
          JSON.stringify(value) : `${value}`
      }\` to type ${type}`);
    }
  }

  export function _int32(x: any, label: string): number {
    if (typeof x === 'number' && x === (x|0)) return x;
    if (typeof x === 'string') { // convert from url
      const r = +x|0;
      if (x === r.toString()) return r;
    }
    throw new BadTypeError(label, 'int32', x);
  }
  export function _number(x: any, label: string): number {
    if (typeof x === 'number') return x;
    if (typeof x === 'string') { // convert from url
      const r = +x;
      if (!isNaN(r)) return r;
    }
    throw new BadTypeError(label, 'number', x);
  }
  export function _string(x: any, label: string): string {
    if (typeof x === 'string') return x;
    if (typeof x === 'object') return x.toString();
    throw new BadTypeError(label, 'string', x);
  }
  export function _boolean(x: any, label: string): boolean {
    if (typeof x === 'boolean') return x;
    if (typeof x === 'number') return x!==0;
    if (x==='true') return true;
    if (x==='false') return false;
    throw new BadTypeError(label, 'boolean', x);
  }
  export function _Date(x: any, label: string): Date {
    const r = new Date(x);
    if (x != null && !isNaN(+r)) return r;
    throw new BadTypeError(label, 'Date', x);
  }
  export function _FullDate(x: any, label: string): FullDate {
    const r = new FullDate(x);
    if (x != null && !isNaN(+r)) return r;
    throw new BadTypeError(label, 'FullDate', x);
  }
  export function _byte(x: any, label: string): string {
    if (typeof x === 'string') return x;
    if (x instanceof Buffer) return x.toString('base64');
    throw new BadTypeError(label, 'byte', x);
  }
  export function _binary(x: any, label: string): string {
    if (typeof x === 'string') return x;
    if (x instanceof Buffer) return x.toString('hex');
    if (x?.buffer instanceof Buffer) return x.toString('hex');
    throw new BadTypeError(label, 'binary', x);
  }
  export function _Array<T>(x: any, label: string,
    mapper: (x: any)=>T): Array<T> {
    if (x instanceof Array) return x.map(mapper);
    throw new BadTypeError(label, 'Array', x);
  }

  export function undefinedCheck(val: any, label: string) {
    if (val === undefined) {
      throw new BadValueError(label,
        `${label} is required, but got undefined`);
    }
  }
  export function parse<T>(
    stp: (val: any, label: string)=>T, val: any, label: string): T {
    // body
    undefinedCheck(val, label);
    if (val === null) {
      throw new BadValueError(label,
        `${label} is not nullable, but got null`);
    }
    return stp(val, label);
  }
  export function nullableParse<T>(
    stp: (val: any, label: string)=>T, val: any, label: string): T | null {
    // body
    undefinedCheck(val, label);
    return val === null ? null : stp(val, label);
  }
  export const supportTypes = [
    'int32', 'number', 'string', 'boolean',
    'Date', 'FullDate', 'byte', 'binary'];
}
