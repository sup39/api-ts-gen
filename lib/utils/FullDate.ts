function removeTime(date: Date): Date {
  const dt = date.getTimezoneOffset()*60e3;
  return new Date(new Date(date.valueOf()-dt).setUTCHours(0, 0, 0, 0));
}
export class FullDate {
  private _date: Date;

  constructor();
  constructor(copyFrom: FullDate);
  constructor(date: Date);
  constructor(s: string);
  constructor(n: number);
  constructor(y: number, m: number, d?: number);
  constructor(...argv: [any?, number?, number?]) {
    this._date = removeTime((() => {
      if (argv.length == 0) return new Date();
      if (argv.length == 1) {
        const arg = argv[0];
        if (arg instanceof FullDate) return new Date(+arg);
        if (arg instanceof Date) return arg;
        if (typeof arg === 'string') {
          const tokens = /^(\d+)-(\d+)-(\d+)$/g.exec(arg)?.slice(1, 4);
          if (tokens) return new Date(+tokens[0], +tokens[1]-1, +tokens[2]);
        }
        return new Date(arg);
      }
      return new Date(argv[0], (argv[1] ?? 1)-1, argv[2] ?? 1);
    })());
  }
  toString(): string {
    const d = this._date;
    const f = (s: any) => ('0'+s).slice(-2);
    return `${d.getUTCFullYear()}-${
      f(d.getUTCMonth()+1)}-${f(d.getUTCDate())}`;
  }
  toJSON(): string {
    return this.toString();
  }
  valueOf(): number {
    return this._date.valueOf();
  }
  // getter
  get date(): Date {
    return new Date(this._date);
  }
  get year(): number {
    return this._date.getUTCFullYear();
  }
  get month(): number {
    return this._date.getUTCMonth()+1;
  }
  get day(): number {
    return this._date.getUTCDate();
  }
  get dayOfWeek(): number {
    return this._date.getUTCDay();
  }
  // setter
  set year(val: number) {
    this._date.setUTCFullYear(val);
  }
  set month(val: number) {
    this._date.setUTCMonth(val-1);
  }
  set day(val: number) {
    this._date.setUTCDate(val);
  }
  // func
  advance(period: number): FullDate {
    return new FullDate(this._date.valueOf()+period*86400e3);
  }
  distanceFrom(d0: FullDate): number {
    return (this.valueOf()-d0.valueOf())/86400e3;
  }
}
