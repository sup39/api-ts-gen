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
var BadResponseError = /** @class */ (function (_super) {
    __extends(BadResponseError, _super);
    function BadResponseError(err, res) {
        var _this = _super.call(this, err.toString()) || this;
        _this.err = err;
        _this.res = res;
        Object.setPrototypeOf(_this, BadResponseError.prototype);
        return _this;
    }
    return BadResponseError;
}(Error));
var APIPromise = /** @class */ (function () {
    function APIPromise(req) {
        var _this = this;
        this.promise = new Promise(function (rsv, rjt) {
            req.then(function (res) {
                try {
                    rsv(_this.onResponse(res));
                }
                catch (err) {
                    rjt(new BadResponseError(err, res));
                }
            }).catch(function (err) { return rjt(err); });
        });
    }
    APIPromise.prototype.then = function (onRsv, onRjt) {
        return this.promise.then(onRsv, onRjt);
    };
    APIPromise.prototype.catch = function (onRjt) {
        return this.then(undefined, onRjt);
    };
    APIPromise.prototype.onSuccess = function (f, v) {
        if (f)
            return f(v);
        else
            return v;
    };
    APIPromise.prototype.onFail = function (f, v) {
        if (f)
            return f(v);
        else
            throw new Error();
    };
    return APIPromise;
}());
exports.APIPromise = APIPromise;
