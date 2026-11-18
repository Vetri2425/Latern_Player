//#region node_modules/content-type/dist/index.js
/*!
* content-type
* Copyright(c) 2015 Douglas Christopher Wilson
* MIT Licensed
*/
var SP = 32;
var HTAB = 9;
var SEMI = 59;
var EQ = 61;
var DQUOTE = 34;
var BSLASH = 92;
var COMMA = 44;
var LOWER_CASE = 1;
var OWS = 2;
var SEMI_FLAG = 4;
var COMMA_FLAG = 8;
var TOKEN_FLAG = 16;
var NON_ASCII = 65280;
var CASE_FLAGS = 65281;
/**
* Character flags used to normalize HTTP field values while scanning.
* Out-of-range reads intentionally coerce to zero in bitwise expressions.
*/
var CHAR_MAP = /* @__PURE__ */ new Uint8Array(256);
CHAR_MAP[HTAB] |= OWS;
CHAR_MAP[SP] |= OWS;
CHAR_MAP[SEMI] |= SEMI_FLAG;
CHAR_MAP[COMMA] |= COMMA_FLAG;
for (let code = 128; code <= 255; code++) CHAR_MAP[code] |= LOWER_CASE;
for (const char of "!#$%&'*+-.^_`|~") CHAR_MAP[char.charCodeAt(0)] |= TOKEN_FLAG;
for (let code = 48; code <= 57; code++) CHAR_MAP[code] |= TOKEN_FLAG;
for (let code = 65; code <= 90; code++) CHAR_MAP[code] |= 17;
for (let code = 97; code <= 122; code++) CHAR_MAP[code] |= TOKEN_FLAG;
/**
* Null object perf optimization. Faster than `Object.create(null)` and `{ __proto__: null }`.
*/
var NullObject = /* @__PURE__ */ (() => {
	const C = function() {};
	C.prototype = Object.create(null);
	return C;
})();
/**
* Parse a `Content-Type` header.
*/
function parse(header, options) {
	const stopFlags = SEMI_FLAG | (options?.comma === true ? COMMA_FLAG : 0);
	const len = header.length;
	let valueStart = options?.start ?? 0;
	while ((CHAR_MAP[header.charCodeAt(valueStart)] & OWS) !== 0) valueStart++;
	let index = valueStart;
	let typeFlags = 0;
	let whitespace = -1;
	let stop = options?.parameters === false ? COMMA_FLAG : 0;
	while (index < len) {
		const code = header.charCodeAt(index);
		const flags = CHAR_MAP[code];
		if ((flags & stopFlags) !== 0) {
			stop |= flags & COMMA_FLAG;
			break;
		}
		if ((flags & OWS) !== 0) {
			if (whitespace === -1) whitespace = index;
		} else whitespace = -1;
		typeFlags |= code & NON_ASCII | flags;
		index++;
	}
	const valueEnd = whitespace === -1 ? index : whitespace;
	const value = header.slice(valueStart, valueEnd);
	const type = (typeFlags & CASE_FLAGS) === 0 ? value : value.toLowerCase();
	if (index === len || stop !== 0) return {
		type,
		index,
		parameters: new NullObject()
	};
	return parseParameters(header, type, index, len, stopFlags);
}
/**
* Parses the parameters of a `Content-Type` header starting at the given index.
*/
function parseParameters(header, type, index, len, stopFlags) {
	const parameters = new NullObject();
	parameter: while (index < len) {
		index++;
		while ((CHAR_MAP[header.charCodeAt(index)] & OWS) !== 0) index++;
		const keyStart = index;
		let keyFlags = 0;
		let keyWhitespace = -1;
		while (index < len) {
			const code = header.charCodeAt(index);
			const flags = CHAR_MAP[code];
			if ((flags & stopFlags) !== 0) {
				if ((flags & COMMA_FLAG) !== 0) break parameter;
				continue parameter;
			}
			if (code === EQ) {
				const keyEnd = keyWhitespace === -1 ? index : keyWhitespace;
				const value = header.slice(keyStart, keyEnd);
				const key = (keyFlags & CASE_FLAGS) === 0 ? value : value.toLowerCase();
				index++;
				while ((CHAR_MAP[header.charCodeAt(index)] & OWS) !== 0) index++;
				if (index < len && header.charCodeAt(index) === DQUOTE) {
					const quotedStart = ++index;
					let escaped = false;
					while (index < len) {
						const code = header.charCodeAt(index);
						if (code === DQUOTE) {
							if (parameters[key] === void 0) parameters[key] = escaped ? unescapeQuotedPairs(header, quotedStart, index) : header.slice(quotedStart, index);
							index++;
							let stop = 0;
							while (index < len) {
								const flags = CHAR_MAP[header.charCodeAt(index)];
								if ((flags & stopFlags) !== 0) {
									stop = flags & COMMA_FLAG;
									break;
								}
								index++;
							}
							if (stop !== 0) break parameter;
							continue parameter;
						}
						if (code === BSLASH && index + 1 < len) {
							escaped = true;
							index += 2;
							continue;
						}
						index++;
					}
					continue parameter;
				}
				const valueStart = index;
				let stop = 0;
				let valueWhitespace = -1;
				while (index < len) {
					const flags = CHAR_MAP[header.charCodeAt(index)];
					if ((flags & stopFlags) !== 0) {
						stop = flags & COMMA_FLAG;
						break;
					}
					if ((flags & OWS) !== 0) {
						if (valueWhitespace === -1) valueWhitespace = index;
					} else valueWhitespace = -1;
					index++;
				}
				if (parameters[key] === void 0) {
					const valueEnd = valueWhitespace === -1 ? index : valueWhitespace;
					parameters[key] = header.slice(valueStart, valueEnd);
				}
				if (stop !== 0) break parameter;
				continue parameter;
			}
			if ((flags & OWS) !== 0) {
				if (keyWhitespace === -1) keyWhitespace = index;
			} else keyWhitespace = -1;
			keyFlags |= code & NON_ASCII | flags;
			index++;
		}
	}
	return {
		type,
		index,
		parameters
	};
}
/**
* Remove backslashes from quoted pairs in a known-terminated quoted string body.
*/
function unescapeQuotedPairs(str, start, end) {
	let result = "";
	for (let index = start; index < end; index++) if (str.charCodeAt(index) === BSLASH) {
		result += str.slice(start, index);
		start = ++index;
	}
	return result + str.slice(start, end);
}
//#endregion
export { parse as t };
