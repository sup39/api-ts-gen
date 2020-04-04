import { AxiosResponse } from 'axios';
declare type Optional<T> = T | undefined | null;
declare type TPromiseOn<T, R> = Optional<(_: T) => R | PromiseLike<R>>;
export declare abstract class APIPromise<T> implements PromiseLike<T> {
    promise: Promise<T>;
    constructor(req: Promise<AxiosResponse<any>>);
    then<T1 = T, T2 = never>(onRsv?: TPromiseOn<T, T1>, onRjt?: TPromiseOn<any, T2>): Promise<T1 | T2>;
    catch<T2>(onRjt: TPromiseOn<any, T2>): Promise<T | T2>;
    abstract onResponse(res: AxiosResponse<any>): T;
    onSuccess<U, V>(f: Optional<(x: U) => V>, v: U): U | V;
    onFail<U, V>(f: Optional<(x: U) => V>, v: U): V;
}
export {};
