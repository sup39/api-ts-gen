import {AxiosResponse} from 'axios';

class BadResponseError extends Error {
  constructor(public err: Error, public res: AxiosResponse<any>) {
    super(err.toString());
    Object.setPrototypeOf(this, BadResponseError.prototype);
  }
}

type Optional<T> = T | undefined | null;
type TPromiseOn<T, R> = Optional<(_: T) => R | PromiseLike<R>>;
export abstract class APIPromise<T> implements PromiseLike<T> {
  promise: Promise<T>;

  constructor(req: Promise<AxiosResponse<any>>) {
    this.promise = new Promise((rsv, rjt)=>{
      req.then(res=>{
        try {
          rsv(this.onResponse(res));
        } catch (err) {
          rjt(new BadResponseError(err, res));
        }
      }).catch(err=>rjt(err));
    });
  }

  then<T1=T, T2=never>(onRsv?: TPromiseOn<T, T1>, onRjt?: TPromiseOn<any, T2>) {
    return this.promise.then(onRsv, onRjt);
  }
  catch<T2>(onRjt: TPromiseOn<any, T2>) {
    return this.then(undefined, onRjt);
  }

  abstract onResponse(res: AxiosResponse<any>): T;
  onSuccess<U, V>(f: Optional<(x: U)=>V>, v: U): U | V {
    if (f) return f(v);
    else return v;
  }
  onFail<U, V>(f: Optional<(x: U)=>V>, v: U) {
    if (f) return f(v);
    else throw new Error();
  }
}
