const terminal = require('color-terminal-fixed');

module.exports = class ColoredLog {
	static PREFIX = `[Arma III Keys Extractor]`;

	static info(message) {
		terminal.colorize(`%C${ColoredLog.PREFIX} %w${message}%n%N`);
	}

	static error(message) {
		terminal.colorize(`%C${ColoredLog.PREFIX} %R${message}%n%N`);
	}

	static warning(message) {
		terminal.colorize(`%C${ColoredLog.PREFIX} %Y${message}%n%N`);
	}

	static custom(message) {
		terminal.colorize(`${message}%n%N`);
	}

	static separator() {
		terminal.colorize(`%w=============================================================%n%N`);
	}
}