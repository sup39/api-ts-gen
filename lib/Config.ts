export type Config = ConfigRequired & ConfigOptional;
export type ConfigUser = ConfigRequired & Partial<ConfigOptional>;
export interface ConfigRequired {
}
export interface ConfigOptional {
  // format
  interfacePrefix: string;
  indentString: string;
  responsePrefix: string;
  // name
  schemasName: string;
  IHandlerName: string;
  IServerAPIName: string;
  IClientAPIName: string;
  ClientAPIName: string;
  routerName: string;
  // TS path
  apiDirTSPath: string;
  ServerAPITSPath: string;
  utilsTSPath: string;
  stateTSPath: string | null;
  // other
  outputDir: string;
  validateStatus: (status: string) => boolean;
}
export const configDefault: ConfigOptional = {
  // format
  interfacePrefix: 'I',
  indentString: '  ',
  responsePrefix: '',
  // name
  schemasName: 'schemas',
  IHandlerName: 'IHandler',
  IServerAPIName: 'IServerAPI',
  IClientAPIName: 'IClientAPI',
  ClientAPIName: 'ClientAPI',
  routerName: 'apiRouter',
  // TS path
  apiDirTSPath: '#api',
  ServerAPITSPath: '#ServerAPI',
  utilsTSPath: 'api-codegen-ts/utils',
  stateTSPath: null,
  // other
  outputDir: 'api/generated',
  validateStatus: (status: string) => /^2..$/.test(status),
};
