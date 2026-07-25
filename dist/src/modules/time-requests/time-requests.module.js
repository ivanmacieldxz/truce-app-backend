"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const time_requests_controller_1 = require("./time-requests.controller");
const time_requests_service_1 = require("./time-requests.service");
let TimeRequestsModule = class TimeRequestsModule {
};
exports.TimeRequestsModule = TimeRequestsModule;
exports.TimeRequestsModule = TimeRequestsModule = __decorate([
    (0, common_1.Module)({
        controllers: [time_requests_controller_1.TimeRequestsController],
        providers: [time_requests_service_1.TimeRequestsService]
    })
], TimeRequestsModule);
//# sourceMappingURL=time-requests.module.js.map