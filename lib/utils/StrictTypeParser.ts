import {FullDate} from './FullDate';

export module StrictTypeParser {
  export class BadValueError extends Error {
    constructor(public attr: string, public type: string, public value: any) {
      super(`${attr}: Can not convert \`${
        ['object', 'array'].includes(typeof value) ?
          JSON.stringify(value) : `${value}`
      }\` to type ${type}`);
      console.error(this.message);
      Object.setPrototypeOf(this, BadValueError.prototype);
    }
  }

  export function _number(x: any, attr: string): number {
    if (typeof x === 'number') return x;
    if (typeof x === 'string') {
      const r = +x;
      if (!isNaN(r)) return r;
    }
    throw new BadValueError(attr, 'number', x);
  }
  export function _string(x: any, attr: string): string {
    if (typeof x === 'string') return x;
    if (typeof x === 'object') return x.toString();
    throw new BadValueError(attr, 'string', x);
  }
  export function _boolean(x: any, attr: string): boolean {
    if (typeof x === 'boolean') return x;
    if (x==='true') return true;
    if (x==='false') return false;
    throw new BadValueError(attr, 'boolean', x);
  }
  export function _Date(x: any, attr: string): Date {
    const r = new Date(x);
    if (!isNaN(+r)) return r;
    throw new BadValueError(attr, 'Date', x);
  }
  export function _FullDate(x: any, attr: string): FullDate {
    const r = new FullDate(x);
    if (!isNaN(+r)) return r;
    throw new BadValueError(attr, 'FullDate', x);
  }
  export function _byte(x: any, attr: string): string {
    if (typeof x === 'string') return x;
    if (x instanceof Buffer) return x.toString('base64');
    throw new BadValueError(attr, 'byte', x);
  }
  export function _binary(x: any, attr: string): string {
    if (typeof x === 'string') return x;
    if (x instanceof Buffer) return x.toString('hex');
    if (x?.buffer instanceof Buffer) return x.toString('hex');
    throw new BadValueError(attr, 'binary', x);
  }
  export function _Array(x: any, attr: string): Array<any> {
    if (x instanceof Array) return x;
    throw new BadValueError(attr, 'Array', x);
  }
  export const supportTypes = [
    'number', 'string', 'boolean', 'Date', 'FullDate', 'byte', 'binary'];
}
