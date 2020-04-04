"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var FullDate_1 = require("./FullDate");
var StrictTypeParser;
(function (StrictTypeParser) {
    var BadValueError = /** @class */ (function (_super) {
        __extends(BadValueError, _super);
        function BadValueError(attr, type, value) {
            var _this = _super.call(this, attr + ": Can not convert `" + (['object', 'array'].includes(typeof value) ?
                JSON.stringify(value) : "" + value) + "` to type " + type) || this;
            _this.attr = attr;
            _this.type = type;
            _this.value = value;
            console.error(_this.message);
            Object.setPrototypeOf(_this, BadValueError.prototype);
            return _this;
        }
        return BadValueError;
    }(Error));
    StrictTypeParser.BadValueError = BadValueError;
    function _number(x, attr) {
        if (typeof x === 'number')
            return x;
        if (typeof x === 'string') {
            var r = +x;
            if (!isNaN(r))
                return r;
        }
        throw new BadValueError(attr, 'number', x);
    }
    StrictTypeParser._number = _number;
    function _string(x, attr) {
        if (typeof x === 'string')
            return x;
        if (typeof x === 'object')
            return x.toString();
        throw new BadValueError(attr, 'string', x);
    }
    StrictTypeParser._string = _string;
    function _boolean(x, attr) {
        if (typeof x === 'boolean')
            return x;
        if (x === 'true')
            return true;
        if (x === 'false')
            return false;
        throw new BadValueError(attr, 'boolean', x);
    }
    StrictTypeParser._boolean = _boolean;
    function _Date(x, attr) {
        var r = new Date(x);
        if (!isNaN(+r))
            return r;
        throw new BadValueError(attr, 'Date', x);
    }
    StrictTypeParser._Date = _Date;
    function _FullDate(x, attr) {
        var r = new FullDate_1.FullDate(x);
        if (!isNaN(+r))
            return r;
        throw new BadValueError(attr, 'FullDate', x);
    }
    StrictTypeParser._FullDate = _FullDate;
    function _byte(x, attr) {
        if (typeof x === 'string')
            return x;
        if (x instanceof Buffer)
            return x.toString('base64');
        throw new BadValueError(attr, 'byte', x);
    }
    StrictTypeParser._byte = _byte;
    function _binary(x, attr) {
        if (typeof x === 'string')
            return x;
        if (x instanceof Buffer)
            return x.toString('hex');
        if ((x === null || x === void 0 ? void 0 : x.buffer) instanceof Buffer)
            return x.toString('hex');
        throw new BadValueError(attr, 'binary', x);
    }
    StrictTypeParser._binary = _binary;
    function _Array(x, attr) {
        if (x instanceof Array)
            return x;
        throw new BadValueError(attr, 'Array', x);
    }
    StrictTypeParser._Array = _Array;
    StrictTypeParser.supportTypes = [
        'number', 'string', 'boolean', 'Date', 'FullDate', 'byte', 'binary'
    ];
})(StrictTypeParser = exports.StrictTypeParser || (exports.StrictTypeParser = {}));
