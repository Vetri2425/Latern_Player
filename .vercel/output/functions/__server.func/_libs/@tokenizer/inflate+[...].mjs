import { i as __toESM, n as __exportAll, r as __require, t as __commonJSMin } from "../../_runtime.mjs";
import { n as textEncode, t as textDecode } from "../borewit__text-codec.mjs";
//#region node_modules/ms/index.js
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
}));
//#endregion
//#region node_modules/debug/src/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*/
	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = require_ms();
		createDebug.destroy = destroy;
		Object.keys(env).forEach((key) => {
			createDebug[key] = env[key];
		});
		/**
		* The currently active debug mode names, and names to skip.
		*/
		createDebug.names = [];
		createDebug.skips = [];
		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};
		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;
			for (let i = 0; i < namespace.length; i++) {
				hash = (hash << 5) - hash + namespace.charCodeAt(i);
				hash |= 0;
			}
			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;
		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;
			function debug(...args) {
				if (!debug.enabled) return;
				const self = debug;
				const curr = Number(/* @__PURE__ */ new Date());
				self.diff = curr - (prevTime || curr);
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;
				args[0] = createDebug.coerce(args[0]);
				if (typeof args[0] !== "string") args.unshift("%O");
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					if (match === "%%") return "%";
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === "function") {
						const val = args[index];
						match = formatter.call(self, val);
						args.splice(index, 1);
						index--;
					}
					return match;
				});
				createDebug.formatArgs.call(self, args);
				(self.log || createDebug.log).apply(self, args);
			}
			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy;
			Object.defineProperty(debug, "enabled", {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) return enableOverride;
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}
					return enabledCache;
				},
				set: (v) => {
					enableOverride = v;
				}
			});
			if (typeof createDebug.init === "function") createDebug.init(debug);
			return debug;
		}
		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}
		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;
			createDebug.names = [];
			createDebug.skips = [];
			const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
			else createDebug.names.push(ns);
		}
		/**
		* Checks if the given string matches a namespace template, honoring
		* asterisks as wildcards.
		*
		* @param {String} search
		* @param {String} template
		* @return {Boolean}
		*/
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;
			while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
				if (template[templateIndex] === "*") {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++;
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) {
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else return false;
			while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
			return templateIndex === template.length;
		}
		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
			createDebug.enable("");
			return namespaces;
		}
		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
			for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
			return false;
		}
		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) return val.stack || val.message;
			return val;
		}
		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		createDebug.enable(createDebug.load());
		return createDebug;
	}
	module.exports = setup;
}));
//#endregion
//#region node_modules/debug/src/browser.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*/
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;
		return () => {
			if (!warned) {
				warned = true;
				console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
			}
		};
	})();
	/**
	* Colors.
	*/
	exports.colors = [
		"#0000CC",
		"#0000FF",
		"#0033CC",
		"#0033FF",
		"#0066CC",
		"#0066FF",
		"#0099CC",
		"#0099FF",
		"#00CC00",
		"#00CC33",
		"#00CC66",
		"#00CC99",
		"#00CCCC",
		"#00CCFF",
		"#3300CC",
		"#3300FF",
		"#3333CC",
		"#3333FF",
		"#3366CC",
		"#3366FF",
		"#3399CC",
		"#3399FF",
		"#33CC00",
		"#33CC33",
		"#33CC66",
		"#33CC99",
		"#33CCCC",
		"#33CCFF",
		"#6600CC",
		"#6600FF",
		"#6633CC",
		"#6633FF",
		"#66CC00",
		"#66CC33",
		"#9900CC",
		"#9900FF",
		"#9933CC",
		"#9933FF",
		"#99CC00",
		"#99CC33",
		"#CC0000",
		"#CC0033",
		"#CC0066",
		"#CC0099",
		"#CC00CC",
		"#CC00FF",
		"#CC3300",
		"#CC3333",
		"#CC3366",
		"#CC3399",
		"#CC33CC",
		"#CC33FF",
		"#CC6600",
		"#CC6633",
		"#CC9900",
		"#CC9933",
		"#CCCC00",
		"#CCCC33",
		"#FF0000",
		"#FF0033",
		"#FF0066",
		"#FF0099",
		"#FF00CC",
		"#FF00FF",
		"#FF3300",
		"#FF3333",
		"#FF3366",
		"#FF3399",
		"#FF33CC",
		"#FF33FF",
		"#FF6600",
		"#FF6633",
		"#FF9900",
		"#FF9933",
		"#FFCC00",
		"#FFCC33"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return true;
		if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
		let m;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
		if (!this.useColors) return;
		const c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, (match) => {
			if (match === "%%") return;
			index++;
			if (match === "%c") lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.debug()` when available.
	* No-op when `console.debug` is not a "function".
	* If `console.debug` is not available, falls back
	* to `console.log`.
	*
	* @api public
	*/
	exports.log = console.debug || console.log || (() => {});
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (namespaces) exports.storage.setItem("debug", namespaces);
			else exports.storage.removeItem("debug");
		} catch (error) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		let r;
		try {
			r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
		} catch (error) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return localStorage;
		} catch (error) {}
	}
	module.exports = require_common()(exports);
	var { formatters } = module.exports;
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return "[UnexpectedJSONParseError]: " + error.message;
		}
	};
}));
//#endregion
//#region node_modules/has-flag/index.js
var require_has_flag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = (flag, argv = process.argv) => {
		const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf("--");
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
}));
//#endregion
//#region node_modules/supports-color/index.js
var require_supports_color = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var os = __require("os");
	var tty$1 = __require("tty");
	var hasFlag = require_has_flag();
	var { env } = process;
	var forceColor;
	if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) forceColor = 0;
	else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) forceColor = 1;
	if ("FORCE_COLOR" in env) {
		if (env.FORCE_COLOR === "true") forceColor = 1;
		else if (env.FORCE_COLOR === "false") forceColor = 0;
		else forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
	function translateLevel(level) {
		if (level === 0) return false;
		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}
	function supportsColor(haveStream, streamIsTTY) {
		if (forceColor === 0) return 0;
		if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) return 3;
		if (hasFlag("color=256")) return 2;
		if (haveStream && !streamIsTTY && forceColor === void 0) return 0;
		const min = forceColor || 0;
		if (env.TERM === "dumb") return min;
		if (process.platform === "win32") {
			const osRelease = os.release().split(".");
			if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
			return 1;
		}
		if ("CI" in env) {
			if ([
				"TRAVIS",
				"CIRCLECI",
				"APPVEYOR",
				"GITLAB_CI",
				"GITHUB_ACTIONS",
				"BUILDKITE"
			].some((sign) => sign in env) || env.CI_NAME === "codeship") return 1;
			return min;
		}
		if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		if (env.COLORTERM === "truecolor") return 3;
		if ("TERM_PROGRAM" in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
			switch (env.TERM_PROGRAM) {
				case "iTerm.app": return version >= 3 ? 3 : 2;
				case "Apple_Terminal": return 2;
			}
		}
		if (/-256(color)?$/i.test(env.TERM)) return 2;
		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
		if ("COLORTERM" in env) return 1;
		return min;
	}
	function getSupportLevel(stream) {
		return translateLevel(supportsColor(stream, stream && stream.isTTY));
	}
	module.exports = {
		supportsColor: getSupportLevel,
		stdout: translateLevel(supportsColor(true, tty$1.isatty(1))),
		stderr: translateLevel(supportsColor(true, tty$1.isatty(2)))
	};
}));
//#endregion
//#region node_modules/debug/src/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	var tty = __require("tty");
	var util = __require("util");
	/**
	* This is the Node.js implementation of `debug()`.
	*/
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
	/**
	* Colors.
	*/
	exports.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		const supportsColor = require_supports_color();
		if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	} catch (error) {}
	/**
	* Build up the default `inspectOpts` object from the environment variables.
	*
	*   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	*/
	exports.inspectOpts = Object.keys(process.env).filter((key) => {
		return /^debug_/i.test(key);
	}).reduce((obj, key) => {
		const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});
		let val = process.env[key];
		if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
		else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
		else if (val === "null") val = null;
		else val = Number(val);
		obj[prop] = val;
		return obj;
	}, {});
	/**
	* Is stdout a TTY? Colored output is enabled when `true`.
	*/
	function useColors() {
		return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
	}
	/**
	* Adds ANSI color escape codes if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		const { namespace: name, useColors } = this;
		if (useColors) {
			const c = this.color;
			const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
			const prefix = `  ${colorCode};1m${name} \u001B[0m`;
			args[0] = prefix + args[0].split("\n").join("\n" + prefix);
			args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
		} else args[0] = getDate() + name + " " + args[0];
	}
	function getDate() {
		if (exports.inspectOpts.hideDate) return "";
		return (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	/**
	* Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
	*/
	function log(...args) {
		return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
	}
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		if (namespaces) process.env.DEBUG = namespaces;
		else delete process.env.DEBUG;
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		return process.env.DEBUG;
	}
	/**
	* Init logic for `debug` instances.
	*
	* Create a new `inspectOpts` object in case `useColors` is set
	* differently for a particular `debug` instance.
	*/
	function init(debug) {
		debug.inspectOpts = {};
		const keys = Object.keys(exports.inspectOpts);
		for (let i = 0; i < keys.length; i++) debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
	module.exports = require_common()(exports);
	var { formatters } = module.exports;
	/**
	* Map %o to `util.inspect()`, all on a single line.
	*/
	formatters.o = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
	};
	/**
	* Map %O to `util.inspect()`, allowing multiple lines if needed.
	*/
	formatters.O = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts);
	};
}));
//#endregion
//#region node_modules/debug/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Detect Electron renderer / nwjs process, which is node, but we should
	* treat as a browser.
	*/
	if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) module.exports = require_browser();
	else module.exports = require_node();
}));
//#endregion
//#region node_modules/strtok3/lib/stream/Errors.js
var defaultMessages = "End-Of-Stream";
/**
* Thrown on read operation of the end of file or stream has been reached
*/
var EndOfStreamError = class extends Error {
	constructor() {
		super(defaultMessages);
		this.name = "EndOfStreamError";
	}
};
var AbortError = class extends Error {
	constructor(message = "The operation was aborted") {
		super(message);
		this.name = "AbortError";
	}
};
//#endregion
//#region node_modules/strtok3/lib/AbortSignal.js
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
/** Reject an already-cancelled operation before acquiring tokenizer resources. */
function throwIfAborted(signal) {
	if (signal?.aborted) throw new AbortError();
}
//#endregion
//#region node_modules/strtok3/lib/BufferSizeError.js
/** Thrown before a tokenizer or writer buffer exceeds its configured limit. */
var BufferSizeError = class extends RangeError {
	/**
	* Create an error describing an allocation that exceeds the configured limit.
	* @param requestedSize - Requested buffer size in bytes
	* @param maxBufferSize - Configured maximum buffer size in bytes
	*/
	constructor(requestedSize, maxBufferSize) {
		super(`Requested buffer size ${requestedSize} exceeds maxBufferSize ${maxBufferSize}`);
		this.requestedSize = requestedSize;
		this.maxBufferSize = maxBufferSize;
		this.name = "BufferSizeError";
	}
};
/**
* Validate options before acquiring file handles or stream readers.
* @param options - Tokenizer options containing the optional allocation limit
* @returns Configured buffer limit in bytes, or Infinity when the limit is disabled
* @throws RangeError if maxBufferSize is neither a positive safe integer nor Infinity
*/
function getMaxBufferSize(options) {
	const limit = options?.maxBufferSize ?? Number.POSITIVE_INFINITY;
	if (limit !== Number.POSITIVE_INFINITY && (!Number.isSafeInteger(limit) || limit <= 0)) throw new RangeError("maxBufferSize must be a positive safe integer or Infinity");
	return limit;
}
//#endregion
//#region node_modules/strtok3/lib/stream/AbstractStreamReader.js
var AbstractStreamReader = class {
	constructor(options) {
		this.endOfStream = false;
		this.interrupted = false;
		/**
		* Store peeked data
		* @type {Array}
		*/
		this.peekQueue = [];
		this.onCloseCallback = options?.onClose;
	}
	async peek(uint8Array, mayBeLess = false) {
		const bytesRead = await this.read(uint8Array, mayBeLess);
		this.peekQueue.push(uint8Array.subarray(0, bytesRead));
		return bytesRead;
	}
	async read(buffer, mayBeLess = false) {
		if (buffer.length === 0) return 0;
		let bytesRead = this.readFromPeekBuffer(buffer);
		if (!this.endOfStream) bytesRead += await this.readRemainderFromStream(buffer.subarray(bytesRead), mayBeLess);
		if (bytesRead === 0 && !mayBeLess) throw new EndOfStreamError();
		return bytesRead;
	}
	/**
	* Read chunk from stream
	* @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
	* @returns Number of bytes read
	*/
	readFromPeekBuffer(buffer) {
		let remaining = buffer.length;
		let bytesRead = 0;
		while (this.peekQueue.length > 0 && remaining > 0) {
			const peekData = this.peekQueue.pop();
			if (!peekData) throw new Error("peekData should be defined");
			const lenCopy = Math.min(peekData.length, remaining);
			buffer.set(peekData.subarray(0, lenCopy), bytesRead);
			bytesRead += lenCopy;
			remaining -= lenCopy;
			if (lenCopy < peekData.length) this.peekQueue.push(peekData.subarray(lenCopy));
		}
		return bytesRead;
	}
	async readRemainderFromStream(buffer, mayBeLess) {
		let bytesRead = 0;
		while (bytesRead < buffer.length && !this.endOfStream) {
			if (this.interrupted) throw new AbortError();
			const chunkLen = await this.readFromStream(buffer.subarray(bytesRead), mayBeLess);
			if (chunkLen === 0) break;
			bytesRead += chunkLen;
		}
		if (!mayBeLess && bytesRead < buffer.length) throw new EndOfStreamError();
		return bytesRead;
	}
	/** Share resource cleanup, callback completion and failures across close calls. */
	close() {
		this.closePromise ?? (this.closePromise = Promise.resolve().then(async () => {
			await this.closeResource();
			await this.onCloseCallback?.();
		}));
		return this.closePromise;
	}
	/** Backend cleanup completes before the optional close callback. */
	closeResource() {
		return this.abort();
	}
};
//#endregion
//#region node_modules/strtok3/lib/stream/WebStreamReader.js
var WebStreamReader = class extends AbstractStreamReader {
	constructor(reader, options) {
		super(options);
		this.reader = reader;
		this.released = false;
	}
	async abort() {
		if (!this.released) {
			this.reader.releaseLock();
			this.released = true;
		}
	}
};
//#endregion
//#region node_modules/strtok3/lib/stream/WebStreamByobReader.js
/**
* Read from a WebStream using a BYOB reader
* Reference: https://nodejs.org/api/webstreams.html#class-readablestreambyobreader
*/
var WebStreamByobReader = class extends WebStreamReader {
	/**
	* Read from stream
	* @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
	* @param mayBeLess - If true, may fill the buffer partially
	* @protected Bytes read
	*/
	async readFromStream(buffer, mayBeLess) {
		if (buffer.length === 0) return 0;
		const result = await this.reader.read(new Uint8Array(buffer.length), { min: mayBeLess ? void 0 : buffer.length });
		if (result.done) this.endOfStream = result.done;
		if (result.value) {
			buffer.set(result.value);
			return result.value.length;
		}
		return 0;
	}
};
//#endregion
//#region node_modules/strtok3/lib/stream/WebStreamDefaultReader.js
var WebStreamDefaultReader = class extends AbstractStreamReader {
	constructor(reader, options) {
		super(options);
		this.reader = reader;
		this.buffer = null;
	}
	/**
	* Copy chunk to target, and store the remainder in this.buffer
	*/
	writeChunk(target, chunk) {
		const written = Math.min(chunk.length, target.length);
		target.set(chunk.subarray(0, written));
		if (written < chunk.length) this.buffer = chunk.subarray(written);
		else this.buffer = null;
		return written;
	}
	/**
	* Read from stream
	* @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
	* @param mayBeLess - If true, may fill the buffer partially
	* @protected Bytes read
	*/
	async readFromStream(buffer, mayBeLess) {
		if (buffer.length === 0) return 0;
		let totalBytesRead = 0;
		if (this.buffer) totalBytesRead += this.writeChunk(buffer, this.buffer);
		while (totalBytesRead < buffer.length && !this.endOfStream) {
			const result = await this.reader.read();
			if (result.done) {
				this.endOfStream = true;
				break;
			}
			if (result.value) totalBytesRead += this.writeChunk(buffer.subarray(totalBytesRead), result.value);
		}
		if (!mayBeLess && totalBytesRead === 0 && this.endOfStream) throw new EndOfStreamError();
		return totalBytesRead;
	}
	abort() {
		this.interrupted = true;
		return this.reader.cancel();
	}
	async closeResource() {
		try {
			await this.abort();
		} finally {
			this.reader.releaseLock();
		}
	}
};
//#endregion
//#region node_modules/strtok3/lib/stream/WebStreamReaderFactory.js
function makeWebStreamReader(stream, options) {
	try {
		const reader = stream.getReader({ mode: "byob" });
		if (reader instanceof ReadableStreamDefaultReader) return new WebStreamDefaultReader(reader, options);
		return new WebStreamByobReader(reader, options);
	} catch (error) {
		if (error instanceof TypeError) return new WebStreamDefaultReader(stream.getReader(), options);
		throw error;
	}
}
//#endregion
//#region node_modules/strtok3/lib/AbstractTokenizer.js
/**
* Core tokenizer
*/
var AbstractTokenizer = class {
	/**
	* Constructor
	* @param options Tokenizer options
	* @protected
	*/
	constructor(options) {
		this.numBuffer = /* @__PURE__ */ new Uint8Array(10);
		/**
		* Tokenizer-stream position
		*/
		this.position = 0;
		this.maxBufferSize = getMaxBufferSize(options);
		throwIfAborted(options?.abortSignal);
		this.onClose = options?.onClose;
		if (options?.abortSignal) this.addAbortListener(options.abortSignal, () => {
			this.abort().catch(() => {});
		});
	}
	addAbortListener(signal, listener) {
		this.abortSignal = signal;
		this.abortListener = listener;
		signal.addEventListener("abort", listener, { once: true });
	}
	removeAbortListener() {
		if (this.abortListener) this.abortSignal?.removeEventListener("abort", this.abortListener);
		this.abortSignal = void 0;
		this.abortListener = void 0;
	}
	/**
	* Read a token from the tokenizer-stream
	* @param token - The token to read
	* @param position - If provided, the desired position in the tokenizer-stream
	* @returns Promise with token data
	*/
	async readToken(token, position = this.position) {
		this.validateTokenRead(token.len, position);
		const uint8Array = new Uint8Array(token.len);
		if (await this.readBuffer(uint8Array, { position }) < token.len) throw new EndOfStreamError();
		return token.get(uint8Array, 0);
	}
	/**
	* Peek a token from the tokenizer-stream.
	* @param token - Token to peek from the tokenizer-stream.
	* @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
	* @returns Promise with token data
	*/
	async peekToken(token, position = this.position) {
		const peekPosition = position ?? this.position;
		this.validateTokenRead(token.len, peekPosition, true);
		const uint8Array = new Uint8Array(token.len);
		if (await this.peekBuffer(uint8Array, { position: peekPosition }) < token.len) throw new EndOfStreamError();
		return token.get(uint8Array, 0);
	}
	/**
	* Read a numeric token from the stream
	* @param token - Numeric token
	* @returns Promise with number
	*/
	async readNumber(token) {
		if (await this.readBuffer(this.numBuffer, { length: token.len }) < token.len) throw new EndOfStreamError();
		return token.get(this.numBuffer, 0);
	}
	/**
	* Read a numeric token from the stream
	* @param token - Numeric token
	* @returns Promise with number
	*/
	async peekNumber(token) {
		if (await this.peekBuffer(this.numBuffer, { length: token.len }) < token.len) throw new EndOfStreamError();
		return token.get(this.numBuffer, 0);
	}
	/**
	* Ignore number of bytes, advances the pointer in under tokenizer-stream.
	* @param length - Number of bytes to ignore.  Must be ≥ 0.
	* @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
	*/
	async ignore(length) {
		if (length < 0) throw new RangeError("ignore length must be ≥ 0 bytes");
		this.validateLength(length, "ignore length");
		this.validateLength(this.position + length, "end position");
		if (this.fileInfo.size !== void 0) {
			const bytesLeft = Math.max(0, this.fileInfo.size - this.position);
			if (length > bytesLeft) {
				this.position += bytesLeft;
				return bytesLeft;
			}
		}
		this.position += length;
		return length;
	}
	close() {
		if (!this.closePromise) {
			this.removeAbortListener();
			this.closePromise = Promise.resolve().then(() => this.closeOnce());
		}
		return this.closePromise;
	}
	/** Perform cleanup once, sharing completion and the first error across close calls. */
	async closeOnce() {
		await this.abort();
		await this.onClose?.();
	}
	/**
	* Validate a byte length or position before using it in buffer calculations.
	* @param value - Value that must be a non-negative safe integer
	* @param name - Label used in the validation error
	* @throws RangeError if the value is negative or not a safe integer
	*/
	validateLength(value, name) {
		if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative safe integer`);
	}
	/**
	* Validate a requested buffer size against the configured allocation limit.
	* @param length - Requested buffer size in bytes
	* @throws RangeError if the length is negative or not a safe integer
	* @throws BufferSizeError if the length exceeds maxBufferSize
	*/
	validateBufferSize(length) {
		this.validateLength(length, "buffer length");
		if (length > this.maxBufferSize) throw new BufferSizeError(length, this.maxBufferSize);
	}
	/**
	* Validate a token request before allocating a buffer or consuming input.
	* @param length - Token length in bytes
	* @param position - Byte offset where the token starts
	* @param peek - Whether to include skipped stream bytes in the lookahead limit
	* @throws RangeError if a length or position is negative or not a safe integer
	* @throws BufferSizeError if the token buffer or stream lookahead exceeds maxBufferSize
	* @throws Error if a stream request starts before the current position
	* @throws EndOfStreamError if the token extends beyond the known input size
	*/
	validateTokenRead(length, position, peek = false) {
		this.validateBufferSize(length);
		this.validateLength(position, "position");
		this.validateLength(position + length, "end position");
		if (!this.supportsRandomAccess() && position < this.position) throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
		if (peek && !this.supportsRandomAccess()) this.validateBufferSize(length + position - this.position);
		if (this.fileInfo.size !== void 0 && length > this.fileInfo.size - position) throw new EndOfStreamError();
	}
	/**
	* Apply defaults and validate buffer read or peek options.
	* @param uint8Array - Target buffer whose length is the default read length
	* @param options - Requested length, position and partial-read behavior
	* @returns Validated options with an explicit length, position and mayBeLess flag
	* @throws RangeError if a length or position is invalid, or the length exceeds the target buffer
	* @throws Error if a stream request starts before the current position
	*/
	normalizeOptions(uint8Array, options) {
		const length = options?.length ?? uint8Array.length;
		const position = options?.position ?? this.position;
		this.validateLength(length, "length");
		this.validateLength(position, "position");
		this.validateLength(position + length, "end position");
		if (length > uint8Array.length) throw new RangeError("length must not exceed the target buffer length");
		if (!this.supportsRandomAccess() && position < this.position) throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
		return {
			length,
			position,
			mayBeLess: options?.mayBeLess ?? false
		};
	}
	abort() {
		this.removeAbortListener();
		return Promise.resolve();
	}
};
//#endregion
//#region node_modules/strtok3/lib/BlobTokenizer.js
var BlobTokenizer = class extends AbstractTokenizer {
	/**
	* Construct BufferTokenizer
	* @param blob - Uint8Array to tokenize
	* @param options Tokenizer options
	*/
	constructor(blob, options) {
		super(options);
		this.blob = blob;
		this.fileInfo = {
			...options?.fileInfo ?? {},
			size: blob.size,
			mimeType: blob.type
		};
	}
	/**
	* Read buffer from tokenizer
	* @param uint8Array - Uint8Array to tokenize
	* @param options - Read behaviour options
	* @returns {Promise<number>}
	*/
	async readBuffer(uint8Array, options) {
		const normOptions = this.normalizeOptions(uint8Array, options);
		const bytesRead = await this.peekBuffer(uint8Array, normOptions);
		this.position = normOptions.position + bytesRead;
		return bytesRead;
	}
	/**
	* Peek (read ahead) buffer from tokenizer
	* @param buffer
	* @param options - Read behaviour options
	* @returns {Promise<number>}
	*/
	async peekBuffer(buffer, options) {
		const normOptions = this.normalizeOptions(buffer, options);
		const bytes2read = Math.max(0, Math.min(this.blob.size - normOptions.position, normOptions.length));
		if (!normOptions.mayBeLess && bytes2read < normOptions.length) throw new EndOfStreamError();
		for (let offset = 0; offset < bytes2read;) {
			const chunkLength = Math.min(this.maxBufferSize, bytes2read - offset);
			const position = normOptions.position + offset;
			const arrayBuffer = await this.blob.slice(position, position + chunkLength).arrayBuffer();
			buffer.set(new Uint8Array(arrayBuffer), offset);
			offset += chunkLength;
		}
		return bytes2read;
	}
	close() {
		return super.close();
	}
	supportsRandomAccess() {
		return true;
	}
	setPosition(position) {
		this.validateLength(position, "position");
		this.position = position;
	}
};
//#endregion
//#region node_modules/strtok3/lib/BufferTokenizer.js
var BufferTokenizer = class extends AbstractTokenizer {
	/**
	* Construct BufferTokenizer
	* @param uint8Array - Uint8Array to tokenize
	* @param options Tokenizer options
	*/
	constructor(uint8Array, options) {
		super(options);
		this.uint8Array = uint8Array;
		this.fileInfo = {
			...options?.fileInfo ?? {},
			size: uint8Array.length
		};
	}
	/**
	* Read buffer from tokenizer
	* @param uint8Array - Uint8Array to tokenize
	* @param options - Read behaviour options
	* @returns {Promise<number>}
	*/
	async readBuffer(uint8Array, options) {
		const normOptions = this.normalizeOptions(uint8Array, options);
		const bytesRead = await this.peekBuffer(uint8Array, normOptions);
		this.position = normOptions.position + bytesRead;
		return bytesRead;
	}
	/**
	* Peek (read ahead) buffer from tokenizer
	* @param uint8Array
	* @param options - Read behaviour options
	* @returns {Promise<number>}
	*/
	async peekBuffer(uint8Array, options) {
		const normOptions = this.normalizeOptions(uint8Array, options);
		const bytes2read = Math.max(0, Math.min(this.uint8Array.length - normOptions.position, normOptions.length));
		if (!normOptions.mayBeLess && bytes2read < normOptions.length) throw new EndOfStreamError();
		uint8Array.set(this.uint8Array.subarray(normOptions.position, normOptions.position + bytes2read));
		return bytes2read;
	}
	close() {
		return super.close();
	}
	supportsRandomAccess() {
		return true;
	}
	setPosition(position) {
		this.validateLength(position, "position");
		this.position = position;
	}
};
//#endregion
//#region node_modules/strtok3/lib/ReadStreamTokenizer.js
var ignoreChunkSize = 256e3;
var ReadStreamTokenizer = class extends AbstractTokenizer {
	/**
	* Constructor
	* @param streamReader stream-reader to read from
	* @param options Tokenizer options
	*/
	constructor(streamReader, options) {
		super(options);
		this.streamReader = streamReader;
		this.fileInfo = options?.fileInfo ?? {};
	}
	/**
	* Read buffer from tokenizer
	* @param uint8Array - Target Uint8Array to fill with data read from the tokenizer-stream
	* @param options - Read behaviour options
	* @returns Promise with number of bytes read
	*/
	async readBuffer(uint8Array, options) {
		const normOptions = this.normalizeOptions(uint8Array, options);
		const skipBytes = normOptions.position - this.position;
		if (skipBytes > 0) {
			await this.ignore(skipBytes);
			return this.readBuffer(uint8Array, options);
		}
		if (skipBytes < 0) throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
		if (normOptions.length === 0) return 0;
		let bytesRead = 0;
		while (bytesRead < normOptions.length) {
			const chunkLength = Math.min(this.maxBufferSize, normOptions.length - bytesRead);
			const count = await this.streamReader.read(uint8Array.subarray(bytesRead, bytesRead + chunkLength), true);
			bytesRead += count;
			this.position += count;
			if (count < chunkLength) break;
		}
		if (!normOptions.mayBeLess && bytesRead < normOptions.length) throw new EndOfStreamError();
		return bytesRead;
	}
	/**
	* Peek (read ahead) buffer from tokenizer
	* @param uint8Array - Uint8Array (or Buffer) to write data to
	* @param options - Read behaviour options
	* @returns Promise with number of bytes peeked
	*/
	async peekBuffer(uint8Array, options) {
		const normOptions = this.normalizeOptions(uint8Array, options);
		if (normOptions.length === 0) return 0;
		if (this.fileInfo.size !== void 0 && normOptions.position >= this.fileInfo.size) {
			if (normOptions.mayBeLess) return 0;
			throw new EndOfStreamError();
		}
		const lookaheadSize = normOptions.length + normOptions.position - this.position;
		this.validateBufferSize(lookaheadSize);
		let bytesRead = 0;
		if (normOptions.position) {
			const skipBytes = normOptions.position - this.position;
			if (skipBytes > 0) {
				const skipBuffer = new Uint8Array(normOptions.length + skipBytes);
				bytesRead = await this.peekBuffer(skipBuffer, { mayBeLess: normOptions.mayBeLess });
				const bytesPeeked = Math.max(0, bytesRead - skipBytes);
				uint8Array.set(skipBuffer.subarray(skipBytes, skipBytes + bytesPeeked));
				return bytesPeeked;
			}
			if (skipBytes < 0) throw new Error("Cannot peek from a negative offset in a stream");
		}
		if (normOptions.length > 0) {
			try {
				const peekBuffer = new Uint8Array(normOptions.length);
				bytesRead = await this.streamReader.peek(peekBuffer, true);
				uint8Array.set(peekBuffer.subarray(0, bytesRead));
			} catch (err) {
				if (options?.mayBeLess && err instanceof EndOfStreamError) return 0;
				throw err;
			}
			if (!normOptions.mayBeLess && bytesRead < normOptions.length) throw new EndOfStreamError();
		}
		return bytesRead;
	}
	/**
	* @param length Number of bytes to ignore. Must be ≥ 0.
	*/
	async ignore(length) {
		if (length < 0) throw new RangeError("ignore length must be ≥ 0 bytes");
		this.validateLength(length, "ignore length");
		this.validateLength(this.position + length, "end position");
		if (length > 0 && this.fileInfo.size !== void 0 && length > this.fileInfo.size - this.position) throw new EndOfStreamError();
		const bufSize = Math.min(ignoreChunkSize, this.maxBufferSize, length);
		const buf = new Uint8Array(bufSize);
		let totBytesRead = 0;
		while (totBytesRead < length) {
			const remaining = length - totBytesRead;
			const bytesRead = await this.readBuffer(buf, { length: Math.min(bufSize, remaining) });
			if (bytesRead < 0) return bytesRead;
			totBytesRead += bytesRead;
		}
		return totBytesRead;
	}
	abort() {
		this.removeAbortListener();
		return this.streamReader.abort();
	}
	async close() {
		this.removeAbortListener();
		return this.streamReader.close();
	}
	supportsRandomAccess() {
		return false;
	}
};
//#endregion
//#region node_modules/strtok3/lib/isRandomAccessTokenizer.js
/**
* Check for random-access capability, position control and a known file size.
* A known size alone does not imply random access.
*/
function isRandomAccessTokenizer(tokenizer) {
	return tokenizer.supportsRandomAccess() && "setPosition" in tokenizer && typeof tokenizer.setPosition === "function" && typeof tokenizer.fileInfo.size === "number";
}
//#endregion
//#region node_modules/strtok3/lib/TokenizerBoundaryError.js
/** A request exceeds a tokenizer view, rather than encountering truncated input. */
var TokenizerBoundaryError = class extends RangeError {
	constructor(position, length, size) {
		super(`Range at position ${position} with length ${length} exceeds tokenizer view size ${size}`);
		this.position = position;
		this.length = length;
		this.size = size;
		this.name = "TokenizerBoundaryError";
	}
};
//#endregion
//#region node_modules/strtok3/lib/TokenizerView.js
function validateOffset(value, name) {
	if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative safe integer`);
}
function createTokenizerView(source, length) {
	return isRandomAccessTokenizer(source) ? new RandomAccessTokenizerView(source, length) : new TokenizerView(source, length);
}
var TokenizerView = class TokenizerView {
	constructor(source, size) {
		this.source = source;
		this.size = size;
		this.closed = false;
		this.closedPosition = 0;
		this.busy = false;
		validateOffset(size, "length");
		validateOffset(source.position, "source position");
		validateOffset(source.position + size, "end position");
		if (source instanceof TokenizerView) {
			source.assertAvailable();
			source.translateRange(size, source.position);
		}
		this.start = source.position;
		this.fileInfo = { size };
	}
	get position() {
		return this.closed ? this.closedPosition : this.source.position - this.start;
	}
	get remaining() {
		return this.size - this.position;
	}
	supportsRandomAccess() {
		return false;
	}
	createView(length) {
		this.assertAvailable();
		return createTokenizerView(this, length);
	}
	async readBuffer(buffer, options) {
		return this.bufferOperation("readBuffer", buffer, options);
	}
	async peekBuffer(buffer, options) {
		return this.bufferOperation("peekBuffer", buffer, options);
	}
	async bufferOperation(method, buffer, options) {
		this.assertAvailable();
		const length = options?.length ?? buffer.length;
		const position = options?.position ?? this.position;
		const absolutePosition = this.translateRange(length, position);
		if (length > buffer.length) throw new RangeError("length must not exceed the target buffer length");
		return this.run(() => this.source[method](buffer, {
			...options,
			length,
			position: absolutePosition
		}));
	}
	async readToken(token, position = this.position) {
		this.assertAvailable();
		const absolutePosition = this.translateRange(token.len, position);
		return this.run(() => this.source.readToken(token, absolutePosition));
	}
	async peekToken(token, position = this.position) {
		this.assertAvailable();
		const absolutePosition = this.translateRange(token.len, position ?? this.position);
		return this.run(() => this.source.peekToken(token, absolutePosition));
	}
	async readNumber(token) {
		this.assertAvailable();
		this.translateRange(token.len, this.position);
		return this.run(() => this.source.readNumber(token));
	}
	async peekNumber(token) {
		this.assertAvailable();
		this.translateRange(token.len, this.position);
		return this.run(() => this.source.peekNumber(token));
	}
	async ignore(length) {
		this.assertAvailable();
		this.translateRange(length, this.position);
		return this.run(() => this.source.ignore(length));
	}
	async consumeRemainder() {
		this.assertAvailable();
		const length = this.remaining;
		const end = this.translateRange(length, this.position) + length;
		return this.run(async () => {
			if (length === 0) return 0;
			if (isRandomAccessTokenizer(this.source)) {
				if (await this.source.peekBuffer(/* @__PURE__ */ new Uint8Array(1), { position: end - 1 }) !== 1) throw new EndOfStreamError();
				this.source.setPosition(end);
			} else if (await this.source.ignore(length) !== length) throw new EndOfStreamError();
			return length;
		});
	}
	/** Release this view only. Never drain, close or abort the borrowed source. */
	async close() {
		if (this.closed) return;
		if (this.busy) throw new Error("Cannot close a tokenizer view during an active operation");
		this.closedPosition = this.position;
		this.closed = true;
	}
	/** Explicit cancellation propagates to the shared source and affects its other users. */
	async abort() {
		if (this.closed) return;
		try {
			await this.source.abort();
		} finally {
			this.closedPosition = this.position;
			this.closed = true;
		}
	}
	assertAvailable() {
		if (this.closed) throw new Error("Tokenizer view is closed");
		if (this.busy) throw new Error("Tokenizer views require sequential operations");
		if (this.source instanceof TokenizerView) this.source.assertAvailable();
	}
	/** Validate the whole request before delegating or allowing a token allocation. */
	translateRange(length, position) {
		validateOffset(length, "length");
		validateOffset(position, "position");
		validateOffset(position + length, "end position");
		if (position > this.size || length > this.size - position) throw new TokenizerBoundaryError(position, length, this.size);
		if (!this.supportsRandomAccess() && position < this.position) throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
		return this.start + position;
	}
	async run(operation) {
		this.busy = true;
		try {
			return await operation();
		} finally {
			this.busy = false;
		}
	}
};
var RandomAccessTokenizerView = class extends TokenizerView {
	constructor(source, size) {
		super(source, size);
	}
	supportsRandomAccess() {
		return true;
	}
	setPosition(position) {
		this.assertAvailable();
		this.source.setPosition(this.translateRange(0, position));
	}
	createView(length) {
		this.assertAvailable();
		return createTokenizerView(this, length);
	}
};
//#endregion
//#region node_modules/strtok3/lib/core.js
/**
* Construct ReadStreamTokenizer from given ReadableStream (WebStream API).
* Will set fileSize, if provided given Stream has set the .path property/
* @param webStream - Read from Node.js Stream.Readable (must be a byte stream)
* @param options - Tokenizer options
* @returns ReadStreamTokenizer
*/
function fromWebStream(webStream, options) {
	getMaxBufferSize(options);
	throwIfAborted(options?.abortSignal);
	return new ReadStreamTokenizer(makeWebStreamReader(webStream), options);
}
/**
* Construct ReadStreamTokenizer from given Buffer.
* @param uint8Array - Uint8Array to tokenize
* @param options - Tokenizer options
* @returns BufferTokenizer
*/
function fromBuffer(uint8Array, options) {
	return new BufferTokenizer(uint8Array, options);
}
/**
* Construct ReadStreamTokenizer from given Blob.
* @param blob - Uint8Array to tokenize
* @param options - Tokenizer options
* @returns BufferTokenizer
*/
function fromBlob(blob, options) {
	return new BlobTokenizer(blob, options);
}
//#endregion
//#region node_modules/ieee754/index.js
var require_ieee754 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
	exports.read = function(buffer, offset, isLE, mLen, nBytes) {
		var e, m;
		var eLen = nBytes * 8 - mLen - 1;
		var eMax = (1 << eLen) - 1;
		var eBias = eMax >> 1;
		var nBits = -7;
		var i = isLE ? nBytes - 1 : 0;
		var d = isLE ? -1 : 1;
		var s = buffer[offset + i];
		i += d;
		e = s & (1 << -nBits) - 1;
		s >>= -nBits;
		nBits += eLen;
		for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);
		m = e & (1 << -nBits) - 1;
		e >>= -nBits;
		nBits += mLen;
		for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);
		if (e === 0) e = 1 - eBias;
		else if (e === eMax) return m ? NaN : (s ? -1 : 1) * Infinity;
		else {
			m = m + Math.pow(2, mLen);
			e = e - eBias;
		}
		return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
	};
	exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
		var e, m, c;
		var eLen = nBytes * 8 - mLen - 1;
		var eMax = (1 << eLen) - 1;
		var eBias = eMax >> 1;
		var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
		var i = isLE ? 0 : nBytes - 1;
		var d = isLE ? 1 : -1;
		var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
		value = Math.abs(value);
		if (isNaN(value) || value === Infinity) {
			m = isNaN(value) ? 1 : 0;
			e = eMax;
		} else {
			e = Math.floor(Math.log(value) / Math.LN2);
			if (value * (c = Math.pow(2, -e)) < 1) {
				e--;
				c *= 2;
			}
			if (e + eBias >= 1) value += rt / c;
			else value += rt * Math.pow(2, 1 - eBias);
			if (value * c >= 2) {
				e++;
				c /= 2;
			}
			if (e + eBias >= eMax) {
				m = 0;
				e = eMax;
			} else if (e + eBias >= 1) {
				m = (value * c - 1) * Math.pow(2, mLen);
				e = e + eBias;
			} else {
				m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
				e = 0;
			}
		}
		for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8);
		e = e << mLen | m;
		eLen += mLen;
		for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8);
		buffer[offset + i - d] |= s * 128;
	};
}));
//#endregion
//#region node_modules/token-types/dist/lib/index.js
var lib_exports = /* @__PURE__ */ __exportAll({
	AnsiStringType: () => AnsiStringType,
	Float16_BE: () => Float16_BE,
	Float16_LE: () => Float16_LE,
	Float32_BE: () => Float32_BE,
	Float32_LE: () => Float32_LE,
	Float64_BE: () => Float64_BE,
	Float64_LE: () => Float64_LE,
	Float80_BE: () => Float80_BE,
	Float80_LE: () => Float80_LE,
	INT16_BE: () => INT16_BE,
	INT16_LE: () => INT16_LE,
	INT24_BE: () => INT24_BE,
	INT24_LE: () => INT24_LE,
	INT32_BE: () => INT32_BE,
	INT32_LE: () => INT32_LE,
	INT64_BE: () => INT64_BE,
	INT64_LE: () => INT64_LE,
	INT8: () => INT8,
	IgnoreType: () => IgnoreType,
	StringType: () => StringType,
	UINT16_BE: () => UINT16_BE,
	UINT16_LE: () => UINT16_LE,
	UINT24_BE: () => UINT24_BE,
	UINT24_LE: () => UINT24_LE,
	UINT32_BE: () => UINT32_BE,
	UINT32_LE: () => UINT32_LE,
	UINT64_BE: () => UINT64_BE,
	UINT64_LE: () => UINT64_LE,
	UINT8: () => UINT8,
	Uint8ArrayType: () => Uint8ArrayType
});
var import_ieee754 = /* @__PURE__ */ __toESM(require_ieee754(), 1);
function dv(array) {
	return new DataView(array.buffer, array.byteOffset);
}
var UINT8 = {
	len: 1,
	get(array, offset) {
		return dv(array).getUint8(offset);
	},
	put(array, offset, value) {
		dv(array).setUint8(offset, value);
		return offset + 1;
	}
};
/**
* 16-bit unsigned integer, Little Endian byte order
*/
var UINT16_LE = {
	len: 2,
	get(array, offset) {
		return dv(array).getUint16(offset, true);
	},
	put(array, offset, value) {
		dv(array).setUint16(offset, value, true);
		return offset + 2;
	}
};
/**
* 16-bit unsigned integer, Big Endian byte order
*/
var UINT16_BE = {
	len: 2,
	get(array, offset) {
		return dv(array).getUint16(offset);
	},
	put(array, offset, value) {
		dv(array).setUint16(offset, value);
		return offset + 2;
	}
};
/**
* 24-bit unsigned integer, Little Endian byte order
*/
var UINT24_LE = {
	len: 3,
	get(array, offset) {
		const dataView = dv(array);
		return dataView.getUint8(offset) + (dataView.getUint16(offset + 1, true) << 8);
	},
	put(array, offset, value) {
		const dataView = dv(array);
		dataView.setUint8(offset, value & 255);
		dataView.setUint16(offset + 1, value >> 8, true);
		return offset + 3;
	}
};
/**
* 24-bit unsigned integer, Big Endian byte order
*/
var UINT24_BE = {
	len: 3,
	get(array, offset) {
		const dataView = dv(array);
		return (dataView.getUint16(offset) << 8) + dataView.getUint8(offset + 2);
	},
	put(array, offset, value) {
		const dataView = dv(array);
		dataView.setUint16(offset, value >> 8);
		dataView.setUint8(offset + 2, value & 255);
		return offset + 3;
	}
};
/**
* 32-bit unsigned integer, Little Endian byte order
*/
var UINT32_LE = {
	len: 4,
	get(array, offset) {
		return dv(array).getUint32(offset, true);
	},
	put(array, offset, value) {
		dv(array).setUint32(offset, value, true);
		return offset + 4;
	}
};
/**
* 32-bit unsigned integer, Big Endian byte order
*/
var UINT32_BE = {
	len: 4,
	get(array, offset) {
		return dv(array).getUint32(offset);
	},
	put(array, offset, value) {
		dv(array).setUint32(offset, value);
		return offset + 4;
	}
};
/**
* 8-bit signed integer
*/
var INT8 = {
	len: 1,
	get(array, offset) {
		return dv(array).getInt8(offset);
	},
	put(array, offset, value) {
		dv(array).setInt8(offset, value);
		return offset + 1;
	}
};
/**
* 16-bit signed integer, Big Endian byte order
*/
var INT16_BE = {
	len: 2,
	get(array, offset) {
		return dv(array).getInt16(offset);
	},
	put(array, offset, value) {
		dv(array).setInt16(offset, value);
		return offset + 2;
	}
};
/**
* 16-bit signed integer, Little Endian byte order
*/
var INT16_LE = {
	len: 2,
	get(array, offset) {
		return dv(array).getInt16(offset, true);
	},
	put(array, offset, value) {
		dv(array).setInt16(offset, value, true);
		return offset + 2;
	}
};
/**
* 24-bit signed integer, Little Endian byte order
*/
var INT24_LE = {
	len: 3,
	get(array, offset) {
		const unsigned = UINT24_LE.get(array, offset);
		return unsigned > 8388607 ? unsigned - 16777216 : unsigned;
	},
	put(array, offset, value) {
		const dataView = dv(array);
		dataView.setUint8(offset, value & 255);
		dataView.setUint16(offset + 1, value >> 8, true);
		return offset + 3;
	}
};
/**
* 24-bit signed integer, Big Endian byte order
*/
var INT24_BE = {
	len: 3,
	get(array, offset) {
		const unsigned = UINT24_BE.get(array, offset);
		return unsigned > 8388607 ? unsigned - 16777216 : unsigned;
	},
	put(array, offset, value) {
		const dataView = dv(array);
		dataView.setUint16(offset, value >> 8);
		dataView.setUint8(offset + 2, value & 255);
		return offset + 3;
	}
};
/**
* 32-bit signed integer, Big Endian byte order
*/
var INT32_BE = {
	len: 4,
	get(array, offset) {
		return dv(array).getInt32(offset);
	},
	put(array, offset, value) {
		dv(array).setInt32(offset, value);
		return offset + 4;
	}
};
/**
* 32-bit signed integer, Big Endian byte order
*/
var INT32_LE = {
	len: 4,
	get(array, offset) {
		return dv(array).getInt32(offset, true);
	},
	put(array, offset, value) {
		dv(array).setInt32(offset, value, true);
		return offset + 4;
	}
};
/**
* 64-bit unsigned integer, Little Endian byte order
*/
var UINT64_LE = {
	len: 8,
	get(array, offset) {
		return dv(array).getBigUint64(offset, true);
	},
	put(array, offset, value) {
		dv(array).setBigUint64(offset, value, true);
		return offset + 8;
	}
};
/**
* 64-bit signed integer, Little Endian byte order
*/
var INT64_LE = {
	len: 8,
	get(array, offset) {
		return dv(array).getBigInt64(offset, true);
	},
	put(array, offset, value) {
		dv(array).setBigInt64(offset, value, true);
		return offset + 8;
	}
};
/**
* 64-bit unsigned integer, Big Endian byte order
*/
var UINT64_BE = {
	len: 8,
	get(array, offset) {
		return dv(array).getBigUint64(offset);
	},
	put(array, offset, value) {
		dv(array).setBigUint64(offset, value);
		return offset + 8;
	}
};
/**
* 64-bit signed integer, Big Endian byte order
*/
var INT64_BE = {
	len: 8,
	get(array, offset) {
		return dv(array).getBigInt64(offset);
	},
	put(array, offset, value) {
		dv(array).setBigInt64(offset, value);
		return offset + 8;
	}
};
/**
* IEEE 754 16-bit (half precision) float, big endian
*/
var Float16_BE = {
	len: 2,
	get(dataView, offset) {
		return import_ieee754.read(dataView, offset, false, 10, this.len);
	},
	put(dataView, offset, value) {
		import_ieee754.write(dataView, value, offset, false, 10, this.len);
		return offset + this.len;
	}
};
/**
* IEEE 754 16-bit (half precision) float, little endian
*/
var Float16_LE = {
	len: 2,
	get(array, offset) {
		return import_ieee754.read(array, offset, true, 10, this.len);
	},
	put(array, offset, value) {
		import_ieee754.write(array, value, offset, true, 10, this.len);
		return offset + this.len;
	}
};
/**
* IEEE 754 32-bit (single precision) float, big endian
*/
var Float32_BE = {
	len: 4,
	get(array, offset) {
		return dv(array).getFloat32(offset);
	},
	put(array, offset, value) {
		dv(array).setFloat32(offset, value);
		return offset + 4;
	}
};
/**
* IEEE 754 32-bit (single precision) float, little endian
*/
var Float32_LE = {
	len: 4,
	get(array, offset) {
		return dv(array).getFloat32(offset, true);
	},
	put(array, offset, value) {
		dv(array).setFloat32(offset, value, true);
		return offset + 4;
	}
};
/**
* IEEE 754 64-bit (double precision) float, big endian
*/
var Float64_BE = {
	len: 8,
	get(array, offset) {
		return dv(array).getFloat64(offset);
	},
	put(array, offset, value) {
		dv(array).setFloat64(offset, value);
		return offset + 8;
	}
};
/**
* IEEE 754 64-bit (double precision) float, little endian
*/
var Float64_LE = {
	len: 8,
	get(array, offset) {
		return dv(array).getFloat64(offset, true);
	},
	put(array, offset, value) {
		dv(array).setFloat64(offset, value, true);
		return offset + 8;
	}
};
/**
* IEEE 754 80-bit (extended precision) float, big endian
*/
var Float80_BE = {
	len: 10,
	get(array, offset) {
		return import_ieee754.read(array, offset, false, 63, this.len);
	},
	put(array, offset, value) {
		import_ieee754.write(array, value, offset, false, 63, this.len);
		return offset + this.len;
	}
};
/**
* IEEE 754 80-bit (extended precision) float, little endian
*/
var Float80_LE = {
	len: 10,
	get(array, offset) {
		return import_ieee754.read(array, offset, true, 63, this.len);
	},
	put(array, offset, value) {
		import_ieee754.write(array, value, offset, true, 63, this.len);
		return offset + this.len;
	}
};
/**
* Ignore a given number of bytes
*/
var IgnoreType = class {
	/**
	* @param len number of bytes to ignore
	*/
	constructor(len) {
		this.len = len;
	}
	get(_array, _off) {}
};
/**
* Fixed-size byte array
*/
var Uint8ArrayType = class {
	constructor(len) {
		this.len = len;
	}
	get(array, offset) {
		return array.subarray(offset, offset + this.len);
	}
	put(array, offset, value) {
		if (value.length !== this.len) throw new RangeError(`Expected a value of ${this.len} byte(s), got ${value.length}`);
		array.set(value, offset);
		return offset + this.len;
	}
};
/**
* Decode or encode a fixed number of bytes as a string with a specified encoding.
* Supports all encodings supported by TextDecoder, plus 'windows-1252'.
*/
var StringType = class {
	constructor(len, encoding) {
		this.len = len;
		this.encoding = encoding;
	}
	get(data, offset = 0) {
		const bytes = data.subarray(offset, offset + this.len);
		return textDecode(bytes, this.encoding);
	}
	put(array, offset, value) {
		const bytes = textEncode(value, this.encoding);
		if (bytes.length !== this.len) throw new RangeError(`Expected an encoded value of ${this.len} byte(s), got ${bytes.length}`);
		array.set(bytes, offset);
		return offset + this.len;
	}
};
/**
* ANSI Latin 1 String using Windows-1252 (Code Page 1252)
* Windows-1252 is a superset of ISO 8859-1 / Latin-1.
*/
var AnsiStringType = class extends StringType {
	constructor(len) {
		super(len, "windows-1252");
	}
};
//#endregion
//#region node_modules/@tokenizer/inflate/lib/GzipHandler.js
var GzipHandler = class {
	constructor(tokenizer) {
		this.tokenizer = tokenizer;
	}
	inflate() {
		const tokenizer = this.tokenizer;
		return new ReadableStream({ async pull(controller) {
			const buffer = /* @__PURE__ */ new Uint8Array(1024);
			const size = await tokenizer.readBuffer(buffer, { mayBeLess: true });
			if (size === 0) {
				controller.close();
				return;
			}
			controller.enqueue(buffer.subarray(0, size));
		} }).pipeThrough(new DecompressionStream("gzip"));
	}
};
//#endregion
//#region node_modules/@tokenizer/inflate/lib/ZipLimitError.js
/** A configured ZIP processing limit was exceeded. */
var ZipLimitError = class extends RangeError {
	constructor(limit, requestedSize, maxSize) {
		super(`ZIP ${limit} exceeded: ${requestedSize} exceeds limit of ${maxSize}`);
		this.limit = limit;
		this.requestedSize = requestedSize;
		this.maxSize = maxSize;
		this.name = "ZipLimitError";
	}
};
//#endregion
//#region node_modules/@tokenizer/inflate/lib/ZipToken.js
/**
* Ref https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
*/
var Signature = {
	LocalFileHeader: 67324752,
	DataDescriptor: 134695760,
	CentralFileHeader: 33639248,
	EndOfCentralDirectory: 101010256
};
var DataDescriptor = {
	get(array) {
		return {
			signature: UINT32_LE.get(array, 0),
			compressedSize: UINT32_LE.get(array, 8),
			uncompressedSize: UINT32_LE.get(array, 12)
		};
	},
	len: 16
};
/**
* First part of the ZIP Local File Header
* Offset | Bytes| Description
* -------|------+-------------------------------------------------------------------
*      0 |    4 | Signature (0x04034b50)
*      4 |    2 | Minimum version needed to extract
*      6 |    2 | Bit flag
*      8 |    2 | Compression method
*     10 |    2 | File last modification time (MS-DOS format)
*     12 |    2 | File last modification date (MS-DOS format)
*     14 |    4 | CRC-32 of uncompressed data
*     18 |    4 | Compressed size
*     22 |    4 | Uncompressed size
*     26 |    2 | File name length (n)
*     28 |    2 | Extra field length (m)
*     30 |    n | File name
* 30 + n |    m | Extra field
*/
var LocalFileHeaderToken = {
	get(array) {
		const flags = UINT16_LE.get(array, 6);
		return {
			signature: UINT32_LE.get(array, 0),
			minVersion: UINT16_LE.get(array, 4),
			dataDescriptor: !!(flags & 8),
			compressedMethod: UINT16_LE.get(array, 8),
			compressedSize: UINT32_LE.get(array, 18),
			uncompressedSize: UINT32_LE.get(array, 22),
			filenameLength: UINT16_LE.get(array, 26),
			extraFieldLength: UINT16_LE.get(array, 28),
			filename: null
		};
	},
	len: 30
};
/**
* 4.3.16  End of central directory record:
*  end of central dir signature (0x06064b50)                                      4 bytes
*  number of this disk                                                            2 bytes
*  number of the disk with the start of the central directory                     2 bytes
*  total number of entries in the central directory on this disk                  2 bytes
*  total number of entries in the size of the central directory                   2 bytes
*  sizeOfTheCentralDirectory                                                      4 bytes
*  offset of start of central directory with respect to the starting disk number  4 bytes
*  .ZIP file comment length                                                       2 bytes
*  .ZIP file comment       (variable size)
*/
var EndOfCentralDirectoryRecordToken = {
	get(array) {
		return {
			signature: UINT32_LE.get(array, 0),
			nrOfThisDisk: UINT16_LE.get(array, 4),
			nrOfThisDiskWithTheStart: UINT16_LE.get(array, 6),
			nrOfEntriesOnThisDisk: UINT16_LE.get(array, 8),
			nrOfEntriesOfSize: UINT16_LE.get(array, 10),
			sizeOfCd: UINT32_LE.get(array, 12),
			offsetOfStartOfCd: UINT32_LE.get(array, 16),
			zipFileCommentLength: UINT16_LE.get(array, 20)
		};
	},
	len: 22
};
/**
* File header:
*    central file header signature   4 bytes   0 (0x02014b50)
*    version made by                 2 bytes   4
*    version needed to extract       2 bytes   6
*    general purpose bit flag        2 bytes   8
*    compression method              2 bytes  10
*    last mod file time              2 bytes  12
*    last mod file date              2 bytes  14
*    crc-32                          4 bytes  16
*    compressed size                 4 bytes  20
*    uncompressed size               4 bytes  24
*    file name length                2 bytes  28
*    extra field length              2 bytes  30
*    file comment length             2 bytes  32
*    disk number start               2 bytes  34
*    internal file attributes        2 bytes  36
*    external file attributes        4 bytes  38
*    relative offset of local header 4 bytes  42
*/
var FileHeader = {
	get(array) {
		const flags = UINT16_LE.get(array, 8);
		return {
			signature: UINT32_LE.get(array, 0),
			minVersion: UINT16_LE.get(array, 6),
			dataDescriptor: !!(flags & 8),
			compressedMethod: UINT16_LE.get(array, 10),
			compressedSize: UINT32_LE.get(array, 20),
			uncompressedSize: UINT32_LE.get(array, 24),
			filenameLength: UINT16_LE.get(array, 28),
			extraFieldLength: UINT16_LE.get(array, 30),
			fileCommentLength: UINT16_LE.get(array, 32),
			relativeOffsetOfLocalHeader: UINT32_LE.get(array, 42),
			filename: null
		};
	},
	len: 46
};
//#endregion
//#region node_modules/@tokenizer/inflate/lib/ZipHandler.js
function signatureToArray(signature) {
	const signatureBytes = new Uint8Array(UINT32_LE.len);
	UINT32_LE.put(signatureBytes, 0, signature);
	return signatureBytes;
}
var debug = (0, import_src.default)("tokenizer:inflate");
var syncBufferSize = 262144;
var eocdSignatureBytes = signatureToArray(Signature.EndOfCentralDirectory);
var ZipHandler = class {
	constructor(tokenizer, options = {}) {
		this.tokenizer = tokenizer;
		this.syncBuffer = new Uint8Array(syncBufferSize);
		this.scannedBytes = 0;
		this.descriptorScannedBytes = 0;
		this.limits = {
			maxEntryCount: options.maxEntryCount ?? Number.POSITIVE_INFINITY,
			maxTotalScanBytes: options.maxTotalScanBytes ?? Number.POSITIVE_INFINITY,
			maxTotalDataDescriptorScanBytes: options.maxTotalDataDescriptorScanBytes ?? Number.POSITIVE_INFINITY,
			maxSkippedEntrySize: options.maxSkippedEntrySize ?? Number.POSITIVE_INFINITY,
			maxDataDescriptorScanBytes: options.maxDataDescriptorScanBytes ?? Number.POSITIVE_INFINITY,
			maxCompressedSize: options.maxCompressedSize ?? Number.POSITIVE_INFINITY,
			maxUncompressedSize: options.maxUncompressedSize ?? Number.POSITIVE_INFINITY
		};
		this.useCentralDirectory = options.useCentralDirectory ?? true;
		this.allowTruncatedDataDescriptor = options.allowTruncatedDataDescriptor ?? false;
		if (typeof this.useCentralDirectory !== "boolean") throw new TypeError("useCentralDirectory must be a boolean");
		if (typeof this.allowTruncatedDataDescriptor !== "boolean") throw new TypeError("allowTruncatedDataDescriptor must be a boolean");
		for (const [name, limit] of Object.entries(this.limits)) if (limit !== Number.POSITIVE_INFINITY && (!Number.isSafeInteger(limit) || limit <= 0)) throw new RangeError(`${name} must be a positive safe integer or Infinity`);
	}
	/** Reject oversized entries before retaining data or allocating a combined buffer. */
	checkLimit(limit, size) {
		if (size > this.limits[limit]) throw new ZipLimitError(limit, size, this.limits[limit]);
	}
	resetTraversal() {
		this.scannedBytes = 0;
		this.descriptorScannedBytes = 0;
	}
	consumeBytes(length) {
		this.checkLimit("maxTotalScanBytes", this.scannedBytes + length);
		this.scannedBytes += length;
	}
	readToken(token, input = this.tokenizer) {
		this.consumeBytes(token.len);
		return input.readToken(token);
	}
	ignore(length, input = this.tokenizer) {
		this.consumeBytes(length);
		return input.ignore(length);
	}
	readData(length) {
		this.consumeBytes(length);
		const data = new Uint8Array(length);
		return this.tokenizer.readBuffer(data).then(() => data);
	}
	checkEntrySize(header) {
		this.checkLimit("maxCompressedSize", header.compressedSize);
		this.checkLimit("maxUncompressedSize", header.uncompressedSize);
		if (header.compressedMethod === 0) this.checkLimit("maxUncompressedSize", header.compressedSize);
	}
	async isZip() {
		const signature = await this.peekSignature();
		return signature === Signature.LocalFileHeader || signature === Signature.EndOfCentralDirectory;
	}
	peekSignature() {
		return this.tokenizer.peekToken(UINT32_LE);
	}
	async findEndOfCentralDirectoryLocator() {
		const randomReadTokenizer = this.tokenizer;
		const chunkLength = Math.min(16384, randomReadTokenizer.fileInfo.size);
		const buffer = this.syncBuffer.subarray(0, chunkLength);
		this.consumeBytes(chunkLength);
		await this.tokenizer.readBuffer(buffer, { position: randomReadTokenizer.fileInfo.size - chunkLength });
		for (let i = buffer.length - 4; i >= 0; i--) if (buffer[i] === eocdSignatureBytes[0] && buffer[i + 1] === eocdSignatureBytes[1] && buffer[i + 2] === eocdSignatureBytes[2] && buffer[i + 3] === eocdSignatureBytes[3]) return randomReadTokenizer.fileInfo.size - chunkLength + i;
		return -1;
	}
	async readCentralDirectory() {
		this.resetTraversal();
		const entries = await this.centralDirectoryEntries();
		if (!entries) return;
		const files = [];
		for await (const entry of entries) files.push(entry);
		return files;
	}
	async centralDirectoryEntries() {
		if (!this.tokenizer.supportsRandomAccess()) {
			debug("Cannot reading central-directory without random-read support");
			return;
		}
		debug("Reading central-directory...");
		const pos = this.tokenizer.position;
		try {
			const offset = await this.findEndOfCentralDirectoryLocator();
			if (offset >= 0) {
				debug("Central-directory 32-bit signature found");
				this.tokenizer.setPosition(offset);
				const eocdHeader = await this.readToken(EndOfCentralDirectoryRecordToken);
				return this.iterateDirectory(eocdHeader.offsetOfStartOfCd, eocdHeader.sizeOfCd, eocdHeader.nrOfEntriesOfSize);
			}
		} finally {
			this.tokenizer.setPosition(pos);
		}
	}
	async *iterateDirectory(offset, size, count) {
		const source = this.tokenizer;
		const pos = source.position;
		let directory;
		let position = 0;
		try {
			source.setPosition(offset);
			directory = createTokenizerView(source, size);
			for (let n = 0; n < count; ++n) {
				this.checkLimit("maxEntryCount", n + 1);
				directory.setPosition(position);
				const entry = await this.readToken(FileHeader, directory);
				if (entry.signature !== Signature.CentralFileHeader) throw new Error("Expected Central-File-Header signature");
				entry.filename = await this.readToken(new StringType(entry.filenameLength, "utf-8"), directory);
				await this.ignore(entry.extraFieldLength, directory);
				await this.ignore(entry.fileCommentLength, directory);
				position = directory.position;
				yield entry;
			}
		} finally {
			try {
				await directory?.close();
			} finally {
				source.setPosition(pos);
			}
		}
	}
	async unzip(fileCb) {
		this.resetTraversal();
		const entries = this.useCentralDirectory ? await this.centralDirectoryEntries() : void 0;
		if (entries) return this.iterateOverCentralDirectory(entries, fileCb);
		let stop = false;
		let entryCount = 0;
		do {
			const zipHeader = await this.readLocalFileHeader();
			if (!zipHeader) break;
			this.checkLimit("maxEntryCount", ++entryCount);
			const next = fileCb(zipHeader);
			stop = !!next.stop;
			let fileData;
			await this.ignore(zipHeader.extraFieldLength);
			if (next.handler) this.checkEntrySize(zipHeader);
			else this.checkLimit("maxSkippedEntrySize", zipHeader.compressedSize);
			if (zipHeader.dataDescriptor && zipHeader.compressedSize === 0) {
				const chunks = [];
				let totalSize = 0;
				const scanLimit = Math.min(this.limits.maxDataDescriptorScanBytes, this.limits.maxTotalDataDescriptorScanBytes - this.descriptorScannedBytes, this.limits.maxTotalScanBytes - this.scannedBytes, next.handler ? Number.POSITIVE_INFINITY : this.limits.maxSkippedEntrySize, next.handler ? this.limits.maxCompressedSize : Number.POSITIVE_INFINITY, next.handler && zipHeader.compressedMethod === 0 ? this.limits.maxUncompressedSize : Number.POSITIVE_INFINITY);
				debug("Compressed-file-size unknown, scanning for next data-descriptor-signature....");
				while (true) {
					const peekLength = Math.min(syncBufferSize, scanLimit - totalSize + DataDescriptor.len);
					const len = await this.tokenizer.peekBuffer(this.syncBuffer.subarray(0, peekLength), { mayBeLess: true });
					const allowTruncated = this.allowTruncatedDataDescriptor && len < peekLength;
					const nextHeaderIndex = findDescriptor(this.syncBuffer.subarray(0, len), totalSize, allowTruncated);
					if (nextHeaderIndex < 0 && len < DataDescriptor.len && !allowTruncated) throw new Error("Expected data-descriptor-signature before end of input");
					const size = nextHeaderIndex >= 0 ? nextHeaderIndex : allowTruncated ? len : len - DataDescriptor.len + 1;
					if (size === 0) break;
					this.checkLimit("maxDataDescriptorScanBytes", totalSize + size);
					this.checkLimit("maxTotalDataDescriptorScanBytes", this.descriptorScannedBytes + size);
					if (!next.handler) this.checkLimit("maxSkippedEntrySize", totalSize + size);
					if (next.handler) {
						this.checkLimit("maxCompressedSize", totalSize + size);
						if (zipHeader.compressedMethod === 0) this.checkLimit("maxUncompressedSize", totalSize + size);
						if (size > 0) {
							const data = await this.readData(size);
							chunks.push(data);
						}
					} else await this.ignore(size);
					totalSize += size;
					this.descriptorScannedBytes += size;
					if (nextHeaderIndex >= 0) break;
				}
				debug(`Found data-descriptor-signature at pos=${this.tokenizer.position}`);
				if (next.handler) {
					this.checkLimit("maxCompressedSize", totalSize);
					await this.inflate(zipHeader, mergeArrays(chunks), next.handler);
				}
			} else if (next.handler) {
				debug(`Reading compressed-file-data: ${zipHeader.compressedSize} bytes`);
				fileData = await this.readData(zipHeader.compressedSize);
				await this.inflate(zipHeader, fileData, next.handler);
			} else {
				debug(`Ignoring compressed-file-data: ${zipHeader.compressedSize} bytes`);
				await this.ignore(zipHeader.compressedSize);
			}
			debug(`Reading data-descriptor at pos=${this.tokenizer.position}`);
			if (zipHeader.dataDescriptor) {
				if ((await this.readToken(DataDescriptor)).signature !== 134695760) throw new Error(`Expected data-descriptor-signature at position ${this.tokenizer.position - DataDescriptor.len}`);
			}
		} while (!stop);
	}
	async iterateOverCentralDirectory(entries, fileCb) {
		for await (const fileHeader of entries) {
			const next = fileCb(fileHeader);
			if (next.handler) {
				this.tokenizer.setPosition(fileHeader.relativeOffsetOfLocalHeader);
				const zipHeader = await this.readLocalFileHeader();
				if (!zipHeader) throw new Error(`Expected local-file-header at offset ${fileHeader.relativeOffsetOfLocalHeader}`);
				await this.ignore(zipHeader.extraFieldLength);
				this.checkEntrySize(fileHeader);
				this.checkEntrySize(zipHeader);
				const fileData = await this.readData(fileHeader.compressedSize);
				await this.inflate(zipHeader, fileData, next.handler);
			}
			if (next.stop) break;
		}
	}
	async inflate(zipHeader, fileData, cb) {
		if (zipHeader.compressedMethod === 0) {
			this.checkLimit("maxUncompressedSize", fileData.length);
			return cb(fileData);
		}
		if (zipHeader.compressedMethod !== 8) throw new Error(`Unsupported ZIP compression method: ${zipHeader.compressedMethod}`);
		debug(`Decompress filename=${zipHeader.filename}, compressed-size=${fileData.length}`);
		return cb(await this.decompressDeflateRaw(fileData));
	}
	async decompressDeflateRaw(data) {
		const input = new ReadableStream({ start(controller) {
			controller.enqueue(data);
			controller.close();
		} });
		const ds = new DecompressionStream("deflate-raw");
		const reader = input.pipeThrough(ds).getReader();
		const chunks = [];
		let totalSize = 0;
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				this.checkLimit("maxUncompressedSize", totalSize + value.length);
				totalSize += value.length;
				chunks.push(value);
			}
			this.checkLimit("maxUncompressedSize", totalSize);
			return mergeArrays(chunks);
		} catch (err) {
			await reader.cancel(err).catch(() => {});
			if (err instanceof ZipLimitError) throw err;
			if (err instanceof Error && "code" in err && err.code === "ERR_TRAILING_JUNK_AFTER_STREAM_END") return mergeArrays(chunks);
			const message = err instanceof Error ? `Failed to deflate ZIP entry: ${err.message}` : "Unknown decompression error in ZIP entry";
			throw new TypeError(message);
		} finally {
			reader.releaseLock();
		}
	}
	async readLocalFileHeader() {
		const signature = await this.tokenizer.peekToken(UINT32_LE);
		if (signature === Signature.LocalFileHeader) {
			const header = await this.readToken(LocalFileHeaderToken);
			header.filename = await this.readToken(new StringType(header.filenameLength, "utf-8"));
			return header;
		}
		if (signature === Signature.CentralFileHeader || signature === Signature.EndOfCentralDirectory) return false;
		if (signature === 3759263696) throw new Error("Encrypted ZIP");
		throw new Error("Unexpected signature");
	}
};
function findDescriptor(buffer, consumed, allowTruncated) {
	for (let i = 0; i <= buffer.length - (allowTruncated ? 4 : DataDescriptor.len); i++) if (UINT32_LE.get(buffer, i) === Signature.DataDescriptor && (buffer.length - i < 12 || UINT32_LE.get(buffer, i + 8) === consumed + i)) return i;
	return -1;
}
function mergeArrays(chunks) {
	const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
	const mergedArray = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		mergedArray.set(chunk, offset);
		offset += chunk.length;
	}
	return mergedArray;
}
//#endregion
export { TokenizerBoundaryError as A, UINT8 as C, fromBuffer as D, fromBlob as E, EndOfStreamError as F, require_src as I, AbstractTokenizer as M, getMaxBufferSize as N, fromWebStream as O, throwIfAborted as P, UINT64_LE as S, lib_exports as T, UINT24_BE as _, Float64_BE as a, UINT32_LE as b, INT24_BE as c, INT64_BE as d, INT64_LE as f, UINT16_LE as g, UINT16_BE as h, Float32_BE as i, isRandomAccessTokenizer as j, createTokenizerView as k, INT32_BE as l, StringType as m, ZipLimitError as n, INT16_BE as o, INT8 as p, GzipHandler as r, INT16_LE as s, ZipHandler as t, INT32_LE as u, UINT24_LE as v, Uint8ArrayType as w, UINT64_BE as x, UINT32_BE as y };
