import util from "util";
import winston, { format } from "winston";

const normalFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const formatArgs = (args: any[]): string =>
  args.map((arg) => util.format(arg)).join(" ");

export const winstonLogger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  let logFormat: winston.Logform.Format = format.combine(
    format.colorize(),
    format.timestamp(),
    normalFormat
  );
  winstonLogger.add(
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

export const logger = {
  debug: (...args: any[]) => winstonLogger.debug(formatArgs(args)),
  info: (...args: any[]) => winstonLogger.info(formatArgs(args)),
  warn: (...args: any[]) => winstonLogger.warn(formatArgs(args)),
  error: (...args: any[]) => winstonLogger.error(formatArgs(args)),
};
