var log = {
	normal: function (msg) {
		console.log(msg);
	},
	error: function (msg) {
		console.log(msg);
	}
};

export = {
	msg: {
		nullArgumentException: function (msg) {
			return 'NullArgumentException: ' + msg;
		}
	},
	exitWithMessage: function (message, out) {
		out = log.error;

		out(message);
		throw message;
	},
	exit: function (code) {
		process.exit(code);
	},
	exitCodes: {
		error: -1,
		success: 0
	}
};
