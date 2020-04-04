"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configDefault = {
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
    validateStatus: function (status) { return /^2..$/.test(status); },
};
