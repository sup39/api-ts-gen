import * as Qs0 from 'qs';

const options0 = {
  filter(prefix: string, value: any) {
    const con = value?.constructor;
    // use Class.toString() if defined explicitly (exception: Object, Date)
    return (con && con !== Object && con !== Date &&
      con.prototype?.hasOwnProperty('toString')) ? value.toString() : value;
  },
};

export function qStringify(obj: any, options?: Qs0.IStringifyOptions) {
  return Qs0.stringify(obj, Object.assign({}, options0, options));
}
