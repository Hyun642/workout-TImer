type LogLevel = "log" | "warn" | "error";

const logger = {
     log: (message: string, ...args: any[]) => {
          if (__DEV__) {
               console.log(`[LOG] ${message}`, ...args);
          }
          // 프로덕션에서 추가 로깅 필요 시 (예: Sentry)
          // else { Sentry.captureMessage(message); }
     },
     warn: (message: string, ...args: any[]) => {
          if (__DEV__) {
               console.warn(`[WARN] ${message}`, ...args);
          }
     },
     error: (message: string, error?: any, ...args: any[]) => {
          if (__DEV__) {
               console.error(`[ERROR] ${message}`, error, ...args);
          }
          // 프로덕션에서 에러를 외부 서비스로 전송
          // else { Sentry.captureException(error || new Error(message)); }
     },
};

export default logger;
