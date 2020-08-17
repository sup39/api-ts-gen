import * as Qs0 from 'qs';

const options0 = {
  filter(prefix: string, value: any) {
    const con = value?.constructor;
    if (con === null || con === Array || con === Object) return value;
    if (con === Date) return value.toJSON();
    // use Class.toString() if defined explicitly
    return con.prototype?.hasOwnProperty('toString') ? value.toString() : value;
  },
};

export function qStringify(obj: any, options?: Qs0.IStringifyOptions) {
  return Qs0.stringify(obj, Object.assign({}, options0, options));
}
