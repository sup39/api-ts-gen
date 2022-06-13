import { AxiosPromise, AxiosResponse } from 'axios';
declare type ValueOf<T> = T[keyof T];
declare type RHandler<T> = ValueOf<{
    [K in keyof T]: T[K] extends (data: any) => infer U ? U : never;
}>;
export declare class BadResponseError extends Error {
    res: AxiosResponse;
    constructor(res: AxiosResponse, label: string);
}
export declare class APIPromise<TRes, KRsv extends keyof TRes, THdl extends {
    [K in KRsv]: (data: TRes[K]) => any;
}, KOn extends keyof TRes = keyof TRes> implements PromiseLike<RHandler<THdl>> {
    private handlers;
    private promise;
    constructor(resPromise: AxiosPromise, stps: {
        [K in keyof TRes]: (data: any) => TRes[K];
    }, handlers: THdl);
    static init<TRes, KRsv extends keyof TRes>(res: AxiosPromise, stps: {
        [K in keyof TRes]: (data: any) => TRes[K];
    }, kRsvs: KRsv[]): APIPromise<TRes, KRsv, {
        [K in KRsv]: (data: TRes[K]) => TRes[K];
    }>;
    on<KK extends KOn, URst>(status: KK, handler: (data: TRes[KK]) => URst): APIPromise<TRes, KRsv | KK, {
        [K in (KRsv | KK)]: (data: TRes[K]) => K extends KK ? URst : K extends keyof THdl ? ReturnType<THdl[K]> : never;
    }, Exclude<KOn, KK>>;
    then<RRsv = never, RRjt = never>(onRsv?: (value: RHandler<THdl>) => RRsv | PromiseLike<RRsv>, onRjt?: (reason: any) => RRjt | PromiseLike<RRjt>): Promise<RRsv | RRjt>;
    catch<RRjt>(onRjt: (reason: any) => RRjt | PromiseLike<RRjt>): Promise<RRjt>;
}
export {};
