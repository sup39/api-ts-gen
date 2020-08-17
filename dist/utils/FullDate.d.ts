export declare class FullDate {
    private _date;
    constructor();
    constructor(copyFrom: FullDate);
    constructor(date: Date);
    constructor(s: string);
    constructor(n: number);
    constructor(y: number, m: number, d?: number);
    toString(): string;
    toJSON(): string;
    valueOf(): number;
    get date(): Date;
    get year(): number;
    get month(): number;
    get day(): number;
    get dayOfWeek(): number;
    set year(val: number);
    set month(val: number);
    set day(val: number);
    advance(period: number): this;
    advanced(period: number): FullDate;
    distanceFrom(d0: FullDate): number;
}
