"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIPromise = exports.BadResponseError = void 0;
function typeGuard(checker) {
    return function (x) {
        return checker(x);
    };
}
var BadResponseError = /** @class */ (function (_super) {
    __extends(BadResponseError, _super);
    function BadResponseError(res, label) {
        var _this = _super.call(this, "".concat(label, " status code: ").concat(res.status, "\ndata: ").concat(typeof res.data === 'object' ? JSON.stringify(res.data) : res.data)) || this;
        _this.res = res;
        Object.setPrototypeOf(_this, BadResponseError.prototype);
        return _this;
    }
    return BadResponseError;
}(Error));
exports.BadResponseError = BadResponseError;
var APIPromise = /** @class */ (function () {
    function APIPromise(resPromise, stps, handlers) {
        var _this = this;
        this.handlers = handlers;
        this.promise = resPromise.then(function (res) {
            var status = res.status, data = res.data;
            if (!typeGuard(function (x) { return stps.hasOwnProperty(x); })(status)) {
                // unexpected status
                throw new BadResponseError(res, 'Unexpected');
            }
            var r = stps[status](data);
            if (!typeGuard(function (x) { return _this.handlers.hasOwnProperty(x); })(status)) {
                // unhandled status
                throw new BadResponseError(res, 'Unhandled');
            }
            var handler = _this.handlers[status];
            return handler(r);
        });
    }
    APIPromise.init = function (res, stps, kRsvs) {
        var handlers = {};
        for (var _i = 0, kRsvs_1 = kRsvs; _i < kRsvs_1.length; _i++) {
            var kRsv = kRsvs_1[_i];
            handlers[kRsv] = function (x) { return x; };
        }
        return new APIPromise(res, stps, handlers);
    };
    APIPromise.prototype.on = function (status, handler) {
        var self = this;
        self.handlers[status] = handler;
        return self;
    };
    APIPromise.prototype.then = function (onRsv, onRjt) {
        return this.promise.then(onRsv, onRjt);
    };
    APIPromise.prototype.catch = function (onRjt) {
        return this.then(undefined, onRjt);
    };
    return APIPromise;
}());
exports.APIPromise = APIPromise;
