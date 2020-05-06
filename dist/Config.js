"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configDefault = {
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
    utilsTSPath: '@sup39/api-ts-gen/utils',
    // other
    outputDir: 'api/generated',
    validateStatus: function (status) { return /^2..$/.test(status); },
};
