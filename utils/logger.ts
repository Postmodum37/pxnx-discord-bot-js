interface LogContext {
	[key: string]: unknown;
}

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

class Logger {
	private level: LogLevel;

	constructor(level: LogLevel = LogLevel.INFO) {
		this.level = level;
	}

	private formatMessage(
		level: string,
		message: string,
		context?: LogContext,
		error?: Error,
	): string {
		const timestamp = new Date().toISOString();
		const baseMessage = `[${timestamp}] ${level}: ${message}`;

		if (context || error) {
			const additionalInfo = {
				...(context && { context }),
				...(error && { error: { message: error.message, stack: error.stack } }),
			};
			return `${baseMessage} ${JSON.stringify(additionalInfo, null, 2)}`;
		}

		return baseMessage;
	}

	private log(
		level: LogLevel,
		levelName: string,
		message: string,
		context?: LogContext,
		error?: Error,
	): void {
		if (level >= this.level) {
			const formattedMessage = this.formatMessage(levelName, message, context, error);
			if (level >= LogLevel.ERROR) {
				console.error(formattedMessage);
			} else if (level >= LogLevel.WARN) {
				console.warn(formattedMessage);
			} else {
				console.log(formattedMessage);
			}
		}
	}

	debug(message: string, context?: LogContext): void {
		this.log(LogLevel.DEBUG, "DEBUG", message, context);
	}

	info(message: string, context?: LogContext): void {
		this.log(LogLevel.INFO, "INFO", message, context);
	}

	warn(message: string, context?: LogContext): void {
		this.log(LogLevel.WARN, "WARN", message, context);
	}

	error(message: string, error?: Error, context?: LogContext): void {
		this.log(LogLevel.ERROR, "ERROR", message, context, error);
	}

	setLevel(level: LogLevel): void {
		this.level = level;
	}
}

// Create singleton logger instance
export const logger = new Logger(
	process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
);
