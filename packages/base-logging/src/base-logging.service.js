"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseLoggingService = void 0;
const common_1 = require("@nestjs/common");
const Sentry = require("@sentry/node");
const tokens_1 = require("./tokens");
let BaseLoggingService = class BaseLoggingService {
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        Sentry.init({
            dsn: this.config.dsn,
            environment: this.config.environment,
            release: this.config.release,
            tracesSampleRate: this.config.tracesSampleRate ?? 0.1,
            profilesSampleRate: this.config.profilesSampleRate ?? 0.1,
            debug: this.config.debug ?? false,
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.Console(),
            ],
        });
        if (this.config.enablePerformanceMonitoring) {
            Sentry.captureMessage('Application startup', 'info');
        }
    }
    async onModuleDestroy() {
        await this.flush(2000);
    }
    captureException(error, context) {
        Sentry.withScope((scope) => {
            if (context) {
                scope.setContext('additional', context);
            }
            Sentry.captureException(error);
        });
    }
    captureMessage(message, level = 'info', context) {
        Sentry.withScope((scope) => {
            scope.setLevel(level);
            if (context) {
                scope.setContext('additional', context);
            }
            Sentry.captureMessage(message, level);
        });
    }
    setUser(userId, email, username) {
        Sentry.setUser({
            id: userId,
            email,
            username,
        });
    }
    clearUser() {
        Sentry.setUser(null);
    }
    addBreadcrumb(message, category, level = 'info') {
        Sentry.addBreadcrumb({
            message,
            category,
            level,
        });
    }
    startTransaction(name) {
        if (!this.config.enableTracing) {
            return;
        }
        Sentry.captureMessage(`Transaction started: ${name}`, 'info');
    }
    async flush(timeout) {
        return Sentry.flush(timeout);
    }
};
exports.BaseLoggingService = BaseLoggingService;
exports.BaseLoggingService = BaseLoggingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tokens_1.IBaseLoggingConfigSymbol)),
    __metadata("design:paramtypes", [Object])
], BaseLoggingService);
//# sourceMappingURL=base-logging.service.js.map