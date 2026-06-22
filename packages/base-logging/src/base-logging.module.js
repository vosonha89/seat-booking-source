"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseLoggingModule = void 0;
const common_1 = require("@nestjs/common");
const base_logging_service_1 = require("./base-logging.service");
const tokens_1 = require("./tokens");
let BaseLoggingModule = class BaseLoggingModule {
};
exports.BaseLoggingModule = BaseLoggingModule;
exports.BaseLoggingModule = BaseLoggingModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: tokens_1.IBaseLoggingConfigSymbol,
                useValue: {
                    dsn: process.env.SENTRY_DSN,
                    environment: process.env.NODE_ENV,
                    release: process.env.SENTRY_RELEASE,
                    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : undefined,
                    profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) : undefined,
                    debug: process.env.SENTRY_DEBUG === 'true',
                    enablePerformanceMonitoring: process.env.SENTRY_ENABLE_PERFORMANCE_MONITORING === 'true',
                    enableTracing: process.env.SENTRY_ENABLE_TRACING === 'true',
                },
            },
            {
                provide: tokens_1.IBaseLoggingServiceSymbol,
                useClass: base_logging_service_1.BaseLoggingService,
            },
            base_logging_service_1.BaseLoggingService,
        ],
        exports: [tokens_1.IBaseLoggingServiceSymbol, base_logging_service_1.BaseLoggingService],
    })
], BaseLoggingModule);
//# sourceMappingURL=base-logging.module.js.map