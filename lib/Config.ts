export type Config = ConfigRequired & ConfigOptional;
export type ConfigUser = ConfigRequired & Partial<ConfigOptional>;
export interface ConfigRequired {
}
export interface ConfigOptional {
  // format
  interfacePrefix: string;
  indentString: string;
  // name
  schemasName: string;
  IHandlerName: string;
  ClientAPIName: string;
  routerName: string;
  // TS path
  ServerAPITSPath: string;
  utilsTSPath: string;
  // other
  outputDir: string;
  validateStatus: (status: string) => boolean;
  clientOnly: boolean;
}
export const configDefault: ConfigOptional = {
  // format
  interfacePrefix: 'I',
  indentString: '  ',
  // name
  schemasName: 'schemas',
  IHandlerName: 'IHandler',
  ClientAPIName: 'ClientAPI',
  routerName: 'apiRouter',
  // TS path
  ServerAPITSPath: '#ServerAPI',
  utilsTSPath: '@sup39/api-ts-gen/dist/utils',
  // other
  outputDir: 'api/generated',
  validateStatus: (status: string) => /^2..$/.test(status),
  clientOnly: false,
};
