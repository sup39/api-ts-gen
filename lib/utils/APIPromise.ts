import {AxiosResponse} from 'axios';

type ValueOf<T> = T[keyof T];
type RHandler<T> = ValueOf<{[K in keyof T]:
  T[K] extends (data: any) => infer U ? U : never}>;

function typeGuard<T extends U, U=any>(checker: (x: U) => boolean) {
  return function(x: U): x is T {
    return checker(x);
  };
}

export class BadResponseError extends Error {
  constructor(public res: AxiosResponse<any>, label: string) {
    super(`${label} status code: ${res.status}\ndata: ${
      typeof res.data === 'object' ? JSON.stringify(res.data) : res.data}`);
    Object.setPrototypeOf(this, BadResponseError.prototype);
  }
}

export class APIPromise<
  TRes,
  KRsv extends keyof TRes,
  THdl extends {[K in KRsv]: (data: TRes[K]) => any},
  KOn extends keyof TRes = keyof TRes,
> implements PromiseLike<RHandler<THdl>> {
  private promise: Promise<RHandler<THdl>>;

  constructor(
    resPromise: Promise<AxiosResponse>,
    stps: {[K in keyof TRes]: (data: any) => TRes[K]},
    private handlers: THdl,
  ) {
    this.promise = resPromise.then(res => {
      const {status, data} = res;
      if (!typeGuard<keyof TRes>(x=>stps.hasOwnProperty(x))(status)) {
        // unexpected status
        throw new BadResponseError(res, 'Unexpected');
      }
      const r = stps[status](data);
      if (!typeGuard<KRsv>(x=>this.handlers.hasOwnProperty(x))(status)) {
        // unhandled status
        throw new BadResponseError(res, 'Unhandled');
      }
      const handler = this.handlers[status];
      return handler(r);
    });
  }

  static init<TRes, KRsv extends keyof TRes>(
    res: Promise<AxiosResponse>,
    stps: {[K in keyof TRes]: (data: any) => TRes[K]},
    kRsvs: KRsv[],
  ): APIPromise<
    TRes, KRsv, {[K in KRsv]: (data: TRes[K]) => TRes[K]}
  > {
    const handlers: {[K in KRsv]: (data: TRes[K]) => TRes[K]} = {} as any;
    for (const kRsv of kRsvs) {
      handlers[kRsv] = x => x;
    }
    return new APIPromise(res, stps, handlers);
  }

  on<KK extends KOn, URst>(
    status: KK, handler: (data: TRes[KK]) => URst,
  ): APIPromise<
    TRes,
    KRsv | KK,
    {[K in (KRsv | KK)]: (data: TRes[K]) => K extends KK ? URst :
      K extends keyof THdl ? ReturnType<THdl[K]>: never},
    Exclude<KOn, KK>
  > {
    const self = this as any;
    self.handlers[status] = handler;
    return self;
  }

  then<RRsv=never, RRjt=never>(
    onRsv?: (value: RHandler<THdl>) => RRsv|PromiseLike<RRsv>,
    onRjt?: (reason: any) => RRjt|PromiseLike<RRjt>,
  ): Promise<RRsv|RRjt> {
    return this.promise.then(onRsv, onRjt);
  }
  catch<RRjt>(
    onRjt: (reason: any) => RRjt|PromiseLike<RRjt>,
  ) {
    return this.then(undefined, onRjt);
  }
}
