export declare class FullDate {
    private _date;
    constructor(...argv: any);
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
    advance(period: number): FullDate;
}
