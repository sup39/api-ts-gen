export declare type Config = ConfigRequired & ConfigOptional;
export declare type ConfigUser = ConfigRequired & Partial<ConfigOptional>;
export interface ConfigRequired {
}
export interface ConfigOptional {
    interfacePrefix: string;
    indentString: string;
    responsePrefix: string;
    schemasName: string;
    IHandlerName: string;
    IServerAPIName: string;
    IClientAPIName: string;
    ClientAPIName: string;
    routerName: string;
    apiDirTSPath: string;
    ServerAPITSPath: string;
    utilsTSPath: string;
    stateTSPath: string | null;
    outputDir: string;
    validateStatus: (status: string) => boolean;
}
export declare const configDefault: ConfigOptional;
