import { i as __toESM, n as __exportAll } from "../_runtime.mjs";
import { A as TokenizerBoundaryError, C as UINT8, D as fromBuffer, E as fromBlob, F as EndOfStreamError, I as require_src, M as AbstractTokenizer, N as getMaxBufferSize, P as throwIfAborted, S as UINT64_LE, T as lib_exports$1, _ as UINT24_BE, a as Float64_BE, b as UINT32_LE, c as INT24_BE, d as INT64_BE, f as INT64_LE, g as UINT16_LE, h as UINT16_BE, i as Float32_BE, j as isRandomAccessTokenizer, k as createTokenizerView, l as INT32_BE, m as StringType, o as INT16_BE, p as INT8, s as INT16_LE, u as INT32_LE, v as UINT24_LE, w as Uint8ArrayType, x as UINT64_BE, y as UINT32_BE } from "./@tokenizer/inflate+[...].mjs";
import { n as textEncode, t as textDecode } from "./borewit__text-codec.mjs";
import { n as getUintBE, r as uint8ArrayToHex, t as fileTypeFromBuffer } from "./file-type+uint8array-extras.mjs";
import { t as parse } from "./content-type.mjs";
import { t as parse$1 } from "./media-typer.mjs";
import { constants } from "node:fs";
import fs from "node:fs/promises";
//#region node_modules/strtok3/lib/NotRegularFileError.js
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
/** Thrown when regularFileOnly is enabled and the opened handle is not a regular file. */
var NotRegularFileError = class extends Error {
	constructor(path) {
		super(`Not a regular file: ${path}`);
		this.path = path;
		this.name = "NotRegularFileError";
	}
};
(class FileTokenizer extends AbstractTokenizer {
	/**
	* Create tokenizer from provided file path
	* @param sourceFilePath File path
	* @param options Tokenizer options
	*/
	static async fromFile(sourceFilePath, options) {
		getMaxBufferSize(options);
		throwIfAborted(options?.abortSignal);
		const flags = options?.regularFileOnly ? constants.O_RDONLY | constants.O_NONBLOCK : "r";
		const fileHandle = await fs.open(sourceFilePath, flags);
		try {
			const stat = await fileHandle.stat();
			if (options?.regularFileOnly && !stat.isFile()) throw new NotRegularFileError(sourceFilePath);
			return new FileTokenizer(fileHandle, {
				...options,
				fileInfo: {
					...options?.fileInfo,
					path: sourceFilePath,
					size: stat.size
				}
			});
		} catch (error) {
			await fileHandle.close();
			throw error;
		}
	}
	constructor(fileHandle, options) {
		super(options);
		this.fileHandle = fileHandle;
		this.fileInfo = options.fileInfo;
	}
	/**
	* Read buffer from file
	* @param uint8Array - Uint8Array to write result to
	* @param options - Read behaviour options
	* @returns Promise number of bytes read
	*/
	async readBuffer(uint8Array, options) {
		const normOptions = this.normalizeOptions(uint8Array, options);
		this.position = normOptions.position;
		return this.readBufferAt(uint8Array, normOptions, true);
	}
	/**
	* Peek buffer from file
	* @param uint8Array - Uint8Array (or Buffer) to write data to
	* @param options - Read behaviour options
	* @returns Promise number of bytes read
	*/
	async peekBuffer(uint8Array, options) {
		return this.readBufferAt(uint8Array, this.normalizeOptions(uint8Array, options), false);
	}
	/**
	* Fill requests across short file reads; only a zero-byte read establishes EOF.
	* Keep this policy below token decoding and independent of the size recorded at open.
	* mayBeLess tolerates EOF, not fragmentation; peeks never commit cursor progress.
	*/
	async readBufferAt(uint8Array, options, advancePosition) {
		let bytesRead = 0;
		while (bytesRead < options.length) {
			const res = await this.fileHandle.read(uint8Array, bytesRead, options.length - bytesRead, options.position + bytesRead);
			bytesRead += res.bytesRead;
			if (advancePosition) this.position += res.bytesRead;
			if (res.bytesRead === 0) break;
		}
		if (!options.mayBeLess && bytesRead < options.length) throw new EndOfStreamError();
		return bytesRead;
	}
	async closeOnce() {
		await this.fileHandle.close();
		await super.closeOnce();
	}
	setPosition(position) {
		this.validateLength(position, "position");
		this.position = position;
	}
	supportsRandomAccess() {
		return true;
	}
}).fromFile;
//#endregion
//#region node_modules/music-metadata/lib/ParseError.js
var makeParseError = (name) => {
	return class ParseError extends Error {
		name;
		constructor(message) {
			super(message);
			this.name = name;
		}
	};
};
var CouldNotDetermineFileTypeError = class extends makeParseError("CouldNotDetermineFileTypeError") {};
var UnsupportedFileTypeError = class extends makeParseError("UnsupportedFileTypeError") {};
var UnexpectedFileContentError = class extends makeParseError("UnexpectedFileContentError") {
	fileType;
	constructor(fileType, message) {
		super(message);
		this.fileType = fileType;
	}
	toString() {
		return `${this.name} (FileType: ${this.fileType}): ${this.message}`;
	}
};
var FieldDecodingError = class extends makeParseError("FieldDecodingError") {};
var InternalParserError = class extends makeParseError("InternalParserError") {};
var makeUnexpectedFileContentError = (fileType) => {
	return class extends UnexpectedFileContentError {
		constructor(message) {
			super(fileType, message);
		}
	};
};
//#endregion
//#region node_modules/music-metadata/lib/common/Allocation.js
var defaultMaxMemoryAllocation = 67108864;
var defaultMaxMetadataEntries = 1e5;
var defaultMaxChapterCount = 1e3;
var readChunkSize = 65536;
var allocationError = (message) => new UnexpectedFileContentError("metadata", message);
function getMaxMemoryAllocation(options) {
	const limit = options.maxMemoryAllocation ?? defaultMaxMemoryAllocation;
	if (!Number.isSafeInteger(limit) || limit <= 0) throw new RangeError("maxMemoryAllocation must be a positive safe integer");
	return limit;
}
/** Limit entries in an individual decoded list or table, independently of byte-buffer limits. */
function getMaxMetadataEntries(options) {
	const limit = options.maxMetadataEntries ?? 1e5;
	if (!Number.isSafeInteger(limit) || limit <= 0) throw new RangeError("maxMetadataEntries must be a positive safe integer");
	return limit;
}
/** Maximum chapters returned by supported chapter parsers. */
function getMaxChapterCount(options) {
	const limit = options.maxChapterCount ?? 1e3;
	if (!Number.isSafeInteger(limit) || limit <= 0) throw new RangeError("maxChapterCount must be a positive safe integer");
	return limit;
}
/** Configure the tokenizer safety net once, using the same limit as parser-owned buffers. */
function getTokenizerOptions(options, fileInfo) {
	return {
		maxBufferSize: getMaxMemoryAllocation(options),
		fileInfo
	};
}
/** Check untrusted lengths before allocating, including accumulated stream payloads. */
function validateAllocation(length, options, makeError = allocationError) {
	if (!Number.isSafeInteger(length) || length < 0) throw makeError(`Invalid allocation size: ${length}`);
	const limit = getMaxMemoryAllocation(options);
	if (length > limit) throw makeError(`Metadata size ${length} exceeds allocation limit ${limit} (buffering limit)`);
}
function validateAvailableBytes(tokenizer, length, position) {
	if (tokenizer.fileInfo.size !== void 0 && length > tokenizer.fileInfo.size - position) throw new EndOfStreamError();
}
/** Read only bounded chunks from streams; an advertised stream size does not prove bytes exist. */
async function readBuffer(tokenizer, length, options, position = tokenizer.position, makeError = allocationError) {
	validateAllocation(length, options, makeError);
	validateAvailableBytes(tokenizer, length, position);
	if (!isRandomAccessTokenizer(tokenizer) && length > readChunkSize) {
		const chunks = [];
		for (let remaining = length; remaining > 0;) {
			const chunk = new Uint8Array(Math.min(remaining, readChunkSize));
			if (await tokenizer.readBuffer(chunk, { position }) !== chunk.length) throw new EndOfStreamError();
			chunks.push(chunk);
			remaining -= chunk.length;
			position += chunk.length;
		}
		const buffer = new Uint8Array(length);
		let offset = 0;
		for (const chunk of chunks) {
			buffer.set(chunk, offset);
			offset += chunk.length;
		}
		return buffer;
	}
	const buffer = new Uint8Array(length);
	if (await tokenizer.readBuffer(buffer, { position }) !== length) throw new EndOfStreamError();
	return buffer;
}
/** Bound custom tokenizer reads and buffer large stream payloads incrementally. */
async function readToken(tokenizer, token, options, position = tokenizer.position, makeError = allocationError) {
	validateAllocation(token.len, options, makeError);
	validateAvailableBytes(tokenizer, token.len, position);
	if (token.len <= readChunkSize) return tokenizer.readToken(token, position);
	return token.get(await readBuffer(tokenizer, token.len, options, position, makeError), 0);
}
//#endregion
//#region node_modules/music-metadata/lib/common/BasicParser.js
var BasicParser = class {
	metadata;
	tokenizer;
	options;
	/**
	* Initialize parser with output (metadata), input (tokenizer) & parsing options (options).
	* @param {INativeMetadataCollector} metadata Output
	* @param {ITokenizer} tokenizer Input
	* @param {IOptions} options Parsing options
	*/
	constructor(metadata, tokenizer, options) {
		getMaxMemoryAllocation(options);
		this.metadata = metadata;
		this.tokenizer = tokenizer;
		this.options = options;
	}
	readToken(token, position) {
		return readToken(this.tokenizer, token, this.options, position);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/Util.js
function orderTags(nativeTags) {
	const tags = Object.create(null);
	for (const { id, value } of nativeTags) (tags[id] ||= []).push(value);
	return tags;
}
/** Build a snapshot only when the typed view is requested, including custom keys. */
function toNativeTyped(native) {
	const typed = Object.create(null);
	for (const [format, tags] of Object.entries(native)) typed[format] = orderTags(tags);
	return typed;
}
function getBit(buf, off, bit) {
	return (buf[off] & 1 << bit) !== 0;
}
/**
* Find delimiting zero in uint8Array
* @param uint8Array Uint8Array to find the zero delimiter in
* @param encoding The string encoding used
* @return position in uint8Array where zero found, or uint8Array.length if not found
*/
function findZero(uint8Array, encoding) {
	const len = uint8Array.length;
	if (encoding === "utf-16le" || encoding === "utf-16be") {
		for (let i = 0; i + 1 < len; i += 2) if (uint8Array[i] === 0 && uint8Array[i + 1] === 0) return i;
		return len;
	}
	for (let i = 0; i < len; i++) if (uint8Array[i] === 0) return i;
	return len;
}
function trimRightNull(x) {
	const pos0 = x.indexOf("\0");
	return pos0 === -1 ? x : x.substring(0, pos0);
}
/** Split text, validating the value count before allocation. By default, omit empty segments except for empty results. */
function splitText(text, separator, context, validateCount, { keepEmpty = false } = {}) {
	if (separator.length === 0) throw new RangeError("Text separator must not be empty");
	let count = 0;
	let start = 0;
	for (let end = text.indexOf(separator); end >= 0; end = text.indexOf(separator, start)) {
		if (keepEmpty || end > start) ++count;
		start = end + separator.length;
	}
	if (keepEmpty || start < text.length) ++count;
	validateCount(Math.max(count, 1), context);
	const values = [];
	start = 0;
	for (let end = text.indexOf(separator); end >= 0; end = text.indexOf(separator, start)) {
		if (keepEmpty || end > start) values.push(text.slice(start, end));
		start = end + separator.length;
	}
	if (keepEmpty || start < text.length) values.push(text.slice(start));
	else if (values.length === 0) values.push("");
	return values;
}
function swapBytes(uint8Array) {
	const l = uint8Array.length;
	if ((l & 1) !== 0) throw new FieldDecodingError("Buffer length must be even");
	for (let i = 0; i < l; i += 2) {
		const a = uint8Array[i];
		uint8Array[i] = uint8Array[i + 1];
		uint8Array[i + 1] = a;
	}
	return uint8Array;
}
/**
* Decode string
*/
function decodeString(uint8Array, encoding) {
	if (uint8Array[0] === 255 && uint8Array[1] === 254) return decodeString(uint8Array.subarray(2), encoding);
	if (encoding === "utf-16le" && uint8Array[0] === 254 && uint8Array[1] === 255) {
		if ((uint8Array.length & 1) !== 0) throw new FieldDecodingError("Expected even number of octets for 16-bit unicode string");
		return decodeString(swapBytes(uint8Array), encoding);
	}
	if (encoding === "utf-16be") {
		if ((uint8Array.length & 1) !== 0) throw new FieldDecodingError("Expected even number of octets for 16-bit unicode string");
		return new StringType(uint8Array.length, "utf-16le").get(swapBytes(Uint8Array.from(uint8Array)), 0);
	}
	return new StringType(uint8Array.length, encoding).get(uint8Array, 0);
}
function stripNulls(str) {
	str = str.replace(/^\x00+/g, "");
	str = str.replace(/\x00+$/g, "");
	return str;
}
/**
* Read bit-aligned number start from buffer
* Total offset in bits = byteOffset * 8 + bitOffset
* @param source Byte buffer
* @param byteOffset Starting offset in bytes
* @param bitOffset Starting offset in bits: 0 = most significant bit
* @param len Length of number in bits
* @return Decoded bit aligned number
*/
function getBitAllignedNumber$1(source, byteOffset, bitOffset, len) {
	const byteOff = byteOffset + ~~(bitOffset / 8);
	const bitOff = bitOffset % 8;
	const value = source[byteOff] & 255 >> bitOff;
	const bitsLeft = len + bitOff - 8;
	if (bitsLeft <= 0) return value >> -bitsLeft;
	return value << bitsLeft | getBitAllignedNumber$1(source, byteOff + 1, 0, bitsLeft);
}
/**
* Read bit-aligned number start from buffer
* Total offset in bits = byteOffset * 8 + bitOffset
* @param source Byte Uint8Array
* @param byteOffset Starting offset in bytes
* @param bitOffset Starting offset in bits: 0 = most significant bit, 7 is the least significant bit
* @return True if bit is set
*/
function isBitSet$2(source, byteOffset, bitOffset) {
	return getBitAllignedNumber$1(source, byteOffset, bitOffset, 1) === 1;
}
function a2hex(str) {
	const arr = [];
	for (let i = 0, l = str.length; i < l; i++) {
		const hex = Number(str.charCodeAt(i)).toString(16);
		arr.push(hex.length === 1 ? `0${hex}` : hex);
	}
	return arr.join(" ");
}
/**
* Convert power ratio to DB
* ratio: [0..1]
*/
function ratioToDb(ratio) {
	return 10 * Math.log10(ratio);
}
/**
* Convert dB to ratio
* db Decibels
*/
function dbToRatio(dB) {
	return 10 ** (dB / 10);
}
/**
* Convert replay gain to ratio and Decibel
* @param value string holding a ratio like '0.034' or '-7.54 dB'
*/
function toRatio(value) {
	const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(dB)?$/i);
	if (!match) return;
	const number = Number(match[1]);
	if (!Number.isFinite(number)) return;
	const ratio = match[2] ? dbToRatio(number) : number;
	if (!Number.isFinite(ratio) || ratio < 0) return;
	return {
		dB: match[2] ? number : ratioToDb(ratio),
		ratio
	};
}
/**
* Decode a big-endian unsigned integer from a Uint8Array.
* Supports dynamic length (1–8 bytes).
*/
function decodeUintBE(uint8Array) {
	if (uint8Array.length === 0) throw new Error("decodeUintBE: empty Uint8Array");
	const view = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
	return getUintBE(view);
}
//#endregion
//#region node_modules/music-metadata/lib/common/FourCC.js
var validFourCC = /^[\x21-\x7e©][\x20-\x7e\x00()]{3}/;
/**
* Token for read FourCC
* Ref: https://en.wikipedia.org/wiki/FourCC
*/
var FourCcToken = {
	len: 4,
	get: (buf, off) => {
		const id = textDecode(buf.subarray(off, off + FourCcToken.len), "latin1");
		if (!id.match(validFourCC)) throw new FieldDecodingError(`FourCC contains invalid characters: ${a2hex(id)} "${id}"`);
		return id;
	},
	put: (buffer, offset, id) => {
		const str = textEncode(id, "latin1");
		if (str.length !== 4) throw new InternalParserError("Invalid length");
		buffer.set(str, offset);
		return offset + 4;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/apev2/APEv2Token.js
var DataType$2 = {
	text_utf8: 0,
	binary: 1,
	external_info: 2,
	reserved: 3
};
/**
* APE_DESCRIPTOR: defines the sizes (and offsets) of all the pieces, as well as the MD5 checksum
*/
var DescriptorParser = {
	len: 52,
	get: (buf, off) => {
		return {
			ID: FourCcToken.get(buf, off),
			version: UINT32_LE.get(buf, off + 4) / 1e3,
			descriptorBytes: UINT32_LE.get(buf, off + 8),
			headerBytes: UINT32_LE.get(buf, off + 12),
			seekTableBytes: UINT32_LE.get(buf, off + 16),
			headerDataBytes: UINT32_LE.get(buf, off + 20),
			apeFrameDataBytes: UINT32_LE.get(buf, off + 24),
			apeFrameDataBytesHigh: UINT32_LE.get(buf, off + 28),
			terminatingDataBytes: UINT32_LE.get(buf, off + 32),
			fileMD5: new Uint8ArrayType(16).get(buf, off + 36)
		};
	}
};
/**
* APE_HEADER: describes all of the necessary information about the APE file
*/
var Header$5 = {
	len: 24,
	get: (buf, off) => {
		return {
			compressionLevel: UINT16_LE.get(buf, off),
			formatFlags: UINT16_LE.get(buf, off + 2),
			blocksPerFrame: UINT32_LE.get(buf, off + 4),
			finalFrameBlocks: UINT32_LE.get(buf, off + 8),
			totalFrames: UINT32_LE.get(buf, off + 12),
			bitsPerSample: UINT16_LE.get(buf, off + 16),
			channel: UINT16_LE.get(buf, off + 18),
			sampleRate: UINT32_LE.get(buf, off + 20)
		};
	}
};
/**
* APE Tag Header/Footer Version 2.0
* TAG: describes all the properties of the file [optional]
*/
var TagFooter = {
	len: 32,
	get: (buf, off) => {
		return {
			ID: new StringType(8, "ascii").get(buf, off),
			version: UINT32_LE.get(buf, off + 8),
			size: UINT32_LE.get(buf, off + 12),
			fields: UINT32_LE.get(buf, off + 16),
			flags: parseTagFlags(UINT32_LE.get(buf, off + 20))
		};
	}
};
/**
* APE Tag v2.0 Item Header
*/
var TagItemHeader = {
	len: 8,
	get: (buf, off) => {
		return {
			size: UINT32_LE.get(buf, off),
			flags: parseTagFlags(UINT32_LE.get(buf, off + 4))
		};
	}
};
function parseTagFlags(flags) {
	return {
		containsHeader: isBitSet$1(flags, 31),
		containsFooter: isBitSet$1(flags, 30),
		isHeader: isBitSet$1(flags, 29),
		readOnly: isBitSet$1(flags, 0),
		dataType: (flags & 6) >> 1
	};
}
/**
* @param num {number}
* @param bit 0 is least significant bit (LSB)
* @return {boolean} true if bit is 1; otherwise false
*/
function isBitSet$1(num, bit) {
	return (num & 1 << bit) !== 0;
}
//#endregion
//#region node_modules/music-metadata/lib/apev2/APEv2Parser.js
var APEv2Parser_exports = /* @__PURE__ */ __exportAll({
	APEv2Parser: () => APEv2Parser,
	ApeContentError: () => ApeContentError,
	tryParseApeHeader: () => tryParseApeHeader
});
var debug$28 = (0, import_src.default)("music-metadata:parser:APEv2");
var tagFormat$1 = "APEv2";
var preamble = "APETAGEX";
var ApeContentError = class extends makeUnexpectedFileContentError("APEv2") {};
function tryParseApeHeader(metadata, tokenizer, options) {
	return new APEv2Parser(metadata, tokenizer, options).tryParseApeHeader();
}
var APEv2Parser = class APEv2Parser extends BasicParser {
	/**
	* Calculate the media file duration
	* @param ah ApeHeader
	* @return {number} duration in seconds
	*/
	static calculateDuration(ah) {
		let duration = ah.totalFrames > 1 ? ah.blocksPerFrame * (ah.totalFrames - 1) : 0;
		duration += ah.finalFrameBlocks;
		return duration / ah.sampleRate;
	}
	/**
	* Calculates the APEv1 / APEv2 first field offset
	* @param tokenizer
	* @param offset
	*/
	static async findApeFooterOffset(tokenizer, offset) {
		const apeBuf = new Uint8Array(TagFooter.len);
		const position = tokenizer.position;
		if (offset <= TagFooter.len) {
			debug$28(`Offset is too small to read APE footer: offset=${offset}`);
			return;
		}
		if (offset > TagFooter.len) {
			await tokenizer.readBuffer(apeBuf, { position: offset - TagFooter.len });
			tokenizer.setPosition(position);
			const tagFooter = TagFooter.get(apeBuf, 0);
			if (tagFooter.ID === "APETAGEX") {
				if (tagFooter.flags.isHeader) debug$28(`APE Header found at offset=${offset - TagFooter.len}`);
				else {
					debug$28(`APE Footer found at offset=${offset - TagFooter.len}`);
					offset -= tagFooter.size;
				}
				return {
					footer: tagFooter,
					offset
				};
			}
		}
	}
	static parseTagFooter(metadata, buffer, options) {
		const footer = TagFooter.get(buffer, buffer.length - TagFooter.len);
		if (footer.ID !== preamble) throw new ApeContentError("Unexpected APEv2 Footer ID preamble value");
		return new APEv2Parser(metadata, fromBuffer(buffer, getTokenizerOptions(options)), options).parseTags(footer);
	}
	ape = {};
	/**
	* Parse APEv1 / APEv2 header if header signature found
	*/
	async tryParseApeHeader() {
		if (this.tokenizer.fileInfo.size && this.tokenizer.fileInfo.size - this.tokenizer.position < TagFooter.len) {
			debug$28("No APEv2 header found, end-of-file reached");
			return;
		}
		const footer = await this.tokenizer.peekToken(TagFooter);
		if (footer.ID === preamble) {
			await this.tokenizer.ignore(TagFooter.len);
			return this.parseTags(footer);
		}
		debug$28(`APEv2 header not found at offset=${this.tokenizer.position}`);
		if (this.tokenizer.fileInfo.size) {
			const remaining = this.tokenizer.fileInfo.size - this.tokenizer.position;
			const buffer = await this.readTagValue(remaining);
			return APEv2Parser.parseTagFooter(this.metadata, buffer, this.options);
		}
	}
	async parse() {
		const descriptor = await this.tokenizer.readToken(DescriptorParser);
		if (descriptor.ID !== "MAC ") throw new ApeContentError("Unexpected descriptor ID");
		this.ape.descriptor = descriptor;
		const lenExp = descriptor.descriptorBytes - DescriptorParser.len;
		const header = await (lenExp > 0 ? this.parseDescriptorExpansion(lenExp) : this.parseHeader());
		this.metadata.setAudioOnly();
		await this.tokenizer.ignore(header.forwardBytes);
		return this.tryParseApeHeader();
	}
	async parseTags(footer) {
		if (footer.fields > getMaxMetadataEntries(this.options)) throw new ApeContentError(`Tag item count ${footer.fields} exceeds entry limit ${getMaxMetadataEntries(this.options)}`);
		const keyBuffer = /* @__PURE__ */ new Uint8Array(256);
		let bytesRemaining = footer.size - TagFooter.len;
		debug$28(`Parse APE tags at offset=${this.tokenizer.position}, size=${bytesRemaining}`);
		for (let i = 0; i < footer.fields; i++) {
			if (bytesRemaining < TagItemHeader.len) {
				this.metadata.addWarning(`APEv2 Tag-header: ${footer.fields - i} items remaining, but no more tag data to read.`);
				break;
			}
			const tagItemHeader = await this.tokenizer.readToken(TagItemHeader);
			bytesRemaining -= TagItemHeader.len;
			if (tagItemHeader.size >= bytesRemaining) throw new ApeContentError(`Invalid tag item size: ${tagItemHeader.size}`);
			const keyBytes = await this.tokenizer.peekBuffer(keyBuffer, {
				length: Math.min(keyBuffer.length, bytesRemaining - tagItemHeader.size),
				mayBeLess: true
			});
			let zero = keyBuffer.subarray(0, keyBytes).indexOf(0);
			if (zero === -1) throw new ApeContentError("Unterminated tag item key");
			const key = await this.tokenizer.readToken(new StringType(zero, "ascii"));
			await this.tokenizer.ignore(1);
			bytesRemaining -= key.length + 1;
			if (this.tokenizer.fileInfo.size !== void 0 && tagItemHeader.size > this.tokenizer.fileInfo.size - this.tokenizer.position) throw new ApeContentError(`Invalid tag item size: ${tagItemHeader.size}`);
			bytesRemaining -= tagItemHeader.size;
			switch (tagItemHeader.flags.dataType) {
				case DataType$2.text_utf8: {
					const value = textDecode(await this.readTagValue(tagItemHeader.size), "utf-8");
					let valueCount = 1;
					for (let offset = value.indexOf("\0"); offset >= 0; offset = value.indexOf("\0", offset + 1)) ++valueCount;
					if (valueCount > getMaxMetadataEntries(this.options)) throw new ApeContentError(`Text value count ${valueCount} exceeds entry limit ${getMaxMetadataEntries(this.options)}`);
					const values = value.split(/\x00/g);
					await Promise.all(values.map((val) => this.metadata.addTag(tagFormat$1, key, val)));
					break;
				}
				case DataType$2.binary:
					if (this.options.skipCovers) await this.tokenizer.ignore(tagItemHeader.size);
					else {
						const picData = await this.readTagValue(tagItemHeader.size);
						zero = findZero(picData);
						const description = textDecode(picData.subarray(0, zero), "utf-8");
						const data = picData.subarray(zero + 1);
						await this.metadata.addTag(tagFormat$1, key, {
							description,
							data
						});
					}
					break;
				case DataType$2.external_info:
					debug$28(`Ignore external info ${key}`);
					await this.tokenizer.ignore(tagItemHeader.size);
					break;
				case DataType$2.reserved:
					debug$28(`Ignore external info ${key}`);
					this.metadata.addWarning(`APEv2 header declares a reserved datatype for "${key}"`);
					await this.tokenizer.ignore(tagItemHeader.size);
			}
		}
	}
	async readTagValue(size) {
		return readBuffer(this.tokenizer, size, this.options, void 0, (message) => new ApeContentError(message));
	}
	async parseDescriptorExpansion(lenExp) {
		await this.tokenizer.ignore(lenExp);
		return this.parseHeader();
	}
	async parseHeader() {
		const header = await this.tokenizer.readToken(Header$5);
		this.metadata.setFormat("lossless", true);
		this.metadata.setFormat("container", "Monkey's Audio");
		this.metadata.setFormat("codec", "Monkey's Audio");
		this.metadata.setFormat("bitsPerSample", header.bitsPerSample);
		this.metadata.setFormat("sampleRate", header.sampleRate);
		this.metadata.setFormat("numberOfChannels", header.channel);
		this.metadata.setFormat("duration", APEv2Parser.calculateDuration(header));
		if (!this.ape.descriptor) throw new ApeContentError("Missing APE descriptor");
		return { forwardBytes: this.ape.descriptor.seekTableBytes + this.ape.descriptor.headerDataBytes + this.ape.descriptor.apeFrameDataBytes + this.ape.descriptor.terminatingDataBytes };
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v1/ID3v1Parser.js
var debug$27 = (0, import_src.default)("music-metadata:parser:ID3v1");
/**
* ID3v1 Genre mappings
* Ref: https://de.wikipedia.org/wiki/Liste_der_ID3v1-Genres
*/
var Genres = [
	"Blues",
	"Classic Rock",
	"Country",
	"Dance",
	"Disco",
	"Funk",
	"Grunge",
	"Hip-Hop",
	"Jazz",
	"Metal",
	"New Age",
	"Oldies",
	"Other",
	"Pop",
	"R&B",
	"Rap",
	"Reggae",
	"Rock",
	"Techno",
	"Industrial",
	"Alternative",
	"Ska",
	"Death Metal",
	"Pranks",
	"Soundtrack",
	"Euro-Techno",
	"Ambient",
	"Trip-Hop",
	"Vocal",
	"Jazz+Funk",
	"Fusion",
	"Trance",
	"Classical",
	"Instrumental",
	"Acid",
	"House",
	"Game",
	"Sound Clip",
	"Gospel",
	"Noise",
	"Alt. Rock",
	"Bass",
	"Soul",
	"Punk",
	"Space",
	"Meditative",
	"Instrumental Pop",
	"Instrumental Rock",
	"Ethnic",
	"Gothic",
	"Darkwave",
	"Techno-Industrial",
	"Electronic",
	"Pop-Folk",
	"Eurodance",
	"Dream",
	"Southern Rock",
	"Comedy",
	"Cult",
	"Gangsta Rap",
	"Top 40",
	"Christian Rap",
	"Pop/Funk",
	"Jungle",
	"Native American",
	"Cabaret",
	"New Wave",
	"Psychedelic",
	"Rave",
	"Showtunes",
	"Trailer",
	"Lo-Fi",
	"Tribal",
	"Acid Punk",
	"Acid Jazz",
	"Polka",
	"Retro",
	"Musical",
	"Rock & Roll",
	"Hard Rock",
	"Folk",
	"Folk/Rock",
	"National Folk",
	"Swing",
	"Fast-Fusion",
	"Bebob",
	"Latin",
	"Revival",
	"Celtic",
	"Bluegrass",
	"Avantgarde",
	"Gothic Rock",
	"Progressive Rock",
	"Psychedelic Rock",
	"Symphonic Rock",
	"Slow Rock",
	"Big Band",
	"Chorus",
	"Easy Listening",
	"Acoustic",
	"Humour",
	"Speech",
	"Chanson",
	"Opera",
	"Chamber Music",
	"Sonata",
	"Symphony",
	"Booty Bass",
	"Primus",
	"Porn Groove",
	"Satire",
	"Slow Jam",
	"Club",
	"Tango",
	"Samba",
	"Folklore",
	"Ballad",
	"Power Ballad",
	"Rhythmic Soul",
	"Freestyle",
	"Duet",
	"Punk Rock",
	"Drum Solo",
	"A Cappella",
	"Euro-House",
	"Dance Hall",
	"Goa",
	"Drum & Bass",
	"Club-House",
	"Hardcore",
	"Terror",
	"Indie",
	"BritPop",
	"Negerpunk",
	"Polsk Punk",
	"Beat",
	"Christian Gangsta Rap",
	"Heavy Metal",
	"Black Metal",
	"Crossover",
	"Contemporary Christian",
	"Christian Rock",
	"Merengue",
	"Salsa",
	"Thrash Metal",
	"Anime",
	"JPop",
	"Synthpop",
	"Abstract",
	"Art Rock",
	"Baroque",
	"Bhangra",
	"Big Beat",
	"Breakbeat",
	"Chillout",
	"Downtempo",
	"Dub",
	"EBM",
	"Eclectic",
	"Electro",
	"Electroclash",
	"Emo",
	"Experimental",
	"Garage",
	"Global",
	"IDM",
	"Illbient",
	"Industro-Goth",
	"Jam Band",
	"Krautrock",
	"Leftfield",
	"Lounge",
	"Math Rock",
	"New Romantic",
	"Nu-Breakz",
	"Post-Punk",
	"Post-Rock",
	"Psytrance",
	"Shoegaze",
	"Space Rock",
	"Trop Rock",
	"World Music",
	"Neoclassical",
	"Audiobook",
	"Audio Theatre",
	"Neue Deutsche Welle",
	"Podcast",
	"Indie Rock",
	"G-Funk",
	"Dubstep",
	"Garage Rock",
	"Psybient"
];
/**
* Spec: http://id3.org/ID3v1
* Wiki: https://en.wikipedia.org/wiki/ID3
*/
var Iid3v1Token = {
	len: 128,
	/**
	* @param buf Buffer possibly holding the 128-byte ID3v1/1.1 metadata header
	* @param off Offset in buffer in bytes
	* @returns ID3v1/1.1 header if the first 3 bytes equal 'TAG', otherwise null is returned
	*/
	get: (buf, off) => {
		const header = new Id3v1StringType(3).get(buf, off);
		if (header !== "TAG") return null;
		const zeroByte = UINT8.get(buf, off + 125);
		const track = UINT8.get(buf, off + 126);
		const hasTrack = zeroByte === 0 && track !== 0;
		return {
			header,
			title: new Id3v1StringType(30).get(buf, off + 3),
			artist: new Id3v1StringType(30).get(buf, off + 33),
			album: new Id3v1StringType(30).get(buf, off + 63),
			year: new Id3v1StringType(4).get(buf, off + 93),
			comment: new Id3v1StringType(hasTrack ? 28 : 30).get(buf, off + 97),
			track: hasTrack ? track : void 0,
			genre: UINT8.get(buf, off + 127)
		};
	}
};
var Id3v1StringType = class {
	len;
	stringType;
	constructor(len) {
		this.len = len;
		this.stringType = new StringType(len, "latin1");
	}
	get(buf, off) {
		let value = this.stringType.get(buf, off);
		value = trimRightNull(value);
		value = value.trim();
		return value.length > 0 ? value : void 0;
	}
};
var ID3v1Parser = class ID3v1Parser extends BasicParser {
	apeHeader;
	constructor(metadata, tokenizer, options) {
		super(metadata, tokenizer, options);
		this.apeHeader = options.apeHeader;
	}
	static getGenre(genreIndex) {
		if (genreIndex < Genres.length) return Genres[genreIndex];
	}
	async parse() {
		if (!this.tokenizer.fileInfo.size) {
			debug$27("Skip checking for ID3v1 because the file-size is unknown");
			return;
		}
		if (this.apeHeader && isRandomAccessTokenizer(this.tokenizer)) {
			this.tokenizer.setPosition(this.apeHeader.offset);
			await new APEv2Parser(this.metadata, this.tokenizer, this.options).parseTags(this.apeHeader.footer);
		}
		const offset = this.tokenizer.fileInfo.size - Iid3v1Token.len;
		if (this.tokenizer.position > offset) {
			debug$27("Already consumed the last 128 bytes");
			return;
		}
		const header = await this.tokenizer.readToken(Iid3v1Token, offset);
		if (header) {
			debug$27("ID3v1 header found at: pos=%s", this.tokenizer.fileInfo.size - Iid3v1Token.len);
			for (const id of [
				"title",
				"artist",
				"album",
				"comment",
				"track",
				"year"
			]) if (header[id] && header[id] !== "") await this.addTag(id, header[id]);
			const genre = ID3v1Parser.getGenre(header.genre);
			if (genre) await this.addTag("genre", genre);
		} else debug$27("ID3v1 header not found at: pos=%s", this.tokenizer.fileInfo.size - Iid3v1Token.len);
	}
	async addTag(id, value) {
		await this.metadata.addTag("ID3v1", id, value);
	}
};
async function hasID3v1Header(tokenizer) {
	if (tokenizer.fileInfo.size >= 128) {
		const tag = /* @__PURE__ */ new Uint8Array(3);
		const position = tokenizer.position;
		await tokenizer.readBuffer(tag, { position: tokenizer.fileInfo.size - 128 });
		tokenizer.setPosition(position);
		return textDecode(tag, "latin1") === "TAG";
	}
	return false;
}
//#endregion
//#region node_modules/music-metadata/lib/tokens/id3v2.js
/**
* The picture type according to the ID3v2 APIC frame.
* Ref: https://id3.org/id3v2.3.0#Attached_picture
*/
var AttachedPictureType = {
	0: "Other",
	1: "32x32 pixels 'file icon' (PNG only)",
	2: "Other file icon",
	3: "Cover (front)",
	4: "Cover (back)",
	5: "Leaflet page",
	6: "Media (e.g. label side of CD)",
	7: "Lead artist/lead performer/soloist",
	8: "Artist/performer",
	9: "Conductor",
	10: "Band/Orchestra",
	11: "Composer",
	12: "Lyricist/text writer",
	13: "Recording Location",
	14: "During recording",
	15: "During performance",
	16: "Movie/video screen capture",
	17: "A bright coloured fish",
	18: "Illustration",
	19: "Band/artist logotype",
	20: "Publisher/Studio logotype"
};
var attachedPictureTypes = AttachedPictureType;
function attachedPictureType(typeId) {
	return attachedPictureTypes[typeId];
}
function ensureAvailable$1(buffer, offset, length) {
	if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > buffer.length) throw new RangeError(`Cannot read ${length} byte(s) at offset ${offset} from a ${buffer.length}-byte buffer`);
}
/**
* 28-bit (representing up to 256 MB) integer, with the most significant bit of
* each byte cleared to avoid false sync signals: 4 * %0xxxxxxx
*/
var UINT32SYNCSAFE = {
	len: 4,
	get(buffer, offset) {
		ensureAvailable$1(buffer, offset, UINT32SYNCSAFE.len);
		return buffer[offset + 3] & 127 | buffer[offset + 2] << 7 | buffer[offset + 1] << 14 | buffer[offset] << 21;
	},
	put(buffer, offset, value) {
		ensureAvailable$1(buffer, offset, UINT32SYNCSAFE.len);
		if (!Number.isSafeInteger(value) || value < 0 || value > 268435455) throw new RangeError(`Sync-safe integer must be between 0 and 268435455, got ${value}`);
		buffer[offset] = value >>> 21 & 127;
		buffer[offset + 1] = value >>> 14 & 127;
		buffer[offset + 2] = value >>> 7 & 127;
		buffer[offset + 3] = value & 127;
		return offset + UINT32SYNCSAFE.len;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v2Token.js
/**
* https://id3.org/id3v2.3.0#Synchronised_lyrics.2Ftext
*/
var LyricsContentType = {
	other: 0,
	lyrics: 1,
	text: 2,
	movement_part: 3,
	events: 4,
	chord: 5,
	trivia_pop: 6
};
var TimestampFormat = {
	notSynchronized: 0,
	mpegFrameNumber: 1,
	milliseconds: 2
};
/**
* ID3v2 header
* Ref: http://id3.org/id3v2.3.0#ID3v2_header
* ToDo
*/
var ID3v2Header = {
	len: 10,
	get: (buf, off) => {
		return {
			fileIdentifier: new StringType(3, "ascii").get(buf, off),
			version: {
				major: INT8.get(buf, off + 3),
				revision: INT8.get(buf, off + 4)
			},
			flags: {
				unsynchronisation: getBit(buf, off + 5, 7),
				isExtendedHeader: getBit(buf, off + 5, 6),
				expIndicator: getBit(buf, off + 5, 5),
				footer: getBit(buf, off + 5, 4)
			},
			size: UINT32SYNCSAFE.get(buf, off + 6)
		};
	}
};
var TextEncodingToken = {
	len: 1,
	get: (uint8Array, off) => {
		switch (uint8Array[off]) {
			case 0: return { encoding: "latin1" };
			case 1: return {
				encoding: "utf-16le",
				bom: true
			};
			case 2: return {
				encoding: "utf-16be",
				bom: false
			};
			case 3: return {
				encoding: "utf8",
				bom: false
			};
			default: return {
				encoding: "utf8",
				bom: false
			};
		}
	}
};
/**
* Used to read first portion of `SYLT` frame
*/
var TextHeader = {
	len: 4,
	get: (uint8Array, off) => {
		return {
			encoding: TextEncodingToken.get(uint8Array, off),
			language: new StringType(3, "latin1").get(uint8Array, off + 1)
		};
	}
};
/**
* Used to read first portion of `SYLT` frame
*/
var SyncTextHeader = {
	len: 6,
	get: (uint8Array, off) => {
		const text = TextHeader.get(uint8Array, off);
		return {
			encoding: text.encoding,
			language: text.language,
			timeStampFormat: UINT8.get(uint8Array, off + 4),
			contentType: UINT8.get(uint8Array, off + 5)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/FrameHeader.js
/**
* Frame header length (bytes) depending on ID3v2 major version.
*/
function getFrameHeaderLength(majorVer) {
	switch (majorVer) {
		case 2: return 6;
		case 3:
		case 4: return 10;
		default: throw makeUnexpectedMajorVersionError$2(majorVer);
	}
}
function readFrameFlags(b, majorVer) {
	if (majorVer === 3) return {
		status: {
			tag_alter_preservation: getBit(b, 0, 7),
			file_alter_preservation: getBit(b, 0, 6),
			read_only: getBit(b, 0, 5)
		},
		format: {
			compression: getBit(b, 1, 7),
			encryption: getBit(b, 1, 6),
			grouping_identity: getBit(b, 1, 5),
			unsynchronisation: false,
			data_length_indicator: false
		}
	};
	return {
		status: {
			tag_alter_preservation: getBit(b, 0, 6),
			file_alter_preservation: getBit(b, 0, 5),
			read_only: getBit(b, 0, 4)
		},
		format: {
			grouping_identity: getBit(b, 1, 6),
			compression: getBit(b, 1, 3),
			encryption: getBit(b, 1, 2),
			unsynchronisation: getBit(b, 1, 1),
			data_length_indicator: getBit(b, 1, 0)
		}
	};
}
/**
* Factory: parse a frame header from its header bytes (6 for v2.2, 10 for v2.3/v2.4).
*
* Note: It only *parses* and does light validation. It does not read payload bytes.
*/
function readFrameHeader(uint8Array, majorVer, warningCollector) {
	switch (majorVer) {
		case 2: return parseFrameHeaderV22(uint8Array, majorVer, warningCollector);
		case 3:
		case 4: return parseFrameHeaderV23V24(uint8Array, majorVer, warningCollector);
		default: throw makeUnexpectedMajorVersionError$2(majorVer);
	}
}
function parseFrameHeaderV22(uint8Array, majorVer, warningCollector) {
	const header = {
		id: textDecode(uint8Array.subarray(0, 3), "ascii"),
		length: UINT24_BE.get(uint8Array, 3)
	};
	if (!header.id.match(/^[A-Z0-9]{3}$/)) warningCollector.addWarning(`Invalid ID3v2.${majorVer} frame-header-ID: ${header.id}`);
	return header;
}
function parseFrameHeaderV23V24(uint8Array, majorVer, warningCollector) {
	const header = {
		id: textDecode(uint8Array.subarray(0, 4), "ascii"),
		length: (majorVer === 4 ? UINT32SYNCSAFE : UINT32_BE).get(uint8Array, 4),
		flags: readFrameFlags(uint8Array.subarray(8, 10), majorVer)
	};
	if (!header.id.match(/^[A-Z0-9]{4}$/)) warningCollector.addWarning(`Invalid ID3v2.${majorVer} frame-header-ID: ${header.id}`);
	return header;
}
function makeUnexpectedMajorVersionError$2(majorVer) {
	throw new Id3v2ContentError(`Unexpected majorVer: ${majorVer}`);
}
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v2ChapterToken.js
/**
* Data portion of `CHAP` sub frame
*/
var ChapterInfo = {
	len: 16,
	get: (buf, off) => {
		const startOffset = UINT32_BE.get(buf, off + 8);
		const endOffset = UINT32_BE.get(buf, off + 12);
		return {
			startTime: UINT32_BE.get(buf, off),
			endTime: UINT32_BE.get(buf, off + 4),
			startOffset: startOffset === 4294967295 ? void 0 : startOffset,
			endOffset: endOffset === 4294967295 ? void 0 : endOffset
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/FrameParser.js
var debug$26 = (0, import_src.default)("music-metadata:id3v2:frame-parser");
var defaultEnc = "latin1";
var urlEnc = {
	encoding: defaultEnc,
	bom: false
};
function parseGenre(origVal, maxEntries = defaultMaxMetadataEntries) {
	const genres = [];
	const addGenre = (genre) => {
		if (genres.length >= maxEntries) throw new Id3v2ContentError(`TCON value count ${genres.length + 1} exceeds entry limit ${maxEntries}`);
		genres.push(genre);
	};
	let word = "";
	for (let offset = 0; offset < origVal.length;) {
		const open = origVal.indexOf("(", offset);
		if (open < 0) {
			word += origVal.slice(offset);
			break;
		}
		word += origVal.slice(offset, open);
		if (origVal[open + 1] === "(") {
			word += "(";
			offset = open + 2;
			continue;
		}
		const close = origVal.indexOf(")", open + 1);
		if (close < 0) break;
		if (word !== "") {
			addGenre(word);
			word = "";
		}
		const genre = parseGenreCode(origVal.slice(open + 1, close));
		if (genre) addGenre(genre);
		offset = close + 1;
	}
	if (word) {
		if (genres.length === 0 && word.match(/^\d*$/)) word = parseGenreCode(word);
		if (word) addGenre(word);
	}
	return genres;
}
function parseGenreCode(code) {
	if (code === "RX") return "Remix";
	if (code === "CR") return "Cover";
	if (code.match(/^\d*$/)) return Genres[Number.parseInt(code, 10)];
}
var FrameParser = class FrameParser {
	maxEntries;
	embeddedFrameDepth = 0;
	major;
	warningCollector;
	/**
	* Create id3v2 frame parser
	* @param major - Major version, e.g. (4) for  id3v2.4
	* @param warningCollector - Used to collect decode issue
	*/
	constructor(major, warningCollector, maxEntries = defaultMaxMetadataEntries) {
		this.maxEntries = maxEntries;
		this.major = major;
		this.warningCollector = warningCollector;
	}
	validateTextValues = (count, context) => {
		if (count > this.maxEntries) throw new Id3v2ContentError(`${context} value count ${count} exceeds entry limit ${this.maxEntries}`);
	};
	readData(uint8Array, type, includeCovers) {
		if (uint8Array.length === 0) {
			if (type === "CHAP" || type === "CTOC") throw new Id3v2ContentError(`Truncated ${type} header`);
			this.warningCollector.addWarning(`id3v2.${this.major} header has empty tag type=${type}`);
			return;
		}
		const { encoding, bom } = TextEncodingToken.get(uint8Array, 0);
		const length = uint8Array.length;
		let offset = 0;
		let output = [];
		const nullTerminatorLength = FrameParser.getNullTerminatorLength(encoding);
		let fzero;
		debug$26(`Parsing tag type=${type}, encoding=${encoding}, bom=${bom}`);
		switch (type !== "TXXX" && type[0] === "T" ? "T*" : type) {
			case "T*":
			case "GRP1":
			case "GP1":
			case "IPL":
			case "IPLS":
			case "MVIN":
			case "MVNM":
			case "PCS":
			case "PCST": {
				let text;
				try {
					text = FrameParser.trimNullPadding(decodeString(uint8Array.subarray(1), encoding));
				} catch (error) {
					if (error instanceof Error) {
						this.warningCollector.addWarning(`id3v2.${this.major} type=${type} header has invalid string value: ${error.message}`);
						break;
					}
					throw error;
				}
				switch (type) {
					case "TMCL":
					case "TIPL":
					case "IPL":
					case "IPLS":
						output = this.functionList(this.splitValue(type, text));
						break;
					case "TRK":
					case "TRCK":
					case "TPOS":
					case "TIT1":
					case "TIT2":
					case "TIT3":
						output = text;
						break;
					case "TCOM":
					case "TEXT":
					case "TOLY":
					case "TOPE":
					case "TPE1":
					case "TSRC":
						output = this.splitValue(type, text);
						break;
					case "TCO":
					case "TCON": {
						const genres = [];
						for (const value of this.splitValue(type, text)) for (const genre of parseGenre(value, this.maxEntries)) {
							this.validateTextValues(genres.length + 1, "TCON");
							genres.push(genre);
						}
						output = genres;
						break;
					}
					case "PCS":
					case "PCST":
						output = this.major >= 4 ? this.splitValue(type, text) : [text];
						output = Array.isArray(output) && output[0] === "" ? 1 : 0;
						break;
					default: output = this.major >= 4 ? this.splitValue(type, text) : [text];
				}
				break;
			}
			case "TXXX": {
				const idAndData = FrameParser.readIdentifierAndData(uint8Array.subarray(1), encoding);
				output = {
					description: idAndData.id,
					text: this.splitValue(type, FrameParser.trimNullPadding(decodeString(idAndData.data, encoding)), idAndData.id)
				};
				break;
			}
			case "PIC":
			case "APIC":
				if (includeCovers) {
					const pic = {};
					uint8Array = uint8Array.subarray(1);
					switch (this.major) {
						case 2:
							pic.format = decodeString(uint8Array.subarray(0, 3), "latin1");
							uint8Array = uint8Array.subarray(3);
							break;
						case 3:
						case 4:
							fzero = findZero(uint8Array, defaultEnc);
							pic.format = decodeString(uint8Array.subarray(0, fzero), defaultEnc);
							uint8Array = uint8Array.subarray(fzero + 1);
							break;
						default: throw makeUnexpectedMajorVersionError$1(this.major);
					}
					pic.format = FrameParser.fixPictureMimeType(pic.format);
					pic.type = AttachedPictureType[uint8Array[0]];
					uint8Array = uint8Array.subarray(1);
					fzero = findZero(uint8Array, encoding);
					pic.description = decodeString(uint8Array.subarray(0, fzero), encoding);
					uint8Array = uint8Array.subarray(fzero + nullTerminatorLength);
					pic.data = uint8Array;
					output = pic;
				}
				break;
			case "CNT":
			case "PCNT":
				output = decodeUintBE(uint8Array);
				break;
			case "SYLT": {
				const syltHeader = SyncTextHeader.get(uint8Array, 0);
				uint8Array = uint8Array.subarray(SyncTextHeader.len);
				const result = {
					descriptor: "",
					language: syltHeader.language,
					contentType: syltHeader.contentType,
					timeStampFormat: syltHeader.timeStampFormat,
					syncText: []
				};
				let readSyllables = false;
				while (uint8Array.length > 0) {
					const nullStr = FrameParser.readNullTerminatedString(uint8Array, syltHeader.encoding);
					uint8Array = uint8Array.subarray(nullStr.len);
					if (readSyllables) {
						this.validateTextValues(result.syncText.length + 1, "SYLT");
						const timestamp = UINT32_BE.get(uint8Array, 0);
						uint8Array = uint8Array.subarray(UINT32_BE.len);
						result.syncText.push({
							text: nullStr.text,
							timestamp
						});
					} else {
						result.descriptor = nullStr.text;
						readSyllables = true;
					}
				}
				output = result;
				break;
			}
			case "ULT":
			case "USLT":
			case "COM":
			case "COMM": {
				const textHeader = TextHeader.get(uint8Array, offset);
				offset += TextHeader.len;
				const descriptorStr = FrameParser.readNullTerminatedString(uint8Array.subarray(offset), textHeader.encoding);
				offset += descriptorStr.len;
				const textStr = FrameParser.readNullTerminatedString(uint8Array.subarray(offset), textHeader.encoding);
				output = {
					language: textHeader.language,
					descriptor: descriptorStr.text,
					text: textStr.text
				};
				break;
			}
			case "UFID": {
				const ufid = FrameParser.readIdentifierAndData(uint8Array, defaultEnc);
				output = {
					owner_identifier: ufid.id,
					identifier: ufid.data
				};
				break;
			}
			case "PRIV": {
				const priv = FrameParser.readIdentifierAndData(uint8Array, defaultEnc);
				output = {
					owner_identifier: priv.id,
					data: priv.data
				};
				break;
			}
			case "POPM": {
				uint8Array = uint8Array.subarray(offset);
				const emailStr = FrameParser.readNullTerminatedString(uint8Array, urlEnc);
				const email = emailStr.text;
				uint8Array = uint8Array.subarray(emailStr.len);
				if (uint8Array.length === 0) {
					this.warningCollector.addWarning(`id3v2.${this.major} type=${type} POPM frame missing rating byte`);
					output = {
						email,
						rating: 0,
						counter: void 0
					};
					break;
				}
				const rating = UINT8.get(uint8Array, 0);
				const counterBytes = uint8Array.subarray(UINT8.len);
				output = {
					email,
					rating,
					counter: counterBytes.length > 0 ? decodeUintBE(counterBytes) : void 0
				};
				break;
			}
			case "GEOB": {
				const encoding = TextEncodingToken.get(uint8Array, 0);
				uint8Array = uint8Array.subarray(1);
				const mimeTypeStr = FrameParser.readNullTerminatedString(uint8Array, urlEnc);
				const mimeType = mimeTypeStr.text;
				uint8Array = uint8Array.subarray(mimeTypeStr.len);
				const filenameStr = FrameParser.readNullTerminatedString(uint8Array, encoding);
				const filename = filenameStr.text;
				uint8Array = uint8Array.subarray(filenameStr.len);
				const descriptionStr = FrameParser.readNullTerminatedString(uint8Array, encoding);
				const description = descriptionStr.text;
				uint8Array = uint8Array.subarray(descriptionStr.len);
				output = {
					type: mimeType,
					filename,
					description,
					data: uint8Array
				};
				break;
			}
			case "WCOM":
			case "WCOP":
			case "WOAF":
			case "WOAR":
			case "WOAS":
			case "WORS":
			case "WPAY":
			case "WPUB":
				output = FrameParser.readNullTerminatedString(uint8Array, urlEnc).text;
				break;
			case "WXXX": {
				const encoding = TextEncodingToken.get(uint8Array, 0);
				uint8Array = uint8Array.subarray(1);
				const descriptionStr = FrameParser.readNullTerminatedString(uint8Array, encoding);
				const description = descriptionStr.text;
				uint8Array = uint8Array.subarray(descriptionStr.len);
				output = {
					description,
					url: FrameParser.trimNullPadding(decodeString(uint8Array, defaultEnc))
				};
				break;
			}
			case "WFD":
			case "WFED": {
				const encoding = TextEncodingToken.get(uint8Array, 0);
				uint8Array = uint8Array.subarray(1);
				output = FrameParser.readNullTerminatedString(uint8Array, encoding).text;
				break;
			}
			case "MCDI":
				output = uint8Array.subarray(0, length);
				break;
			case "CHAP":
				debug$26("Reading CHAP");
				fzero = uint8Array.indexOf(0);
				if (fzero < 0) throw new Id3v2ContentError("Missing CHAP element ID terminator");
				if (length - fzero - 1 < ChapterInfo.len) throw new Id3v2ContentError("Truncated CHAP header");
				output = {
					label: decodeString(uint8Array.subarray(0, fzero), defaultEnc),
					info: ChapterInfo.get(uint8Array, fzero + 1),
					frames: this.readEmbeddedFrames(uint8Array, fzero + 1 + ChapterInfo.len, includeCovers)
				};
				break;
			case "CTOC": {
				debug$26("Reading CTOC");
				const idEnd = uint8Array.indexOf(0);
				if (idEnd < 0) throw new Id3v2ContentError("Missing CTOC element ID terminator");
				if (length - idEnd - 1 < 2) throw new Id3v2ContentError("Truncated CTOC header");
				const label = decodeString(uint8Array.subarray(0, idEnd), defaultEnc);
				offset = idEnd + 1;
				const flags = UINT8.get(uint8Array, offset++);
				const topLevel = (flags & 2) !== 0;
				const ordered = (flags & 1) !== 0;
				const entryCount = UINT8.get(uint8Array, offset++);
				const childElementIds = [];
				for (let i = 0; i < entryCount; i++) {
					const end = uint8Array.indexOf(0, offset);
					if (end < 0) throw new Id3v2ContentError("Truncated CTOC child element ID");
					const childId = decodeString(uint8Array.subarray(offset, end), defaultEnc);
					childElementIds.push(childId);
					offset = end + 1;
				}
				output = {
					label,
					flags: {
						topLevel,
						ordered
					},
					childElementIds,
					frames: this.readEmbeddedFrames(uint8Array, offset, includeCovers)
				};
				break;
			}
			default: debug$26(`Warning: unsupported id3v2-tag-type: ${type}`);
		}
		return output;
	}
	readEmbeddedFrames(data, offset, includeCovers) {
		const frames = /* @__PURE__ */ new Map();
		const headerLength = getFrameHeaderLength(this.major);
		while (offset < data.length) {
			if (data.length - offset < headerLength) throw new Id3v2ContentError("Truncated embedded ID3v2 frame header");
			const frame = readFrameHeader(data.subarray(offset), this.major, this.warningCollector);
			offset += headerLength;
			if (frame.length > data.length - offset) throw new Id3v2ContentError(`Embedded ID3v2 frame ${frame.id} size ${frame.length} exceeds remaining chapter data`);
			this.validateTextValues(frames.size + 1, "Embedded frame");
			if (this.embeddedFrameDepth >= 32) throw new Id3v2ContentError("Embedded ID3v2 frame nesting exceeds limit 32");
			++this.embeddedFrameDepth;
			let value;
			try {
				value = this.readData(data.subarray(offset, offset + frame.length), frame.id, includeCovers);
			} finally {
				--this.embeddedFrameDepth;
			}
			offset += frame.length;
			frames.set(frame.id, value);
		}
		return frames;
	}
	static readNullTerminatedString(uint8Array, encoding) {
		const originalLen = uint8Array.length;
		const zeroIndex = findZero(uint8Array, encoding.encoding);
		if (zeroIndex >= originalLen) return {
			text: decodeString(uint8Array, encoding.encoding),
			len: originalLen
		};
		return {
			text: decodeString(uint8Array.subarray(0, zeroIndex), encoding.encoding),
			len: zeroIndex + FrameParser.getNullTerminatorLength(encoding.encoding)
		};
	}
	static fixPictureMimeType(pictureType) {
		pictureType = pictureType.toLocaleLowerCase();
		switch (pictureType) {
			case "jpg": return "image/jpeg";
			case "png": return "image/png";
		}
		return pictureType;
	}
	/**
	* Converts TMCL (Musician credits list) or TIPL (Involved people list)
	* @param entries
	*/
	functionList(entries) {
		const roles = /* @__PURE__ */ new Map();
		for (let i = 0; i < entries.length; i += 2) {
			const role = entries[i];
			const people = entries[i + 1];
			if (role === void 0 || people === void 0) break;
			const names = splitText(people, ",", "people-list", this.validateTextValues, { keepEmpty: true });
			roles.set(role, (roles.get(role) ?? []).concat(names));
		}
		return Object.fromEntries(roles);
	}
	/**
	* id3v2.4 defines that multiple T* values are separated by 0x00
	* id3v2.3 defines that TCOM, TEXT, TOLY, TOPE & TPE1 values are separated by /
	* (TCON/TCO genre values are NOT slash-separated in ID3v2.3)
	* @param tag - Tag name
	* @param text - Concatenated tag value
	* @param description - User text description, for legacy slash-separated list compatibility
	* @returns Split tag value
	*/
	splitValue(tag, text, description = "") {
		let values;
		if (this.major < 4) {
			values = splitText(text, "\0", tag, this.validateTextValues, { keepEmpty: true });
			if (values.length > 1) {
				if (tag !== "IPL" && tag !== "IPLS") this.warningCollector.addWarning(`ID3v2.${this.major} ${tag} uses non standard null-separator.`);
			} else if ([
				"TPE1",
				"TPE2",
				"TPE3",
				"TPE4",
				"TCOM",
				"TEXT",
				"TOLY",
				"TOPE",
				"TP1",
				"TCM",
				"TXT",
				"TOA",
				"TOL",
				"TSRC",
				"IPL",
				"IPLS"
			].includes(tag) || tag === "TXXX" && [
				"ARTISTS",
				"MUSICBRAINZ ARTIST ID",
				"MUSICBRAINZ ALBUM ARTIST ID",
				"MUSICBRAINZ ALBUM TYPE",
				"ISRC"
			].includes(description.toUpperCase())) values = splitText(text, "/", tag, this.validateTextValues, { keepEmpty: true });
		} else values = splitText(text, "\0", tag, this.validateTextValues, { keepEmpty: true });
		return FrameParser.trimArray(values);
	}
	static trimArray(values) {
		return values.map((value) => FrameParser.trimNullPadding(value).trim());
	}
	static trimNullPadding(value) {
		let end = value.length;
		while (end > 0 && value.charCodeAt(end - 1) === 0) end--;
		return end === value.length ? value : value.slice(0, end);
	}
	static readIdentifierAndData(uint8Array, encoding) {
		const idStr = FrameParser.readNullTerminatedString(uint8Array, {
			encoding,
			bom: false
		});
		return {
			id: idStr.text,
			data: uint8Array.subarray(idStr.len)
		};
	}
	static getNullTerminatorLength(enc) {
		return enc.startsWith("utf-16") ? 2 : 1;
	}
};
var Id3v2ContentError = class extends makeUnexpectedFileContentError("id3v2") {};
function makeUnexpectedMajorVersionError$1(majorVer) {
	throw new Id3v2ContentError(`Unexpected majorVer: ${majorVer}`);
}
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v2Parser.js
var ID3v2Parser = class ID3v2Parser {
	static removeUnsyncBytes(buffer) {
		let readI = 0;
		let writeI = 0;
		while (readI < buffer.length - 1) {
			if (readI !== writeI) buffer[writeI] = buffer[readI];
			readI += buffer[readI] === 255 && buffer[readI + 1] === 0 ? 2 : 1;
			writeI++;
		}
		if (readI < buffer.length) buffer[writeI++] = buffer[readI];
		return buffer.subarray(0, writeI);
	}
	static readFrameData(uint8Array, frameHeader, majorVer, includeCovers, warningCollector, maxEntries) {
		const frameParser = new FrameParser(majorVer, warningCollector, maxEntries);
		switch (majorVer) {
			case 2: return frameParser.readData(uint8Array, frameHeader.id, includeCovers);
			case 3:
			case 4:
				if (frameHeader.flags?.format.unsynchronisation) uint8Array = ID3v2Parser.removeUnsyncBytes(uint8Array);
				if (frameHeader.flags?.format.data_length_indicator) uint8Array = uint8Array.subarray(4, uint8Array.length);
				return frameParser.readData(uint8Array, frameHeader.id, includeCovers);
			default: throw makeUnexpectedMajorVersionError(majorVer);
		}
	}
	/**
	* Create a combined tag key, of tag & description
	* @param tag e.g.: COM
	* @param description e.g. iTunPGAP
	* @returns string e.g. COM:iTunPGAP
	*/
	static makeDescriptionTagName(tag, description) {
		return tag + (description ? `:${description}` : "");
	}
	tokenizer = void 0;
	id3Header = void 0;
	metadata = void 0;
	headerType = void 0;
	options = void 0;
	async parse(metadata, tokenizer, options) {
		this.tokenizer = tokenizer;
		this.metadata = metadata;
		this.options = options;
		const id3Header = await this.tokenizer.readToken(ID3v2Header);
		if (id3Header.fileIdentifier !== "ID3") throw new Id3v2ContentError("expected ID3-header file-identifier 'ID3' was not found");
		const fileSize = this.tokenizer.fileInfo.size;
		if (fileSize !== void 0) {
			const remainingBytes = fileSize - this.tokenizer.position;
			if (id3Header.size > remainingBytes) throw new Id3v2ContentError(`ID3v2 tag size ${id3Header.size} exceeds remaining file size ${remainingBytes}`);
		}
		this.id3Header = id3Header;
		this.headerType = `ID3v2.${id3Header.version.major}`;
		await this.parseId3Data(id3Header.size);
		const chapters = this.mapId3v2Chapters(this.metadata.native[this.headerType]);
		this.metadata.setFormat("chapters", chapters);
	}
	getExtendedHeaderSize(data) {
		if (data.length < UINT32_BE.len) throw new Id3v2ContentError("ID3v2 extended header size field exceeds tag boundary");
		const extendedHeaderSize = this.id3Header.version.major === 4 ? UINT32SYNCSAFE.get(data, 0) : UINT32_BE.get(data, 0) + 4;
		if (extendedHeaderSize < (this.id3Header.version.major === 4 ? 6 : 10) || extendedHeaderSize > data.length) throw new Id3v2ContentError(`Invalid ID3v2 extended header size: ${extendedHeaderSize}`);
		return extendedHeaderSize;
	}
	async parseId3Data(dataLen) {
		let uint8Array = await readBuffer(this.tokenizer, dataLen, this.options, void 0, (message) => new Id3v2ContentError(message));
		if (this.id3Header.flags.unsynchronisation && this.id3Header.version.major < 4) uint8Array = ID3v2Parser.removeUnsyncBytes(uint8Array);
		if (this.id3Header.flags.isExtendedHeader) uint8Array = uint8Array.subarray(this.getExtendedHeaderSize(uint8Array));
		const tags = this.parseMetadata(uint8Array);
		for (const tag of tags) switch (tag.id) {
			case "TXXX":
				if (tag.value) await this.handleTag(tag, tag.value.text, () => tag.value.description);
				break;
			default: await (Array.isArray(tag.value) ? Promise.all(tag.value.map((value) => this.addTag(tag.id, value))) : this.addTag(tag.id, tag.value));
		}
		if (this.id3Header.version.major === 3) await this.mapRecordingDate(tags);
	}
	async mapRecordingDate(tags) {
		const text = (id) => tags.findLast((tag) => tag.id === id && tag.value.at(-1))?.value?.at(-1);
		const discogs = tags.findLast((tag) => tag.id === "TXXX" && tag.value.description.toUpperCase() === "DISCOGS_RELEASED" && tag.value.text.at(-1));
		const explicit = text("TDRC") ?? text("TDRV") ?? discogs?.value?.text.at(-1);
		if (explicit) {
			await this.metadata.postMap(this.headerType, {
				id: "date",
				value: explicit
			});
			return;
		}
		const year = text("TYER");
		if (!year || !/^\d{4}$/.test(year)) return;
		let date = year;
		const dayMonth = text("TDAT");
		if (dayMonth && /^\d{4}$/.test(dayMonth)) {
			const day = Number(dayMonth.slice(0, 2));
			const month = Number(dayMonth.slice(2));
			const y = Number(year);
			const daysInMonth = [
				31,
				y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28,
				31,
				30,
				31,
				30,
				31,
				31,
				30,
				31,
				30,
				31
			];
			if (day >= 1 && day <= daysInMonth[month - 1]) {
				date += `-${dayMonth.slice(2)}-${dayMonth.slice(0, 2)}`;
				const time = text("TIME");
				if (time && /^([01]\d|2[0-3])[0-5]\d$/.test(time)) date += `T${time.slice(0, 2)}:${time.slice(2)}`;
			}
		}
		await this.metadata.postMap(this.headerType, {
			id: "date",
			value: date
		});
	}
	async handleTag(tag, values, descriptor, resolveValue = (value) => value) {
		await Promise.all(values.map((value) => this.addTag(ID3v2Parser.makeDescriptionTagName(tag.id, descriptor(value)), resolveValue(value))));
	}
	async addTag(id, value) {
		await this.metadata.addTag(this.headerType, id, value);
	}
	parseMetadata(data) {
		let offset = 0;
		let frameCount = 0;
		const tags = [];
		while (true) {
			if (offset === data.length) break;
			if (data[offset] === 0) {
				if (data.subarray(offset).some((byte) => byte !== 0)) this.metadata.addWarning("Non-zero bytes found in ID3v2 padding");
				break;
			}
			const frameHeaderLength = getFrameHeaderLength(this.id3Header.version.major);
			if (offset + frameHeaderLength > data.length) {
				this.metadata.addWarning("Illegal ID3v2 tag length");
				break;
			}
			const frameHeaderBytes = data.subarray(offset, offset + frameHeaderLength);
			offset += frameHeaderLength;
			const frameHeader = readFrameHeader(frameHeaderBytes, this.id3Header.version.major, this.metadata);
			if (++frameCount > getMaxMetadataEntries(this.options)) throw new Id3v2ContentError("Frame count exceeds entry limit");
			const frameDataBytes = data.subarray(offset, offset + frameHeader.length);
			offset += frameHeader.length;
			const values = ID3v2Parser.readFrameData(frameDataBytes, frameHeader, this.id3Header.version.major, !this.options.skipCovers, this.metadata, getMaxMetadataEntries(this.options));
			if (values) tags.push({
				id: frameHeader.id,
				value: values
			});
		}
		return tags;
	}
	/**
	* Convert parsed ID3v2 chapter frames (CHAP / CTOC) to generic `format.chapters`.
	*
	* This function expects the `native` tags already to contain parsed `CHAP` and `CTOC` frame values,
	* as produced by `FrameParser.readData`.
	*/
	mapId3v2Chapters(id3Tags) {
		if (!id3Tags) return;
		const chapFrames = id3Tags.filter((t) => t.id === "CHAP").map((t) => t.value);
		if (!chapFrames.length) return;
		const topLevelToc = id3Tags.filter((t) => t.id === "CTOC").map((t) => t.value).find((t) => t.flags.topLevel);
		const chapterById = /* @__PURE__ */ new Map();
		for (const chap of chapFrames) chapterById.set(chap.label, chap);
		const orderedIds = topLevelToc?.childElementIds;
		const chapters = [];
		const maxChapterCount = getMaxChapterCount(this.options);
		const source = orderedIds ?? [...chapterById.keys()].sort((left, right) => (chapterById.get(left)?.info.startTime ?? 0) - (chapterById.get(right)?.info.startTime ?? 0));
		for (const id of source) {
			const chap = chapterById.get(id);
			if (!chap) continue;
			const frames = chap.frames;
			const title = frames.get("TIT2") ?? "";
			if (chapters.length >= maxChapterCount) {
				this.metadata.addWarning(`Chapter count exceeds the ${maxChapterCount} chapter limit`);
				break;
			}
			chapters.push({
				id,
				title,
				url: frames.get("WXXX"),
				start: chap.info.startTime / 1e3,
				end: chap.info.endTime / 1e3,
				image: frames.get("APIC")
			});
		}
		return chapters.length ? chapters : void 0;
	}
};
function makeUnexpectedMajorVersionError(majorVer) {
	throw new Id3v2ContentError(`Unexpected majorVer: ${majorVer}`);
}
//#endregion
//#region node_modules/music-metadata/lib/id3v2/EmbeddedID3v2.js
/** Borrow the chunk payload; consume its remainder while leaving container padding to the caller. */
async function parseEmbeddedID3v2(metadata, tokenizer, options, size) {
	validateAllocation(size, options);
	if (size < ID3v2Header.len || tokenizer.fileInfo.size !== void 0 && size > tokenizer.fileInfo.size - tokenizer.position) throw new EndOfStreamError();
	const embeddedTokenizer = createTokenizerView(tokenizer, size);
	try {
		await new ID3v2Parser().parse(metadata, embeddedTokenizer, options);
		await embeddedTokenizer.consumeRemainder();
	} catch (error) {
		if (error instanceof TokenizerBoundaryError) throw new Id3v2ContentError(`Embedded ID3v2 read exceeds chunk boundary: ${error.message}`);
		throw error;
	} finally {
		await embeddedTokenizer.close();
	}
}
//#endregion
//#region node_modules/music-metadata/lib/iff/index.js
/**
* Common AIFF chunk header
*/
var Header$4 = {
	len: 8,
	get: (buf, off) => {
		return {
			chunkID: FourCcToken.get(buf, off),
			chunkSize: Number(BigInt(UINT32_BE.get(buf, off + 4)))
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/aiff/AiffToken.js
var compressionTypes = {
	ima4: "IMA4 ADPCM",
	NONE: "not compressed	PCM	Apple Computer",
	sowt: "PCM (byte swapped)",
	fl32: "32-bit floating point IEEE 32-bit float",
	fl64: "64-bit floating point IEEE 64-bit float	Apple Computer",
	alaw: "ALaw 2:1	8-bit ITU-T G.711 A-law",
	ulaw: "µLaw 2:1	8-bit ITU-T G.711 µ-law	Apple Computer",
	ULAW: "CCITT G.711 u-law 8-bit ITU-T G.711 µ-law",
	ALAW: "CCITT G.711 A-law 8-bit ITU-T G.711 A-law",
	FL32: "Float 32	IEEE 32-bit float "
};
var AiffContentError = class extends makeUnexpectedFileContentError("AIFF") {};
/** The fixed fields preceding sound samples and optional alignment bytes in SSND. */
var SoundDataHeader = {
	len: 8,
	get: (buf, off) => ({
		offset: UINT32_BE.get(buf, off),
		blockSize: UINT32_BE.get(buf, off + 4)
	})
};
var Common = class {
	len;
	isAifc;
	constructor(header, isAifc) {
		this.isAifc = isAifc;
		const minimumChunkSize = isAifc ? 22 : 18;
		if (header.chunkSize < minimumChunkSize) throw new AiffContentError(`COMMON CHUNK size should always be at least ${minimumChunkSize}`);
		this.len = header.chunkSize;
	}
	get(buf, off) {
		const shift = UINT16_BE.get(buf, off + 8) - 16398;
		const baseSampleRate = UINT16_BE.get(buf, off + 8 + 2);
		const res = {
			numChannels: UINT16_BE.get(buf, off),
			numSampleFrames: UINT32_BE.get(buf, off + 2),
			sampleSize: UINT16_BE.get(buf, off + 6),
			sampleRate: shift < 0 ? baseSampleRate >> Math.abs(shift) : baseSampleRate << shift
		};
		if (this.isAifc) {
			res.compressionType = FourCcToken.get(buf, off + 18);
			if (this.len > 22) {
				const strLen = UINT8.get(buf, off + 22);
				if (strLen > 0) {
					const padding = (strLen + 1) % 2;
					if (23 + strLen + padding === this.len) res.compressionName = new StringType(strLen, "latin1").get(buf, off + 23);
					else throw new AiffContentError("Illegal pstring length");
				} else res.compressionName = void 0;
			}
		} else res.compressionName = "PCM";
		return res;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/aiff/AiffParser.js
var AiffParser_exports = /* @__PURE__ */ __exportAll({ AIFFParser: () => AIFFParser });
var debug$25 = (0, import_src.default)("music-metadata:parser:aiff");
/**
* AIFF - Audio Interchange File Format
*
* Ref:
* - http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html
* - http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-1.3.pdf
*/
var AIFFParser = class extends BasicParser {
	isCompressed = null;
	soundDataBytes;
	soundDataComplete = false;
	common;
	async parse() {
		const header = await this.readToken(Header$4);
		if (header.chunkID !== "FORM") throw new AiffContentError("Invalid Chunk-ID, expected 'FORM'");
		const type = await this.readToken(FourCcToken);
		switch (type) {
			case "AIFF":
				this.metadata.setFormat("container", type);
				this.isCompressed = false;
				break;
			case "AIFC":
				this.metadata.setFormat("container", "AIFF-C");
				this.isCompressed = true;
				break;
			default: throw new AiffContentError(`Unsupported AIFF type: ${type}`);
		}
		this.metadata.setFormat("lossless", !this.isCompressed);
		this.metadata.setAudioOnly();
		let remaining = header.chunkSize - FourCcToken.len;
		if (remaining < 0) throw new AiffContentError(`Invalid FORM chunk size: ${header.chunkSize}`);
		try {
			while (remaining >= Header$4.len) {
				debug$25(`Reading AIFF chunk at offset=${this.tokenizer.position}`);
				const chunkHeader = await this.readToken(Header$4);
				remaining -= Header$4.len;
				const available = this.tokenizer.fileInfo.size;
				if (chunkHeader.chunkSize > remaining || available !== void 0 && chunkHeader.chunkSize > available - this.tokenizer.position) throw new AiffContentError(`Chunk ${chunkHeader.chunkID} size ${chunkHeader.chunkSize} exceeds remaining FORM data`);
				const nextChunk = 2 * Math.round(chunkHeader.chunkSize / 2);
				const bytesRead = await this.readData(chunkHeader);
				const ignored = await this.tokenizer.ignore(nextChunk - bytesRead);
				if (chunkHeader.chunkID === "SSND") this.soundDataComplete = ignored === nextChunk - bytesRead;
				remaining -= nextChunk;
			}
		} catch (err) {
			if (err instanceof EndOfStreamError) debug$25("End-of-stream");
			else throw err;
		}
		const common = this.common;
		if (common?.compressionType === "ima4" && common.numChannels > 0 && common.numSampleFrames > 0 && common.sampleRate > 0 && this.soundDataComplete && this.soundDataBytes === common.numSampleFrames * common.numChannels * 34) {
			const samples = common.numSampleFrames * 64;
			this.metadata.setFormat("numberOfSamples", samples);
			this.metadata.setFormat("duration", samples / common.sampleRate);
		}
		const duration = this.metadata.format.duration;
		if (this.soundDataBytes !== void 0 && duration !== void 0 && Number.isFinite(duration) && duration > 0) this.metadata.setFormat("bitrate", 8 * this.soundDataBytes / duration);
	}
	async readData(header) {
		switch (header.chunkID) {
			case "COMM": {
				if (this.isCompressed === null) throw new AiffContentError("Failed to parse AIFF.COMM chunk when compression type is unknown");
				const common = await this.readToken(new Common(header, this.isCompressed));
				this.common = common;
				this.metadata.setFormat("bitsPerSample", common.sampleSize);
				this.metadata.setFormat("sampleRate", common.sampleRate);
				this.metadata.setFormat("numberOfChannels", common.numChannels);
				this.metadata.setFormat("numberOfSamples", common.numSampleFrames);
				this.metadata.setFormat("duration", common.numSampleFrames / common.sampleRate);
				if (common.compressionName || common.compressionType) this.metadata.setFormat("codec", common.compressionName ?? compressionTypes[common.compressionType]);
				return header.chunkSize;
			}
			case "ID3 ":
				await parseEmbeddedID3v2(this.metadata, this.tokenizer, this.options, header.chunkSize);
				return header.chunkSize;
			case "SSND": {
				this.soundDataComplete = false;
				if (header.chunkSize < SoundDataHeader.len) throw new AiffContentError("SSND chunk is too small to contain its header");
				const sound = await this.readToken(SoundDataHeader);
				const payloadSize = header.chunkSize - SoundDataHeader.len;
				if (sound.offset > payloadSize) throw new AiffContentError("SSND alignment offset exceeds its payload size");
				this.soundDataBytes = payloadSize - sound.offset;
				return SoundDataHeader.len;
			}
			case "NAME":
			case "AUTH":
			case "(c) ":
			case "ANNO": return this.readTextChunk(header);
			default:
				debug$25(`Ignore chunk id=${header.chunkID}, size=${header.chunkSize}`);
				return 0;
		}
	}
	async readTextChunk(header) {
		const value = await this.readToken(new StringType(header.chunkSize, "ascii"));
		let valueCount = 1;
		for (let offset = value.indexOf("\0"); offset >= 0; offset = value.indexOf("\0", offset + 1)) ++valueCount;
		if (valueCount > getMaxMetadataEntries(this.options)) throw new AiffContentError(`Text value count ${valueCount} exceeds entry limit ${getMaxMetadataEntries(this.options)}`);
		const values = value.split("\0").map((v) => v.trim()).filter((v) => v?.length);
		await Promise.all(values.map((v) => this.metadata.addTag("AIFF", header.chunkID, v)));
		return header.chunkSize;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/type.js
/** Container-independent track types. Existing Matroska values are preserved. */
var TrackType = {
	video: 1,
	audio: 2,
	complex: 3,
	logo: 4,
	subtitle: 17,
	button: 18,
	control: 32,
	/** Timed metadata (library extension to the Matroska track types). */
	metadata: 33
};
var TrackTypeValueToKeyMap = {
	[TrackType.video]: "video",
	[TrackType.audio]: "audio",
	[TrackType.complex]: "complex",
	[TrackType.logo]: "logo",
	[TrackType.subtitle]: "subtitle",
	[TrackType.button]: "button",
	[TrackType.control]: "control",
	[TrackType.metadata]: "metadata"
};
//#endregion
//#region node_modules/win-guid/lib/guid.js
/**
* Parse canonical GUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
* into Windows / CFBF byte order.
*/
function parseWindowsGuid(guid) {
	let s = guid.trim();
	if (s.length !== 36 || s[8] !== "-" || s[13] !== "-" || s[18] !== "-" || s[23] !== "-") throw new Error(`Invalid GUID format: ${guid}`);
	let v;
	const out = /* @__PURE__ */ new Uint8Array(16);
	v = parseInt(s.slice(0, 8), 16);
	out[0] = v & 255;
	out[1] = v >>> 8 & 255;
	out[2] = v >>> 16 & 255;
	out[3] = v >>> 24 & 255;
	v = parseInt(s.slice(9, 13), 16);
	out[4] = v & 255;
	out[5] = v >>> 8 & 255;
	v = parseInt(s.slice(14, 18), 16);
	out[6] = v & 255;
	out[7] = v >>> 8 & 255;
	v = parseInt(s.slice(19, 23), 16);
	out[8] = v >>> 8 & 255;
	out[9] = v & 255;
	v = parseInt(s.slice(24, 32), 16);
	out[10] = v >>> 24 & 255;
	out[11] = v >>> 16 & 255;
	out[12] = v >>> 8 & 255;
	out[13] = v & 255;
	v = parseInt(s.slice(32, 36), 16);
	out[14] = v >>> 8 & 255;
	out[15] = v & 255;
	for (let i = 0; i < 16; i++) if (!Number.isFinite(out[i])) throw new Error(`Invalid GUID format: ${guid}`);
	if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) throw new Error(`Invalid GUID format: ${guid}`);
	return out;
}
var Guid = class Guid {
	constructor(bytes) {
		if (bytes.length !== 16) throw new Error("GUID must be exactly 16 bytes");
		this.bytes = bytes;
	}
	static fromString(guid) {
		return new Guid(parseWindowsGuid(guid));
	}
	/**
	* Convert Windows / CFBF byte order into canonical GUID string:
	* xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
	*/
	toString() {
		const b = this.bytes;
		const hx = (n) => n.toString(16).padStart(2, "0");
		return `${hx(b[3]) + hx(b[2]) + hx(b[1]) + hx(b[0])}-${hx(b[5]) + hx(b[4])}-${hx(b[7]) + hx(b[6])}-${hx(b[8]) + hx(b[9])}-${hx(b[10]) + hx(b[11]) + hx(b[12]) + hx(b[13]) + hx(b[14]) + hx(b[15])}`.toUpperCase();
	}
	/**
	* Compare against a Uint8Array containing GUID bytes
	* in Windows / CFBF layout.
	*/
	equals(buf, offset = 0) {
		if (offset < 0 || buf.length - offset < 16) return false;
		const a = this.bytes;
		for (let i = 0; i < 16; i++) if (buf[offset + i] !== a[i]) return false;
		return true;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfGuid.js
/**
* Ref:
* - https://tools.ietf.org/html/draft-fleischman-asf-01, Appendix A: ASF GUIDs
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/index.html
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
*
* ASF File Structure:
* - https://msdn.microsoft.com/en-us/library/windows/desktop/ee663575(v=vs.85).aspx
*
* ASF GUIDs:
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
* - https://github.com/dji-sdk/FFmpeg/blob/master/libavformat/asf.c
*/
var AsfGuid = class AsfGuid {
	static HeaderObject = new AsfGuid("75B22630-668E-11CF-A6D9-00AA0062CE6C");
	static DataObject = new AsfGuid("75B22636-668E-11CF-A6D9-00AA0062CE6C");
	static SimpleIndexObject = new AsfGuid("33000890-E5B1-11CF-89F4-00A0C90349CB");
	static IndexObject = new AsfGuid("D6E229D3-35DA-11D1-9034-00A0C90349BE");
	static MediaObjectIndexObject = new AsfGuid("FEB103F8-12AD-4C64-840F-2A1D2F7AD48C");
	static TimecodeIndexObject = new AsfGuid("3CB73FD0-0C4A-4803-953D-EDF7B6228F0C");
	static FilePropertiesObject = new AsfGuid("8CABDCA1-A947-11CF-8EE4-00C00C205365");
	static StreamPropertiesObject = new AsfGuid("B7DC0791-A9B7-11CF-8EE6-00C00C205365");
	static HeaderExtensionObject = new AsfGuid("5FBF03B5-A92E-11CF-8EE3-00C00C205365");
	static CodecListObject = new AsfGuid("86D15240-311D-11D0-A3A4-00A0C90348F6");
	static ScriptCommandObject = new AsfGuid("1EFB1A30-0B62-11D0-A39B-00A0C90348F6");
	static MarkerObject = new AsfGuid("F487CD01-A951-11CF-8EE6-00C00C205365");
	static BitrateMutualExclusionObject = new AsfGuid("D6E229DC-35DA-11D1-9034-00A0C90349BE");
	static ErrorCorrectionObject = new AsfGuid("75B22635-668E-11CF-A6D9-00AA0062CE6C");
	static ContentDescriptionObject = new AsfGuid("75B22633-668E-11CF-A6D9-00AA0062CE6C");
	static ExtendedContentDescriptionObject = new AsfGuid("D2D0A440-E307-11D2-97F0-00A0C95EA850");
	static ContentBrandingObject = new AsfGuid("2211B3FA-BD23-11D2-B4B7-00A0C955FC6E");
	static StreamBitratePropertiesObject = new AsfGuid("7BF875CE-468D-11D1-8D82-006097C9A2B2");
	static ContentEncryptionObject = new AsfGuid("2211B3FB-BD23-11D2-B4B7-00A0C955FC6E");
	static ExtendedContentEncryptionObject = new AsfGuid("298AE614-2622-4C17-B935-DAE07EE9289C");
	static DigitalSignatureObject = new AsfGuid("2211B3FC-BD23-11D2-B4B7-00A0C955FC6E");
	static PaddingObject = new AsfGuid("1806D474-CADF-4509-A4BA-9AABCB96AAE8");
	static ExtendedStreamPropertiesObject = new AsfGuid("14E6A5CB-C672-4332-8399-A96952065B5A");
	static AdvancedMutualExclusionObject = new AsfGuid("A08649CF-4775-4670-8A16-6E35357566CD");
	static GroupMutualExclusionObject = new AsfGuid("D1465A40-5A79-4338-B71B-E36B8FD6C249");
	static StreamPrioritizationObject = new AsfGuid("D4FED15B-88D3-454F-81F0-ED5C45999E24");
	static BandwidthSharingObject = new AsfGuid("A69609E6-517B-11D2-B6AF-00C04FD908E9");
	static LanguageListObject = new AsfGuid("7C4346A9-EFE0-4BFC-B229-393EDE415C85");
	static MetadataObject = new AsfGuid("C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA");
	static MetadataLibraryObject = new AsfGuid("44231C94-9498-49D1-A141-1D134E457054");
	static IndexParametersObject = new AsfGuid("D6E229DF-35DA-11D1-9034-00A0C90349BE");
	static MediaObjectIndexParametersObject = new AsfGuid("6B203BAD-3F11-48E4-ACA8-D7613DE2CFA7");
	static TimecodeIndexParametersObject = new AsfGuid("F55E496D-9797-4B5D-8C8B-604DFE9BFB24");
	static CompatibilityObject = new AsfGuid("26F18B5D-4584-47EC-9F5F-0E651F0452C9");
	static AdvancedContentEncryptionObject = new AsfGuid("43058533-6981-49E6-9B74-AD12CB86D58C");
	static AudioMedia = new AsfGuid("F8699E40-5B4D-11CF-A8FD-00805F5C442B");
	static VideoMedia = new AsfGuid("BC19EFC0-5B4D-11CF-A8FD-00805F5C442B");
	static CommandMedia = new AsfGuid("59DACFC0-59E6-11D0-A3AC-00A0C90348F6");
	static JFIF_Media = new AsfGuid("B61BE100-5B4E-11CF-A8FD-00805F5C442B");
	static Degradable_JPEG_Media = new AsfGuid("35907DE0-E415-11CF-A917-00805F5C442B");
	static FileTransferMedia = new AsfGuid("91BD222C-F21C-497A-8B6D-5AA86BFC0185");
	static BinaryMedia = new AsfGuid("3AFB65E2-47EF-40F2-AC2C-70A90D71D343");
	static ASF_Index_Placeholder_Object = new AsfGuid("D9AADE20-7C17-4F9C-BC28-8555DD98E2A2");
	static fromBin(bin, offset = 0) {
		return new AsfGuid(AsfGuid.decode(bin, offset));
	}
	/**
	* Decode GUID in format like "B503BF5F-2EA9-CF11-8EE3-00C00C205365"
	* @param objectId Binary GUID
	* @param offset Read offset in bytes, default 0
	* @returns GUID as dashed hexadecimal representation
	*/
	static decode(objectId, offset = 0) {
		return new Guid(objectId.subarray(offset, offset + 16)).toString();
	}
	/**
	* Decode stream type
	* @param mediaType Media type GUID
	* @returns Media type
	*/
	static decodeMediaType(mediaType) {
		switch (mediaType.str) {
			case AsfGuid.AudioMedia.str: return "audio";
			case AsfGuid.VideoMedia.str: return "video";
			case AsfGuid.CommandMedia.str: return "command";
			case AsfGuid.Degradable_JPEG_Media.str: return "degradable-jpeg";
			case AsfGuid.FileTransferMedia.str: return "file-transfer";
			case AsfGuid.BinaryMedia.str: return "binary";
		}
	}
	/**
	* Encode GUID
	* @param guid GUID like: "B503BF5F-2EA9-CF11-8EE3-00C00C205365"
	* @returns Encoded Binary GUID
	*/
	static encode(guid) {
		return parseWindowsGuid(guid);
	}
	str;
	constructor(str) {
		this.str = str;
	}
	equals(guid) {
		return this.str === guid.str;
	}
	toBin() {
		return AsfGuid.encode(this.str);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfUtil.js
function getParserForAttr(i) {
	return attributeParsers[i];
}
function parseUnicodeAttr(uint8Array) {
	return stripNulls(decodeString(uint8Array, "utf-16le"));
}
var attributeParsers = [
	parseUnicodeAttr,
	parseByteArrayAttr,
	parseBoolAttr,
	parseDWordAttr,
	parseQWordAttr,
	parseWordAttr,
	parseByteArrayAttr
];
function parseByteArrayAttr(buf) {
	return new Uint8Array(buf);
}
function parseBoolAttr(buf, offset = 0) {
	return parseWordAttr(buf, offset) === 1;
}
function parseDWordAttr(buf, offset = 0) {
	return UINT32_LE.get(buf, offset);
}
function parseQWordAttr(buf, offset = 0) {
	return UINT64_LE.get(buf, offset);
}
function parseWordAttr(buf, offset = 0) {
	return UINT16_LE.get(buf, offset);
}
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfObject.js
var AsfContentParseError = class extends makeUnexpectedFileContentError("ASF") {};
/** Synchronous reads restricted to one declared ASF object payload. */
var ByteCursor = class {
	context;
	data;
	position = 0;
	constructor(buf, off, length, context) {
		this.context = context;
		if (off < 0 || length < 0 || length > buf.length - off) throw new AsfContentParseError(`Truncated ${context}`);
		this.data = buf.subarray(off, off + length);
	}
	get remaining() {
		return this.data.length - this.position;
	}
	require(length, message = `Truncated ${this.context}`) {
		if (length > this.remaining) throw new AsfContentParseError(message);
	}
	read(token) {
		this.require(token.len);
		const value = token.get(this.data, this.position);
		this.position += token.len;
		return value;
	}
	bytes(length, message) {
		this.require(length, message);
		const start = this.position;
		this.position += length;
		return this.data.subarray(start, this.position);
	}
};
/**
* Data Type: Specifies the type of information being stored. The following values are recognized.
*/
var DataType$1 = {
	/**
	* Unicode string. The data consists of a sequence of Unicode characters.
	*/
	UnicodeString: 0,
	/**
	* BYTE array. The type of data is implementation-specific.
	*/
	ByteArray: 1,
	/**
	* BOOL. The data is 2 bytes long and should be interpreted as a 16-bit unsigned integer. Only 0x0000 or 0x0001 are permitted values.
	*/
	Bool: 2,
	/**
	* DWORD. The data is 4 bytes long and should be interpreted as a 32-bit unsigned integer.
	*/
	DWord: 3,
	/**
	* QWORD. The data is 8 bytes long and should be interpreted as a 64-bit unsigned integer.
	*/
	QWord: 4,
	/**
	* WORD. The data is 2 bytes long and should be interpreted as a 16-bit unsigned integer.
	*/
	Word: 5
};
/**
* Token for: 3. ASF top-level Header Object
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3
*/
var TopLevelHeaderObjectToken = {
	len: 30,
	get: (buf, off) => {
		const base = HeaderObjectToken.get(buf, off);
		if (base.objectSize < TopLevelHeaderObjectToken.len) throw new AsfContentParseError(`Invalid ASF top-level header object size: ${base.objectSize}`);
		return {
			...base,
			numberOfHeaderObjects: UINT32_LE.get(buf, off + 24)
		};
	}
};
/**
* Token for: 3.1 Header Object (mandatory, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_1
*/
var HeaderObjectToken = {
	len: 24,
	get: (buf, off) => {
		const objectSize = UINT64_LE.get(buf, off + 16);
		if (objectSize < BigInt(HeaderObjectToken.len) || objectSize > BigInt(Number.MAX_SAFE_INTEGER)) throw new AsfContentParseError(`Invalid ASF header object size: ${objectSize}`);
		return {
			objectId: AsfGuid.fromBin(buf, off),
			objectSize: Number(objectSize)
		};
	}
};
var State = class {
	len;
	constructor(header) {
		this.len = header.objectSize - HeaderObjectToken.len;
	}
	postProcessTag(tags, name, valueType, data) {
		if (name === "WM/Picture") tags.push({
			id: name,
			value: WmPictureToken.fromBuffer(data)
		});
		else {
			const parseAttr = getParserForAttr(valueType);
			if (!parseAttr) throw new AsfContentParseError(`unexpected value headerType: ${valueType}`);
			const buffer = data;
			const minimumLength = valueType === DataType$1.QWord ? 8 : valueType === DataType$1.DWord ? 4 : valueType === DataType$1.Bool || valueType === DataType$1.Word ? 2 : 0;
			if (buffer.length < minimumLength) throw new AsfContentParseError(`Truncated ASF attribute ${name} of type ${valueType}`);
			tags.push({
				id: name,
				value: parseAttr(buffer)
			});
		}
	}
};
/**
* Token for: 3.2: File Properties Object (mandatory, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_2
*/
var FilePropertiesObject = class extends State {
	static guid = AsfGuid.FilePropertiesObject;
	get(buf, off) {
		const flags = UINT32_LE.get(buf, off + 64);
		return {
			fileId: AsfGuid.fromBin(buf, off),
			fileSize: UINT64_LE.get(buf, off + 16),
			creationDate: UINT64_LE.get(buf, off + 24),
			dataPacketsCount: UINT64_LE.get(buf, off + 32),
			playDuration: UINT64_LE.get(buf, off + 40),
			sendDuration: UINT64_LE.get(buf, off + 48),
			preroll: UINT64_LE.get(buf, off + 56),
			flags: {
				broadcast: (flags & 1) !== 0,
				seekable: (flags & 2) !== 0
			},
			minimumDataPacketSize: UINT32_LE.get(buf, off + 68),
			maximumDataPacketSize: UINT32_LE.get(buf, off + 72),
			maximumBitrate: UINT32_LE.get(buf, off + 76)
		};
	}
};
/**
* Token for: 3.3 Stream Properties Object (mandatory, one per stream)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_3
*/
var StreamPropertiesObject = class extends State {
	static guid = AsfGuid.StreamPropertiesObject;
	get(buf, off) {
		const available = Math.min(this.len, buf.length - off);
		if (available < 54) throw new AsfContentParseError("Truncated Stream Properties Object");
		const typeSpecificSize = UINT32_LE.get(buf, off + 40);
		if (typeSpecificSize + UINT32_LE.get(buf, off + 44) > available - 54) throw new AsfContentParseError("ASF stream data exceeds Stream Properties Object payload");
		const result = {
			streamType: AsfGuid.decodeMediaType(AsfGuid.fromBin(buf, off)),
			errorCorrectionType: AsfGuid.fromBin(buf, off + 16),
			streamNumber: UINT16_LE.get(buf, off + 48) & 127
		};
		const data = off + 54;
		if (result.streamType === "audio" && typeSpecificSize >= 16) {
			result.codecId = `0x${UINT16_LE.get(buf, data).toString(16).padStart(4, "0")}`;
			result.audio = {
				channels: UINT16_LE.get(buf, data + 2),
				samplingFrequency: UINT32_LE.get(buf, data + 4)
			};
			const bitDepth = UINT16_LE.get(buf, data + 14);
			if (bitDepth > 0) result.audio.bitDepth = bitDepth;
			const bytesPerSecond = UINT32_LE.get(buf, data + 8);
			if (bytesPerSecond > 0) result.bitrate = bytesPerSecond * 8;
		} else if (result.streamType === "video" && typeSpecificSize >= 11) {
			result.video = {
				pixelWidth: UINT32_LE.get(buf, data),
				pixelHeight: UINT32_LE.get(buf, data + 4)
			};
			const formatSize = UINT16_LE.get(buf, data + 9);
			if (formatSize > typeSpecificSize - 11) throw new AsfContentParseError("ASF video format data exceeds stream data");
			if (formatSize >= 20) result.codecId = new StringType(4, "ascii").get(buf, data + 27);
		}
		return result;
	}
};
/**
* 3.4: Header Extension Object (mandatory, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_4
*/
var HeaderExtensionObject = class {
	static guid = AsfGuid.HeaderExtensionObject;
	len;
	constructor() {
		this.len = 22;
	}
	get(buf, off) {
		if (off < 0 || this.len > buf.length - off) throw new AsfContentParseError("Truncated Header Extension Object");
		const view = new DataView(buf.buffer, buf.byteOffset + off, this.len);
		return {
			reserved1: AsfGuid.fromBin(buf, off),
			reserved2: view.getUint16(16, true),
			extensionDataSize: view.getUint32(18, true)
		};
	}
};
/**
* 3.5: The Codec List Object provides user-friendly information about the codecs and formats used to encode the content found in the ASF file.
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_5
*/
var CodecListObjectHeader = {
	len: 20,
	get: (buf, off) => {
		return { entryCount: new DataView(buf.buffer, off).getUint16(16, true) };
	}
};
async function readString(reader) {
	const length = await reader.readNumber(UINT16_LE);
	return (await reader.readToken(new StringType(length * 2, "utf-16le"))).replace("\0", "");
}
/**
* 3.5: Read the Codec-List-Object, which provides user-friendly information about the codecs and formats used to encode the content found in the ASF file.
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_5
*/
async function readCodecEntries(tokenizer, payloadSize, maxEntries = defaultMaxMetadataEntries) {
	const reader = createTokenizerView(tokenizer, payloadSize);
	const entries = [];
	try {
		const codecHeader = await reader.readToken(CodecListObjectHeader);
		if (codecHeader.entryCount > maxEntries) throw new AsfContentParseError(`ASF Codec List entry count ${codecHeader.entryCount} exceeds entry limit ${maxEntries}`);
		for (let i = 0; i < codecHeader.entryCount; ++i) entries.push(await readCodecEntry(reader));
		await reader.consumeRemainder();
	} catch (error) {
		if (error instanceof EndOfStreamError || error instanceof TokenizerBoundaryError) throw new AsfContentParseError(`Unexpected end of ASF Codec List Object: ${error.message}`);
		throw error;
	} finally {
		await reader.close();
	}
	return entries;
}
async function readInformation(reader) {
	const length = await reader.readNumber(UINT16_LE);
	return reader.readToken(new Uint8ArrayType(length));
}
/**
* Read Codec-Entries
* @param reader
*/
async function readCodecEntry(reader) {
	const type = await reader.readNumber(UINT16_LE);
	return {
		type: {
			videoCodec: (type & 1) === 1,
			audioCodec: (type & 2) === 2
		},
		codecName: await readString(reader),
		description: await readString(reader),
		information: await readInformation(reader)
	};
}
/**
* 3.10 Content Description Object (optional, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_10
*/
var ContentDescriptionObjectState = class ContentDescriptionObjectState extends State {
	static guid = AsfGuid.ContentDescriptionObject;
	static contentDescTags = [
		"Title",
		"Author",
		"Copyright",
		"Description",
		"Rating"
	];
	get(buf, off) {
		const cursor = new ByteCursor(buf, off, this.len, "Content Description Object");
		const lengths = cursor.bytes(10, "Truncated Content Description Object");
		const tags = [];
		for (const [i, tagName] of ContentDescriptionObjectState.contentDescTags.entries()) {
			const length = UINT16_LE.get(lengths, i * 2);
			const value = cursor.bytes(length, `${tagName} length ${length} exceeds Content Description payload`);
			if (length > 0) tags.push({
				id: tagName,
				value: parseUnicodeAttr(value)
			});
		}
		return tags;
	}
};
/**
* 3.11 Extended Content Description Object (optional, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_11
*/
var ExtendedContentDescriptionObjectState = class extends State {
	static guid = AsfGuid.ExtendedContentDescriptionObject;
	get(buf, off) {
		const cursor = new ByteCursor(buf, off, this.len, "Extended Content Description Object");
		const tags = [];
		const attrCount = cursor.read(UINT16_LE);
		if (attrCount > cursor.remaining / 6) throw new AsfContentParseError("Extended Content Description count exceeds payload");
		for (let i = 0; i < attrCount; i += 1) {
			cursor.require(6, "Truncated Extended Content Description record");
			const nameLen = cursor.read(UINT16_LE);
			cursor.require(nameLen + 4, "Extended Content Description name exceeds payload");
			const name = parseUnicodeAttr(cursor.bytes(nameLen, "Extended Content Description name exceeds payload"));
			const valueType = cursor.read(UINT16_LE);
			const valueLen = cursor.read(UINT16_LE);
			const value = cursor.bytes(valueLen, "Extended Content Description value exceeds payload");
			this.postProcessTag(tags, name, valueType, value);
		}
		return tags;
	}
};
/**
* 4.1 Extended Stream Properties Object (optional, 1 per media stream)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/04_objects_in_the_asf_header_extension_object.html#4_1
*/
var ExtendedStreamPropertiesObjectState = class extends State {
	static guid = AsfGuid.ExtendedStreamPropertiesObject;
	get(buf, off) {
		const end = off + Math.min(this.len, buf.length - off);
		if (end - off < 64) throw new AsfContentParseError("Truncated Extended Stream Properties Object");
		const flags = UINT32_LE.get(buf, off + 44);
		const result = {
			startTime: UINT64_LE.get(buf, off),
			endTime: UINT64_LE.get(buf, off + 8),
			dataBitrate: UINT32_LE.get(buf, off + 16),
			bufferSize: UINT32_LE.get(buf, off + 20),
			initialBufferFullness: UINT32_LE.get(buf, off + 24),
			alternateDataBitrate: UINT32_LE.get(buf, off + 28),
			alternateBufferSize: UINT32_LE.get(buf, off + 32),
			alternateInitialBufferFullness: UINT32_LE.get(buf, off + 36),
			maximumObjectSize: UINT32_LE.get(buf, off + 40),
			flags: {
				reliableFlag: (flags & 1) !== 0,
				seekableFlag: (flags & 2) !== 0,
				resendLiveCleanpointsFlag: (flags & 8) !== 0
			},
			streamNumber: UINT16_LE.get(buf, off + 48) & 127,
			streamLanguageId: UINT16_LE.get(buf, off + 50),
			averageTimePerFrame: Number(UINT64_LE.get(buf, off + 52)),
			streamNameCount: UINT16_LE.get(buf, off + 60),
			payloadExtensionSystems: UINT16_LE.get(buf, off + 62),
			streamNames: [],
			streamPropertiesObject: null
		};
		let cursor = off + 64;
		const requireBytes = (length) => {
			if (length > end - cursor) throw new AsfContentParseError("ASF extended stream data exceeds object payload");
		};
		for (let index = 0; index < result.streamNameCount; ++index) {
			requireBytes(4);
			const language = UINT16_LE.get(buf, cursor);
			const length = UINT16_LE.get(buf, cursor + 2);
			cursor += 4;
			requireBytes(length);
			result.streamNames.push({
				streamLanguageId: language,
				streamName: parseUnicodeAttr(buf.subarray(cursor, cursor + length))
			});
			cursor += length;
		}
		for (let index = 0; index < result.payloadExtensionSystems; ++index) {
			requireBytes(22);
			const length = UINT32_LE.get(buf, cursor + 18);
			cursor += 22;
			requireBytes(length);
			cursor += length;
		}
		if (cursor < end) {
			requireBytes(HeaderObjectToken.len);
			const header = HeaderObjectToken.get(buf, cursor);
			if (!header.objectId.equals(AsfGuid.StreamPropertiesObject) || header.objectSize !== end - cursor) throw new AsfContentParseError("Invalid embedded ASF Stream Properties Object");
			result.streamPropertiesObject = new StreamPropertiesObject(header).get(buf, cursor + HeaderObjectToken.len);
		}
		return result;
	}
};
/**
* 4.7  Metadata Object (optional, 0 or 1)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/04_objects_in_the_asf_header_extension_object.html#4_7
*/
var MetadataObjectState = class extends State {
	static guid = AsfGuid.MetadataObject;
	get(uint8Array, off) {
		const cursor = new ByteCursor(uint8Array, off, this.len, "Metadata Object");
		const tags = [];
		const descriptionRecordsCount = cursor.read(UINT16_LE);
		if (descriptionRecordsCount > cursor.remaining / 12) throw new AsfContentParseError("Metadata record count exceeds payload");
		for (let i = 0; i < descriptionRecordsCount; i += 1) {
			cursor.require(12, "Truncated Metadata record header");
			cursor.read(UINT32_LE);
			const nameLen = cursor.read(UINT16_LE);
			const dataType = cursor.read(UINT16_LE);
			const dataLen = cursor.read(UINT32_LE);
			const name = parseUnicodeAttr(cursor.bytes(nameLen, "Metadata name exceeds payload"));
			const data = cursor.bytes(dataLen, "Metadata value exceeds payload");
			this.postProcessTag(tags, name, dataType, data);
		}
		return tags;
	}
};
var MetadataLibraryObjectState = class extends MetadataObjectState {
	static guid = AsfGuid.MetadataLibraryObject;
};
/**
* Ref: https://msdn.microsoft.com/en-us/library/windows/desktop/dd757977(v=vs.85).aspx
*/
var WmPictureToken = class WmPictureToken {
	static fromBuffer(buffer) {
		return new WmPictureToken(buffer.length).get(buffer, 0);
	}
	len;
	constructor(len) {
		this.len = len;
	}
	get(buffer, offset) {
		const payload = buffer.subarray(offset, offset + this.len);
		if (payload.length < 5) throw new AsfContentParseError("Truncated ASF picture header");
		const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
		const typeId = view.getUint8(0);
		const size = view.getUint32(1, true);
		let index = 5;
		const readString = (field) => {
			const start = index;
			while (index + 2 <= payload.length) {
				const codeUnit = view.getUint16(index, true);
				index += 2;
				if (codeUnit === 0) return new StringType(index - start - 2, "utf-16le").get(payload, start);
			}
			throw new AsfContentParseError(`Unterminated ASF picture ${field}`);
		};
		const format = readString("MIME type");
		const description = readString("description");
		return {
			type: AttachedPictureType[typeId],
			format,
			description,
			size,
			data: payload.slice(index)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfParser.js
var AsfParser_exports = /* @__PURE__ */ __exportAll({ AsfParser: () => AsfParser });
var debug$24 = (0, import_src.default)("music-metadata:parser:ASF");
var headerType = "asf";
/**
* Windows Media Metadata Usage Guidelines
* - Ref: https://msdn.microsoft.com/en-us/library/ms867702.aspx
*
* Ref:
* - https://tools.ietf.org/html/draft-fleischman-asf-01
* - https://hwiegman.home.xs4all.nl/fileformats/asf/ASF_Specification.pdf
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/index.html
* - https://msdn.microsoft.com/en-us/library/windows/desktop/ee663575(v=vs.85).aspx
*/
var AsfParser = class extends BasicParser {
	streams = /* @__PURE__ */ new Map();
	codecs = [];
	extendedStreams = /* @__PURE__ */ new Map();
	streamBitrates = /* @__PURE__ */ new Map();
	async parse() {
		const header = await this.readToken(TopLevelHeaderObjectToken);
		if (!header.objectId.equals(AsfGuid.HeaderObject)) throw new AsfContentParseError(`expected asf header; but was not found; got: ${header.objectId.str}`);
		if (header.numberOfHeaderObjects < 1 || header.numberOfHeaderObjects > 1e4) throw new AsfContentParseError(`Unrealistic number of ASF header objects: ${header.numberOfHeaderObjects}`);
		await this.parseObjectHeaders(header.numberOfHeaderObjects, header.objectSize - TopLevelHeaderObjectToken.len);
		for (const stream of this.streams.values()) {
			const type = stream.streamType === "audio" ? TrackType.audio : stream.streamType === "video" ? TrackType.video : stream.streamType === "command" ? TrackType.control : stream.streamType === "binary" ? TrackType.metadata : void 0;
			const codec = this.codecs.find((codec) => {
				if (type === TrackType.audio && codec.type.audioCodec && codec.information.length >= 2) return stream.codecId === `0x${UINT16_LE.get(codec.information, 0).toString(16).padStart(4, "0")}`;
				return type === TrackType.video && codec.type.videoCodec && codec.information.length >= 4 && stream.codecId === new StringType(4, "ascii").get(codec.information, 0);
			});
			const track = {
				id: stream.streamNumber,
				type
			};
			const extended = this.extendedStreams.get(stream.streamNumber);
			if (stream.codecId !== void 0) track.codecId = stream.codecId;
			if (codec) track.codecName = codec.codecName;
			if (stream.audio) track.audio = stream.audio;
			if (stream.video) track.video = stream.video;
			if (extended) {
				if (extended.endTime > extended.startTime) track.duration = Number(extended.endTime - extended.startTime) / 1e3;
				const name = extended.streamNames[0]?.streamName;
				if (name) track.name = name;
				if (track.video && extended.averageTimePerFrame > 0) track.video.frameRate = 1e7 / extended.averageTimePerFrame;
			}
			const bitrate = this.streamBitrates.get(stream.streamNumber) ?? (extended && extended.dataBitrate > 0 ? extended.dataBitrate : stream.bitrate);
			if (bitrate !== void 0) track.bitrate = bitrate;
			this.metadata.addStreamInfo(track);
		}
		const audio = [...this.streams.values()].find((stream) => stream.audio)?.audio;
		if (audio) {
			this.metadata.setFormat("sampleRate", audio.samplingFrequency);
			this.metadata.setFormat("numberOfChannels", audio.channels);
			if (audio.bitDepth !== void 0) this.metadata.setFormat("bitsPerSample", audio.bitDepth);
		}
	}
	async parseObjectHeaders(numberOfObjectHeaders, remainingHeaderSize) {
		let tags;
		for (let index = 0; index < numberOfObjectHeaders; ++index) {
			const { header, payloadSize } = await this.readObjectHeader(remainingHeaderSize, "header");
			debug$24("header GUID=%s", header.objectId.str);
			switch (header.objectId.str) {
				case FilePropertiesObject.guid.str: {
					this.validateAllocationSize(payloadSize, "File Properties Object");
					const fpo = await this.readToken(new FilePropertiesObject(header));
					if (!fpo.flags.broadcast) {
						const duration = Number(fpo.playDuration) / 1e7 - Number(fpo.preroll) / 1e3;
						if (Number.isFinite(duration) && duration > 0) {
							this.metadata.setFormat("duration", duration);
							this.metadata.setFormat("containerDuration", duration);
						}
					}
					this.metadata.setFormat("bitrate", fpo.maximumBitrate);
					break;
				}
				case StreamPropertiesObject.guid.str: {
					this.validateAllocationSize(payloadSize, "Stream Properties Object");
					const spo = await this.readToken(new StreamPropertiesObject(header));
					this.metadata.setFormat("container", `ASF/${spo.streamType}`);
					if (spo.streamType === "audio") this.metadata.setFormat("hasAudio", true);
					else if (spo.streamType === "video") this.metadata.setFormat("hasVideo", true);
					this.streams.set(spo.streamNumber, spo);
					break;
				}
				case HeaderExtensionObject.guid.str: {
					const extensionHeaderToken = new HeaderExtensionObject();
					if (payloadSize < extensionHeaderToken.len) throw new AsfContentParseError(`ASF Header Extension Object payload is too small: ${payloadSize} bytes`);
					const extHeader = await this.readToken(extensionHeaderToken);
					const expectedExtensionSize = payloadSize - extensionHeaderToken.len;
					if (extHeader.extensionDataSize !== expectedExtensionSize) throw new AsfContentParseError(`ASF extension data size ${extHeader.extensionDataSize} does not match enclosing payload size ${expectedExtensionSize}`);
					await this.parseExtensionObject(extHeader.extensionDataSize);
					break;
				}
				case ContentDescriptionObjectState.guid.str:
					this.validateAllocationSize(payloadSize, "Content Description Object");
					tags = await this.readToken(new ContentDescriptionObjectState(header));
					await this.addTags(tags);
					break;
				case ExtendedContentDescriptionObjectState.guid.str:
					this.validateAllocationSize(payloadSize, "Extended Content Description Object");
					tags = await this.readToken(new ExtendedContentDescriptionObjectState(header));
					await this.addTags(tags);
					break;
				case AsfGuid.CodecListObject.str: {
					this.validateAllocationSize(payloadSize, "Codec List Object");
					let codecs;
					try {
						codecs = await readCodecEntries(this.tokenizer, payloadSize, getMaxMetadataEntries(this.options));
					} catch (error) {
						throw new AsfContentParseError(`Invalid ASF Codec List Object: ${error instanceof Error ? error.message : String(error)}`);
					}
					for (const codec of codecs) this.codecs.push(codec);
					const audioCodecs = codecs.filter((codec) => codec.type.audioCodec).map((codec) => codec.codecName).join("/");
					this.metadata.setFormat("codec", audioCodecs);
					break;
				}
				case AsfGuid.StreamBitratePropertiesObject.str: {
					if (payloadSize < 2) throw new AsfContentParseError("Truncated Stream Bitrate Properties Object");
					const count = await this.readToken(UINT16_LE);
					if (count * 6 > payloadSize - 2) throw new AsfContentParseError("ASF stream bitrate records exceed object payload");
					for (let index = 0; index < count; ++index) {
						const streamNumber = await this.readToken(UINT16_LE) & 127;
						this.streamBitrates.set(streamNumber, await this.readToken(UINT32_LE));
					}
					await this.ignorePayload(payloadSize - 2 - count * 6, "Stream Bitrate Properties Object");
					break;
				}
				case AsfGuid.PaddingObject.str:
					debug$24("Padding: %s bytes", payloadSize);
					await this.ignorePayload(payloadSize, "Padding Object");
					break;
				default:
					this.metadata.addWarning(`Ignore ASF-Object-GUID: ${header.objectId.str}`);
					debug$24("Ignore ASF-Object-GUID: %s", header.objectId.str);
					await this.ignorePayload(payloadSize, `object ${header.objectId.str}`);
			}
			remainingHeaderSize -= header.objectSize;
		}
		if (remainingHeaderSize !== 0) throw new AsfContentParseError(`ASF header child objects leave ${remainingHeaderSize} payload byte(s) unaccounted`);
	}
	async addTags(tags) {
		for (const { id, value } of tags) await this.metadata.addTag(headerType, id, value);
	}
	async readObjectHeader(remainingSize, containerType) {
		if (remainingSize < HeaderObjectToken.len) throw new AsfContentParseError(`Insufficient ASF ${containerType} data for an object header: ${remainingSize} bytes`);
		const header = await this.readToken(HeaderObjectToken);
		if (header.objectSize > remainingSize) throw new AsfContentParseError(`ASF ${containerType} object size ${header.objectSize} exceeds remaining ${containerType} payload size ${remainingSize}`);
		return {
			header,
			payloadSize: this.validatePayloadAvailability(header, `${containerType} object`)
		};
	}
	validatePayloadAvailability(header, objectType) {
		const payloadSize = header.objectSize - HeaderObjectToken.len;
		const fileSize = this.tokenizer.fileInfo.size;
		if (fileSize !== void 0) {
			const available = fileSize - this.tokenizer.position;
			if (payloadSize > available) throw new AsfContentParseError(`ASF ${objectType} payload size ${payloadSize} exceeds available input size ${available}`);
		}
		return payloadSize;
	}
	validateAllocationSize(payloadSize, objectType) {
		validateAllocation(payloadSize, this.options, (message) => new AsfContentParseError(`ASF ${objectType}: ${message}`));
	}
	async ignorePayload(payloadSize, objectType) {
		let ignored;
		try {
			ignored = await this.tokenizer.ignore(payloadSize);
		} catch (error) {
			if (error instanceof EndOfStreamError) throw new AsfContentParseError(`Unexpected end of ASF ${objectType}`);
			throw error;
		}
		if (ignored !== payloadSize) throw new AsfContentParseError(`Unexpected end of ASF ${objectType}; missing ${payloadSize - ignored} bytes`);
	}
	async parseExtensionObject(extensionSize) {
		while (extensionSize > 0) {
			const { header, payloadSize } = await this.readObjectHeader(extensionSize, "extension");
			switch (header.objectId.str) {
				case ExtendedStreamPropertiesObjectState.guid.str: {
					this.validateAllocationSize(payloadSize, "Extended Stream Properties Object");
					const extended = await this.readToken(new ExtendedStreamPropertiesObjectState(header));
					this.extendedStreams.set(extended.streamNumber, extended);
					if (extended.streamPropertiesObject) {
						const stream = extended.streamPropertiesObject;
						this.streams.set(stream.streamNumber, stream);
						this.metadata.setFormat("container", `ASF/${stream.streamType}`);
					}
					break;
				}
				case MetadataObjectState.guid.str: {
					this.validateAllocationSize(payloadSize, "Metadata Object");
					const moTags = await this.readToken(new MetadataObjectState(header));
					await this.addTags(moTags);
					break;
				}
				case MetadataLibraryObjectState.guid.str: {
					this.validateAllocationSize(payloadSize, "Metadata Library Object");
					const mlTags = await this.readToken(new MetadataLibraryObjectState(header));
					await this.addTags(mlTags);
					break;
				}
				case AsfGuid.PaddingObject.str:
					await this.ignorePayload(payloadSize, "extension Padding Object");
					break;
				case AsfGuid.CompatibilityObject.str:
					await this.ignorePayload(payloadSize, "Compatibility Object");
					break;
				case AsfGuid.ASF_Index_Placeholder_Object.str:
					await this.ignorePayload(payloadSize, "Index Placeholder Object");
					break;
				default:
					this.metadata.addWarning(`Ignore ASF-Object-GUID: ${header.objectId.str}`);
					await this.ignorePayload(payloadSize, `extension object ${header.objectId.str}`);
			}
			extensionSize -= header.objectSize;
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/caf/CafToken.js
var CafContentError = class extends makeUnexpectedFileContentError("CAF") {};
var decodeFourCC = (buf, off) => textDecode(buf.subarray(off, off + 4), "latin1");
var FileHeader = {
	len: 8,
	get: (buf, off) => {
		return {
			fileType: decodeFourCC(buf, off),
			fileVersion: UINT16_BE.get(buf, off + 4),
			fileFlags: UINT16_BE.get(buf, off + 6)
		};
	}
};
var ChunkHeader$1 = {
	len: 12,
	get: (buf, off) => {
		return {
			chunkType: decodeFourCC(buf, off),
			chunkSize: Number(INT64_BE.get(buf, off + 4))
		};
	}
};
/** CAFAudioFormat: Float64 mSampleRate followed by six UInt32 fields */
var AudioDescription = {
	len: 32,
	get: (buf, off) => {
		return {
			sampleRate: Float64_BE.get(buf, off),
			formatId: decodeFourCC(buf, off + 8),
			formatFlags: UINT32_BE.get(buf, off + 12),
			bytesPerPacket: UINT32_BE.get(buf, off + 16),
			framesPerPacket: UINT32_BE.get(buf, off + 20),
			channelsPerFrame: UINT32_BE.get(buf, off + 24),
			bitsPerChannel: UINT32_BE.get(buf, off + 28)
		};
	}
};
/** Fixed 24 byte part of a Packet Table chunk */
var PacketTableHeader = {
	len: 24,
	get: (buf, off) => {
		return {
			numberPackets: Number(INT64_BE.get(buf, off)),
			numberValidFrames: Number(INT64_BE.get(buf, off + 8)),
			primingFrames: INT32_BE.get(buf, off + 16),
			remainderFrames: INT32_BE.get(buf, off + 20)
		};
	}
};
function varIntsPerPacket(desc) {
	return (desc.bytesPerPacket === 0 ? 1 : 0) + (desc.framesPerPacket === 0 ? 1 : 0);
}
/**
* Decodes the base-128, MSB-first integers that follow a Packet Table header,
* high-order bit set meaning the number continues in the next byte.
* @returns number of bytes occupied by the entries
*/
function decodePacketTableEntries(body, desc, numberPackets) {
	const expected = numberPackets * varIntsPerPacket(desc);
	if (expected === 0) return 0;
	if (expected > body.length) throw new CafContentError(`Packet Table data section holds ${body.length} byte(s) for ${expected} packet table entries`);
	let offset = 0;
	for (let i = 0; i < expected; ++i) {
		let byte;
		do {
			if (offset >= body.length) throw new CafContentError("Packet Table data section ends in the middle of a variable length integer");
			byte = body[offset++];
		} while ((byte & 128) !== 0);
	}
	return offset;
}
/** Leading 12 bytes of a Channel Layout chunk, mChannelBitmap is always present */
var ChannelLayoutHeader = {
	len: 12,
	get: (buf, off) => {
		return {
			channelLayoutTag: UINT32_BE.get(buf, off),
			channelBitmap: UINT32_BE.get(buf, off + 4),
			numberChannelDescriptions: UINT32_BE.get(buf, off + 8)
		};
	}
};
/** Each CAFChannelDescription has a UInt32 label, UInt32 flags and three Float32 coordinates */
function parseChannelDescriptions(body, count, maxEntries = defaultMaxMetadataEntries) {
	if (count * 20 > body.length) throw new CafContentError(`Channel Layout chunk declares ${count} description(s) for ${body.length} byte(s)`);
	if (count > maxEntries) throw new CafContentError(`Channel Layout description count ${count} exceeds entry limit ${maxEntries}`);
	const descriptions = [];
	for (let i = 0; i < count; ++i) {
		const off = i * 20;
		descriptions.push({
			channelLabel: UINT32_BE.get(body, off),
			channelFlags: UINT32_BE.get(body, off + 4),
			coordinates: [
				Float32_BE.get(body, off + 8),
				Float32_BE.get(body, off + 12),
				Float32_BE.get(body, off + 16)
			]
		});
	}
	return descriptions;
}
/** Reads the NUL terminated UTF-8 pairs, the declared entry count is authoritative */
function parseInfoEntries(body, maxEntries = defaultMaxMetadataEntries) {
	const readString = (from) => {
		const end = body.indexOf(0, from);
		if (end < 0) throw new CafContentError("Information chunk contains an unterminated string");
		return {
			value: textDecode(body.subarray(from, end), "utf8"),
			next: end + 1
		};
	};
	const numEntries = UINT32_BE.get(body, 0);
	if (numEntries > maxEntries) throw new CafContentError(`Information entry count ${numEntries} exceeds entry limit ${maxEntries}`);
	const entries = [];
	let offset = 4;
	for (let i = 0; i < numEntries; ++i) {
		const key = readString(offset);
		const value = readString(key.next);
		entries.push({
			key: key.value,
			value: value.value
		});
		offset = value.next;
	}
	return entries;
}
//#endregion
//#region node_modules/music-metadata/lib/caf/CafParser.js
var CafParser_exports = /* @__PURE__ */ __exportAll({ CafParser: () => CafParser });
var debug$23 = (0, import_src.default)("music-metadata:parser:caf");
var codecByFormatId = {
	lpcm: {
		codec: "PCM",
		lossless: true
	},
	ima4: {
		codec: "IMA4 ADPCM",
		lossless: false
	},
	alac: {
		codec: "ALAC",
		lossless: true
	},
	flac: {
		codec: "FLAC",
		lossless: true
	},
	ulaw: {
		codec: "ITU-T G.711 mu-law",
		lossless: false
	},
	alaw: {
		codec: "ITU-T G.711 A-law",
		lossless: false
	},
	".mp1": {
		codec: "MPEG-1 Layer I",
		lossless: false
	},
	".mp2": {
		codec: "MPEG-1 Layer II",
		lossless: false
	},
	".mp3": {
		codec: "MPEG-1 Layer III",
		lossless: false
	},
	"aac ": {
		codec: "AAC",
		lossless: false
	},
	aace: {
		codec: "AAC",
		lossless: false
	},
	aacf: {
		codec: "AAC",
		lossless: false
	},
	aacg: {
		codec: "AAC",
		lossless: false
	},
	aach: {
		codec: "AAC",
		lossless: false
	},
	aacl: {
		codec: "AAC",
		lossless: false
	},
	aacp: {
		codec: "AAC",
		lossless: false
	}
};
var editCountLen = 4;
var numEntriesLen = 4;
/**
* CAF - Core Audio File Format
*
* Ref: https://developer.apple.com/library/archive/documentation/MusicAudio/Reference/CAFSpec/CAF_spec/CAF_spec.html
*/
var CafParser = class extends BasicParser {
	desc;
	packetTable;
	dataBytes;
	expectedFirstChunk = true;
	reachedEndOfFile = false;
	async parse() {
		const header = await this.tokenizer.readToken(FileHeader);
		if (header.fileType !== "caff") throw new CafContentError(`Invalid file-type, expected 'caff', found '${header.fileType}'`);
		this.metadata.setFormat("container", "CAF");
		this.metadata.setAudioOnly();
		while (!this.reachedEndOfFile && !this.endOfFileReached()) {
			let chunkHeader;
			try {
				chunkHeader = await this.tokenizer.readToken(ChunkHeader$1);
			} catch (error) {
				if (error instanceof EndOfStreamError) {
					debug$23("End-of-stream");
					break;
				}
				throw error;
			}
			debug$23(`Reading CAF chunk type=${chunkHeader.chunkType} size=${chunkHeader.chunkSize}`);
			if (this.expectedFirstChunk) {
				this.expectedFirstChunk = false;
				if (chunkHeader.chunkType !== "desc") throw new CafContentError(`Expected an Audio Description chunk, found '${chunkHeader.chunkType}'`);
			}
			await this.readChunk(chunkHeader);
		}
		if (!this.desc) throw new CafContentError("Missing Audio Description chunk");
		this.applyDerivedFormat();
	}
	endOfFileReached() {
		const { size } = this.tokenizer.fileInfo;
		return size !== void 0 && size - this.tokenizer.position < ChunkHeader$1.len;
	}
	async readChunk(header) {
		switch (header.chunkType) {
			case "desc": return this.readAudioDescription(header.chunkSize);
			case "pakt": return this.readPacketTable(header.chunkSize);
			case "data": return this.readAudioData(header.chunkSize);
			case "info": return this.readInfo(header.chunkSize);
			case "chan": return this.readChannelLayout(header.chunkSize);
			default:
				debug$23(`Ignore chunk type=${header.chunkType} size=${header.chunkSize}`);
				return this.skipUnknownChunk(header.chunkSize);
		}
	}
	async readAudioDescription(chunkSize) {
		if (chunkSize < AudioDescription.len) throw new CafContentError(`Audio Description chunk size ${chunkSize} is smaller than ${AudioDescription.len}`);
		this.desc = await this.tokenizer.readToken(AudioDescription);
		await this.tokenizer.ignore(chunkSize - AudioDescription.len);
		this.applyAudioDescription(this.desc);
	}
	applyAudioDescription(desc) {
		this.metadata.setFormat("sampleRate", desc.sampleRate);
		this.metadata.setFormat("numberOfChannels", desc.channelsPerFrame);
		if (desc.bitsPerChannel > 0) this.metadata.setFormat("bitsPerSample", desc.bitsPerChannel);
		const codec = codecByFormatId[desc.formatId];
		this.metadata.setFormat("codec", codec ? codec.codec : desc.formatId);
		if (codec) this.metadata.setFormat("lossless", codec.lossless);
	}
	async readPacketTable(chunkSize) {
		const desc = this.desc;
		if (!desc) throw new CafContentError("Packet Table chunk found before the Audio Description chunk");
		if (chunkSize < PacketTableHeader.len) throw new CafContentError(`Packet Table chunk size ${chunkSize} is smaller than ${PacketTableHeader.len}`);
		this.validateChunkAvailability(chunkSize, "Packet Table");
		const packetTable = await this.tokenizer.readToken(PacketTableHeader);
		decodePacketTableEntries(await this.readChunkBody(chunkSize - PacketTableHeader.len, "Packet Table"), desc, packetTable.numberPackets);
		this.packetTable = packetTable;
	}
	async readAudioData(chunkSize) {
		if (chunkSize >= 0 && chunkSize < editCountLen) throw new CafContentError(`Audio Data chunk size ${chunkSize} is too small to hold mEditCount`);
		if (chunkSize >= 0) this.validateChunkAvailability(chunkSize, "Audio Data");
		if (await this.tokenizer.ignore(editCountLen) !== editCountLen) throw new EndOfStreamError();
		if (chunkSize === -1) {
			this.reachedEndOfFile = true;
			const { size } = this.tokenizer.fileInfo;
			if (size !== void 0) {
				this.dataBytes = size - this.tokenizer.position;
				await this.tokenizer.ignore(this.dataBytes);
				return;
			}
			if (!this.options.duration) {
				debug$23("Audio Data chunk has an unknown size and duration was not requested");
				return;
			}
			const desc = this.desc;
			if (!desc || desc.sampleRate <= 0 || this.deriveFrameCount(desc) !== void 0 || desc.bytesPerPacket <= 0 || desc.framesPerPacket <= 0) return;
			this.dataBytes = await this.readToPhysicalEof();
			return;
		}
		const dataBytes = chunkSize - editCountLen;
		if (await this.tokenizer.ignore(dataBytes) !== dataBytes) throw new EndOfStreamError();
		this.dataBytes = dataBytes;
	}
	/**
	* Consume the remaining input, counting bytes until physical end-of-stream.
	* Only needed for duration recovery when neither the data chunk nor the input declares a size.
	*/
	async readToPhysicalEof() {
		const buffer = /* @__PURE__ */ new Uint8Array(65536);
		let bytes = 0;
		for (;;) {
			const read = await this.tokenizer.readBuffer(buffer, { mayBeLess: true });
			if (read === 0) return bytes;
			bytes += read;
		}
	}
	async readInfo(chunkSize) {
		if (chunkSize < numEntriesLen) throw new CafContentError(`Information chunk size ${chunkSize} is too small to hold mNumEntries`);
		const entries = parseInfoEntries(await this.readChunkBody(chunkSize, "Information"), getMaxMetadataEntries(this.options));
		for (const { key, value } of entries) {
			if ([
				"artist",
				"composer",
				"lyricist",
				"genre"
			].includes(key)) {
				let count = 1;
				for (let offset = value.indexOf(","); offset >= 0; offset = value.indexOf(",", offset + 1)) ++count;
				if (count > getMaxMetadataEntries(this.options)) throw new CafContentError(`Comma-separated value count ${count} exceeds entry limit ${getMaxMetadataEntries(this.options)}`);
			}
			debug$23(`info key=${key}`);
			await this.metadata.addTag("CAF", key, value);
		}
	}
	async readChannelLayout(chunkSize) {
		if (chunkSize < ChannelLayoutHeader.len) throw new CafContentError(`Channel Layout chunk size ${chunkSize} is smaller than ${ChannelLayoutHeader.len}`);
		this.validateChunkAvailability(chunkSize, "Channel Layout");
		const header = await this.tokenizer.readToken(ChannelLayoutHeader);
		const descriptionLen = header.numberChannelDescriptions * 20;
		const bodyLen = ChannelLayoutHeader.len + descriptionLen;
		if (bodyLen > chunkSize) throw new CafContentError(`Channel Layout chunk declares ${header.numberChannelDescriptions} description(s) which exceed its size of ${chunkSize}`);
		const descriptions = descriptionLen > 0 ? parseChannelDescriptions(await this.readChunkBody(descriptionLen, "Channel Layout"), header.numberChannelDescriptions, getMaxMetadataEntries(this.options)) : [];
		await this.addChannelLayout(header, descriptions);
		await this.tokenizer.ignore(chunkSize - bodyLen);
	}
	async addChannelLayout(header, descriptions) {
		await this.metadata.addTag("CAF", "channelLayoutTag", header.channelLayoutTag);
		await this.metadata.addTag("CAF", "channelLayoutBitmap", header.channelBitmap);
		if (descriptions.length > 0) await this.metadata.addTag("CAF", "channelLayoutDescriptions", descriptions);
	}
	/**
	* Rejects a whole chunk whose declared size exceeds the remaining input.
	* Only applicable when the total input size is known.
	*/
	validateChunkAvailability(chunkSize, chunkType) {
		const { size } = this.tokenizer.fileInfo;
		if (size !== void 0) {
			const available = size - this.tokenizer.position;
			if (chunkSize > available) throw new CafContentError(`${chunkType} chunk size ${chunkSize} exceeds available input size ${available}`);
		}
	}
	/**
	* Reads a chunk body without trusting its declared size.
	* @param chunkSize Declared body size
	* @param chunkType Chunk name for error messages
	*/
	async readChunkBody(chunkSize, chunkType) {
		this.validateChunkAvailability(chunkSize, chunkType);
		return this.readToken(new Uint8ArrayType(chunkSize));
	}
	async skipUnknownChunk(chunkSize) {
		if (chunkSize < 0) throw new CafContentError(`Chunk size ${chunkSize} may only be -1 for an Audio Data chunk`);
		await this.tokenizer.ignore(chunkSize);
	}
	applyDerivedFormat() {
		const desc = this.desc;
		if (!desc || desc.sampleRate <= 0) return;
		const frames = this.deriveFrameCount(desc);
		if (frames === void 0) {
			debug$23("Unable to derive the number of sample frames");
			return;
		}
		const duration = frames / desc.sampleRate;
		this.metadata.setFormat("numberOfSamples", frames);
		this.metadata.setFormat("duration", duration);
		if (this.dataBytes !== void 0) this.metadata.setFormat("bitrate", 8 * this.dataBytes / duration);
	}
	deriveFrameCount(desc) {
		const packetTable = this.packetTable;
		if (packetTable) {
			if (packetTable.numberValidFrames > 0) return packetTable.numberValidFrames;
			debug$23(`Ignoring packet table with mNumberValidFrames=${packetTable.numberValidFrames}`);
		}
		if (desc.bytesPerPacket > 0 && desc.framesPerPacket > 0 && this.dataBytes !== void 0) {
			const frames = Math.floor(this.dataBytes / desc.bytesPerPacket) * desc.framesPerPacket;
			if (frames > 0) return frames;
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsdiff/DsdiffToken.js
/**
* DSDIFF chunk header
* The data-size encoding is deviating from EA-IFF 85
* Ref: http://www.sonicstudio.com/pdf/dsd/DSDIFF_1.5_Spec.pdf
*/
var ChunkHeader64 = {
	len: 12,
	get: (buf, off) => {
		return {
			chunkID: FourCcToken.get(buf, off),
			chunkSize: INT64_BE.get(buf, off + 4)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsdiff/DsdiffParser.js
var DsdiffParser_exports = /* @__PURE__ */ __exportAll({
	DsdiffContentParseError: () => DsdiffContentParseError,
	DsdiffParser: () => DsdiffParser
});
var debug$22 = (0, import_src.default)("music-metadata:parser:dsdiff");
var DsdiffContentParseError = class extends makeUnexpectedFileContentError("DSDIFF") {};
/**
* DSDIFF - Direct Stream Digital Interchange File Format (Phillips)
*
* Ref:
* - http://www.sonicstudio.com/pdf/dsd/DSDIFF_1.5_Spec.pdf
*/
var DsdiffParser = class extends BasicParser {
	input = this.tokenizer;
	readToken(token) {
		return readToken(this.input, token, this.options);
	}
	async parse() {
		const header = await this.readToken(ChunkHeader64);
		if (header.chunkID !== "FRM8") throw new DsdiffContentParseError("Unexpected chunk-ID");
		this.validateChunkSize(header);
		this.requireChunkSize(header, FourCcToken.len);
		this.metadata.setAudioOnly();
		const type = (await this.readToken(FourCcToken)).trim();
		switch (type) {
			case "DSD":
				this.metadata.setFormat("container", `DSDIFF/${type}`);
				this.metadata.setFormat("lossless", true);
				await this.readChunks(header.chunkSize - BigInt(FourCcToken.len), (child) => this.readData(child));
				return;
			default: throw new DsdiffContentParseError(`Unsupported DSDIFF type: ${type}`);
		}
	}
	validateChunkSize(header, remainingSize) {
		const size = header.chunkSize;
		if (size < 0n || size > BigInt(Number.MAX_SAFE_INTEGER)) throw new DsdiffContentParseError(`Invalid chunk size: ${size}`);
		const paddedSize = size + (size & 1n);
		if (remainingSize !== void 0 && paddedSize > remainingSize) throw new DsdiffContentParseError(`Chunk ${header.chunkID} size ${size} exceeds its enclosing chunk`);
		const fileSize = this.input.fileInfo.size;
		if (fileSize !== void 0 && paddedSize > BigInt(fileSize - this.input.position)) throw new DsdiffContentParseError(`Chunk ${header.chunkID} size ${size} exceeds remaining file size`);
	}
	requireChunkSize(header, minimum) {
		if (header.chunkSize < BigInt(minimum)) throw new DsdiffContentParseError(`Chunk ${header.chunkID} is too small: ${header.chunkSize}`);
	}
	async ignoreBytes(length) {
		if (await this.input.ignore(Number(length)) !== Number(length)) throw new DsdiffContentParseError("Unexpected end of chunk");
	}
	async readChunks(remainingSize, handle) {
		while (remainingSize >= ChunkHeader64.len) {
			const header = await this.readToken(ChunkHeader64);
			this.validateChunkSize(header, remainingSize - BigInt(ChunkHeader64.len));
			const source = this.input;
			const payload = createTokenizerView(source, Number(header.chunkSize));
			this.input = payload;
			try {
				await handle(header);
				await this.ignoreBytes(BigInt(payload.remaining));
			} finally {
				this.input = source;
				await payload.close();
			}
			const padding = header.chunkSize & 1n;
			await this.ignoreBytes(padding);
			remainingSize -= BigInt(ChunkHeader64.len) + header.chunkSize + padding;
		}
		return remainingSize;
	}
	async readData(header) {
		debug$22(`Reading data of chunk[ID=${header.chunkID}, size=${header.chunkSize}]`);
		switch (header.chunkID.trim()) {
			case "FVER":
				this.requireChunkSize(header, UINT32_LE.len);
				debug$22(`DSDIFF version=${await this.readToken(UINT32_LE)}`);
				break;
			case "PROP":
				this.requireChunkSize(header, FourCcToken.len);
				if (await this.readToken(FourCcToken) !== "SND ") throw new DsdiffContentParseError("Unexpected PROP-chunk ID");
				await this.handleSoundPropertyChunks(header.chunkSize - BigInt(FourCcToken.len));
				break;
			case "ID3":
				await parseEmbeddedID3v2(this.metadata, this.input, this.options, Number(header.chunkSize));
				break;
			case "DSD":
				if (this.metadata.format.numberOfChannels) this.metadata.setFormat("numberOfSamples", Number(header.chunkSize * BigInt(8) / BigInt(this.metadata.format.numberOfChannels)));
				if (this.metadata.format.numberOfSamples && this.metadata.format.sampleRate) this.metadata.setFormat("duration", this.metadata.format.numberOfSamples / this.metadata.format.sampleRate);
				break;
			default: debug$22(`Ignore chunk[ID=${header.chunkID}, size=${header.chunkSize}]`);
		}
	}
	async handleSoundPropertyChunks(remainingSize) {
		remainingSize = await this.readChunks(remainingSize, async (sndPropHeader) => {
			switch (sndPropHeader.chunkID.trim()) {
				case "FS": {
					this.requireChunkSize(sndPropHeader, UINT32_BE.len);
					const sampleRate = await this.readToken(UINT32_BE);
					this.metadata.setFormat("sampleRate", sampleRate);
					break;
				}
				case "CHNL": {
					this.requireChunkSize(sndPropHeader, UINT16_BE.len);
					const numChannels = await this.readToken(UINT16_BE);
					this.metadata.setFormat("numberOfChannels", numChannels);
					await this.handleChannelChunks(sndPropHeader.chunkSize - BigInt(UINT16_BE.len));
					break;
				}
				case "CMPR": {
					this.requireChunkSize(sndPropHeader, FourCcToken.len + UINT8.len);
					const compressionIdCode = (await this.readToken(FourCcToken)).trim();
					const count = await this.readToken(UINT8);
					this.requireChunkSize(sndPropHeader, FourCcToken.len + UINT8.len + count);
					const compressionName = await this.readToken(new StringType(count, "ascii"));
					if (compressionIdCode === "DSD") {
						this.metadata.setFormat("lossless", true);
						this.metadata.setFormat("bitsPerSample", 1);
					}
					this.metadata.setFormat("codec", `${compressionIdCode} (${compressionName})`);
					break;
				}
				case "ABSS":
					this.requireChunkSize(sndPropHeader, 8);
					debug$22(`ABSS ${await this.readToken(UINT16_BE)}:${await this.readToken(UINT8)}:${await this.readToken(UINT8)}.${await this.readToken(UINT32_BE)}`);
					break;
				case "LSCO":
					this.requireChunkSize(sndPropHeader, UINT16_BE.len);
					debug$22(`LSCO lsConfig=${await this.readToken(UINT16_BE)}`);
					break;
				default: debug$22(`Unknown sound-property-chunk[ID=${sndPropHeader.chunkID}, size=${sndPropHeader.chunkSize}]`);
			}
		});
		if (remainingSize !== 0n) throw new DsdiffContentParseError("Incomplete sound-property chunk header");
		if (this.metadata.format.lossless && this.metadata.format.sampleRate && this.metadata.format.numberOfChannels && this.metadata.format.bitsPerSample) {
			const bitrate = this.metadata.format.sampleRate * this.metadata.format.numberOfChannels * this.metadata.format.bitsPerSample;
			this.metadata.setFormat("bitrate", bitrate);
		}
	}
	async handleChannelChunks(remainingSize) {
		debug$22(`Parsing channel-chunks, remainingSize=${remainingSize}`);
		while (remainingSize >= FourCcToken.len) {
			debug$22(`Channel[ID=${await this.readToken(FourCcToken)}]`);
			remainingSize -= BigInt(FourCcToken.len);
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/AbstractID3Parser.js
var debug$21 = (0, import_src.default)("music-metadata:parser:ID3");
/**
* Abstract parser which tries take ID3v2 and ID3v1 headers.
*/
var AbstractID3Parser = class extends BasicParser {
	static async startsWithID3v2Header(tokenizer) {
		return (await tokenizer.peekToken(ID3v2Header)).fileIdentifier === "ID3";
	}
	id3parser = new ID3v2Parser();
	async parse() {
		try {
			await this.parseID3v2();
		} catch (err) {
			if (err instanceof EndOfStreamError) debug$21("End-of-stream");
			else throw err;
		}
	}
	finalize() {}
	async parseID3v2() {
		await this.tryReadId3v2Headers();
		debug$21("End of ID3v2 header, go to MPEG-parser: pos=%s", this.tokenizer.position);
		await this.postId3v2Parse();
		if (this.options.skipPostHeaders && this.metadata.hasAny()) this.finalize();
		else {
			await new ID3v1Parser(this.metadata, this.tokenizer, this.options).parse();
			this.finalize();
		}
	}
	async tryReadId3v2Headers() {
		if ((await this.tokenizer.peekToken(ID3v2Header)).fileIdentifier === "ID3") {
			debug$21("Found ID3v2 header, pos=%s", this.tokenizer.position);
			await this.id3parser.parse(this.metadata, this.tokenizer, this.options);
			return this.tryReadId3v2Headers();
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsf/DsfChunk.js
/**
* Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
*/
var ChunkHeader = {
	len: 12,
	get: (buf, off) => {
		return {
			id: FourCcToken.get(buf, off),
			size: UINT64_LE.get(buf, off + 4)
		};
	}
};
/**
* Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
*/
var DsdChunk = {
	len: 16,
	get: (buf, off) => {
		return {
			fileSize: UINT64_LE.get(buf, off),
			metadataPointer: UINT64_LE.get(buf, off + 8)
		};
	}
};
/**
* Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
*/
var FormatChunk = {
	len: 40,
	get: (buf, off) => {
		return {
			formatVersion: INT32_LE.get(buf, off),
			formatID: INT32_LE.get(buf, off + 4),
			channelType: INT32_LE.get(buf, off + 8),
			channelNum: INT32_LE.get(buf, off + 12),
			samplingFrequency: INT32_LE.get(buf, off + 16),
			bitsPerSample: INT32_LE.get(buf, off + 20),
			sampleCount: INT64_LE.get(buf, off + 24),
			blockSizePerChannel: INT32_LE.get(buf, off + 32)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsf/DsfParser.js
var DsfParser_exports = /* @__PURE__ */ __exportAll({
	DsdContentParseError: () => DsdContentParseError,
	DsfParser: () => DsfParser
});
var debug$20 = (0, import_src.default)("music-metadata:parser:DSF");
var DsdContentParseError = class extends makeUnexpectedFileContentError("DSD") {};
/**
* DSF (dsd stream file) File Parser
* Ref: https://dsd-guide.com/sites/default/files/white-papers/DSFFileFormatSpec_E.pdf
*/
var DsfParser = class extends AbstractID3Parser {
	async postId3v2Parse() {
		const p0 = this.tokenizer.position;
		const chunkHeader = await this.tokenizer.readToken(ChunkHeader);
		if (chunkHeader.id !== "DSD ") throw new DsdContentParseError("Invalid chunk signature");
		if (chunkHeader.size !== BigInt(ChunkHeader.len + DsdChunk.len)) throw new DsdContentParseError(`Invalid DSD chunk size: ${chunkHeader.size}`);
		this.metadata.setFormat("container", "DSF");
		this.metadata.setFormat("lossless", true);
		this.metadata.setAudioOnly();
		const dsdChunk = await this.tokenizer.readToken(DsdChunk);
		if (dsdChunk.fileSize < chunkHeader.size) throw new DsdContentParseError(`Invalid DSF file size: ${dsdChunk.fileSize}`);
		await this.parseChunks(dsdChunk.fileSize - chunkHeader.size);
		if (dsdChunk.metadataPointer === 0n) {
			debug$20("No ID3v2 tag present");
			return;
		}
		debug$20(`expect ID3v2 at offset=${dsdChunk.metadataPointer}`);
		const metadataOffset = dsdChunk.metadataPointer - BigInt(this.tokenizer.position - p0);
		if (metadataOffset < 0n || metadataOffset > BigInt(Number.MAX_SAFE_INTEGER) || dsdChunk.metadataPointer + BigInt(ID3v2Header.len) > dsdChunk.fileSize) throw new DsdContentParseError(`Invalid metadata pointer: ${dsdChunk.metadataPointer}`);
		await this.tokenizer.ignore(Number(metadataOffset));
		return new ID3v2Parser().parse(this.metadata, this.tokenizer, this.options);
	}
	async parseChunks(bytesRemaining) {
		const chunkHeaderSize = BigInt(ChunkHeader.len);
		while (bytesRemaining >= chunkHeaderSize) {
			const chunkHeader = await this.tokenizer.readToken(ChunkHeader);
			debug$20(`Parsing chunk name=${chunkHeader.id} size=${chunkHeader.size}`);
			if (chunkHeader.size < chunkHeaderSize) throw new DsdContentParseError(`Invalid ${chunkHeader.id} chunk size: ${chunkHeader.size}`);
			if (chunkHeader.size > bytesRemaining) throw new DsdContentParseError(`${chunkHeader.id} chunk exceeds remaining file size`);
			const payloadSize = chunkHeader.size - chunkHeaderSize;
			switch (chunkHeader.id) {
				case "fmt ": {
					if (payloadSize < BigInt(FormatChunk.len)) throw new DsdContentParseError(`Invalid fmt chunk size: ${chunkHeader.size}`);
					const formatChunk = await this.tokenizer.readToken(FormatChunk);
					this.metadata.setFormat("numberOfChannels", formatChunk.channelNum);
					this.metadata.setFormat("sampleRate", formatChunk.samplingFrequency);
					this.metadata.setFormat("bitsPerSample", formatChunk.bitsPerSample);
					this.metadata.setFormat("numberOfSamples", Number(formatChunk.sampleCount));
					this.metadata.setFormat("duration", Number(formatChunk.sampleCount) / formatChunk.samplingFrequency);
					const bitrate = formatChunk.bitsPerSample * formatChunk.samplingFrequency * formatChunk.channelNum;
					this.metadata.setFormat("bitrate", bitrate);
					return;
				}
				default: await this.tokenizer.ignore(Number(payloadSize));
			}
			bytesRemaining -= chunkHeader.size;
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/Base64.js
var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var BASE64_TABLE = /* @__PURE__ */ new Uint8Array(256);
for (let i = 0; i < 256; i++) BASE64_TABLE[i] = 255;
for (let i = 0; i < 64; i++) BASE64_TABLE[BASE64_CHARS.charCodeAt(i)] = i;
/**
* Decode a base64 string into a Uint8Array.
*
* Uses native `atob` (available in Node.js ≥ 22 and browsers).
* Invalid characters are skipped for lenient decoding.
*/
function decodeBase64(value) {
	const normalized = value.includes(" ") || value.includes("\n") || value.includes("	") || value.includes("\r") ? value.replace(/\s/g, "") : value;
	try {
		const binary = atob(normalized);
		const result = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) result[i] = binary.charCodeAt(i);
		return result;
	} catch {
		const length = Math.floor(normalized.length * 3 / 4);
		const result = new Uint8Array(length);
		let resultIndex = 0;
		let buffer = 0;
		let bits = 0;
		for (let i = 0; i < normalized.length; i++) {
			const char = normalized.charCodeAt(i);
			const charValue = char < 256 ? BASE64_TABLE[char] : 255;
			if (charValue === 255) continue;
			buffer = buffer << 6 | charValue;
			bits += 6;
			if (bits >= 8) {
				bits -= 8;
				result[resultIndex++] = buffer >> bits & 255;
			}
		}
		return result.subarray(0, resultIndex);
	}
}
//#endregion
//#region node_modules/music-metadata/lib/tokens/flac.js
/**
* FLAC supports up to 128 kinds of metadata blocks; currently the following are defined:
* Ref: https://xiph.org/flac/format.html#metadata_block
*/
var BlockType = {
	STREAMINFO: 0,
	PADDING: 1,
	APPLICATION: 2,
	SEEKTABLE: 3,
	VORBIS_COMMENT: 4,
	CUESHEET: 5,
	PICTURE: 6
};
function ensureAvailable(buffer, offset, length, createError) {
	if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > buffer.length) throw createError(`Cannot read ${length} byte(s) at offset ${offset} from a ${buffer.length}-byte buffer`);
}
var MAX_BLOCK_LENGTH = 16777215;
/**
* FLAC METADATA_BLOCK_HEADER.
* Ref: https://xiph.org/flac/format.html#metadata_block
*/
var BlockHeader = {
	len: 4,
	get(buffer, offset) {
		ensureAvailable(buffer, offset, BlockHeader.len, (message) => new RangeError(message));
		return {
			lastBlock: (buffer[offset] & 128) !== 0,
			type: buffer[offset] & 127,
			length: UINT24_BE.get(buffer, offset + 1)
		};
	},
	put(buffer, offset, value) {
		ensureAvailable(buffer, offset, BlockHeader.len, (message) => new RangeError(message));
		if (!Number.isSafeInteger(value.length) || value.length < 0 || value.length > MAX_BLOCK_LENGTH) throw new RangeError(`FLAC metadata block length must be between 0 and ${MAX_BLOCK_LENGTH}, got ${value.length}`);
		if (!Number.isSafeInteger(value.type) || value.type < 0 || value.type > 126) throw new RangeError(`FLAC metadata block type must be between 0 and 126, got ${value.type}`);
		buffer[offset] = (value.lastBlock ? 128 : 0) | value.type;
		return UINT24_BE.put(buffer, offset + 1, value.length);
	}
};
/**
* Decode a FLAC PICTURE block body.
*
* The decoder validates every length before reading, so a forged length cannot
* make it read outside the supplied buffer. It does not impose a policy limit
* on the picture data itself; callers should bound the block before calling it.
*/
function decodePicture(buffer, offset = 0, options = {}) {
	const createError = options.createError ?? ((message) => new RangeError(message));
	ensureAvailable(buffer, offset, 32, createError);
	let cursor = offset;
	const typeId = UINT32_BE.get(buffer, cursor);
	cursor += 4;
	const formatLength = UINT32_BE.get(buffer, cursor);
	cursor += 4;
	ensureAvailable(buffer, cursor, formatLength, createError);
	const format = textDecode(buffer.subarray(cursor, cursor + formatLength), "utf-8");
	cursor += formatLength;
	ensureAvailable(buffer, cursor, 4, createError);
	const descriptionLength = UINT32_BE.get(buffer, cursor);
	cursor += 4;
	ensureAvailable(buffer, cursor, descriptionLength, createError);
	const description = textDecode(buffer.subarray(cursor, cursor + descriptionLength), "utf-8");
	cursor += descriptionLength;
	ensureAvailable(buffer, cursor, 20, createError);
	const width = UINT32_BE.get(buffer, cursor);
	cursor += 4;
	const height = UINT32_BE.get(buffer, cursor);
	cursor += 4;
	const colourDepth = UINT32_BE.get(buffer, cursor);
	cursor += 4;
	const colours = UINT32_BE.get(buffer, cursor);
	cursor += 4;
	const dataLength = UINT32_BE.get(buffer, cursor);
	cursor += 4;
	ensureAvailable(buffer, cursor, dataLength, createError);
	const data = new Uint8Array(buffer.subarray(cursor, cursor + dataLength));
	cursor += dataLength;
	if (options.requireExactData && cursor !== buffer.length) throw createError(`FLAC PICTURE has ${buffer.length - cursor} trailing byte(s)`);
	return {
		typeId,
		type: attachedPictureType(typeId),
		format,
		description,
		width,
		height,
		colour_depth: colourDepth,
		indexed_color: colours,
		colourDepth,
		colours,
		data
	};
}
//#endregion
//#region node_modules/music-metadata/lib/ogg/vorbis/Vorbis.js
/**
* Parse the METADATA_BLOCK_PICTURE
* Ref: https://wiki.xiph.org/VorbisComment#METADATA_BLOCK_PICTURE
* Ref: https://xiph.org/flac/format.html#metadata_block_picture
*/
var VorbisPictureToken = class VorbisPictureToken {
	options;
	static fromBase64(base64str) {
		return VorbisPictureToken.fromBuffer(decodeBase64(base64str));
	}
	static fromBuffer(buffer) {
		return new VorbisPictureToken(buffer.length).get(buffer, 0);
	}
	len;
	constructor(len, options = {}) {
		this.options = options;
		this.len = len;
	}
	get(buffer, offset) {
		return decodePicture(buffer.subarray(offset, offset + this.len), 0, this.options);
	}
};
/**
* Comment header decoder
* Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-620004.2.1
*/
var CommonHeader = {
	len: 7,
	get: (buf, off) => {
		return {
			packetType: UINT8.get(buf, off),
			vorbis: new StringType(6, "ascii").get(buf, off + 1)
		};
	}
};
/**
* Identification header decoder
* Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-630004.2.2
*/
var IdentificationHeader$1 = {
	len: 23,
	get: (uint8Array, off) => {
		return {
			version: UINT32_LE.get(uint8Array, off + 0),
			channelMode: UINT8.get(uint8Array, off + 4),
			sampleRate: UINT32_LE.get(uint8Array, off + 5),
			bitrateMax: INT32_LE.get(uint8Array, off + 9),
			bitrateNominal: INT32_LE.get(uint8Array, off + 13),
			bitrateMin: INT32_LE.get(uint8Array, off + 17)
		};
	}
};
function validateMaxComments(maxComments) {
	if (maxComments !== Number.POSITIVE_INFINITY && (!Number.isSafeInteger(maxComments) || maxComments < 0)) throw new RangeError("maxComments must be a non-negative safe integer or Infinity");
}
var VorbisCommentError$1 = class extends Error {
	constructor(message) {
		super(message);
		this.name = "VorbisCommentError";
	}
};
/**
* Low-level Vorbis Comment reader.
*
* The decoder preserves the original key spelling, order and duplicates. It
* leaves packet framing, tag normalization and metadata policy to callers.
*/
var VorbisDecoder$1 = class {
	data;
	offset;
	createError;
	maxComments;
	constructor(data, offset = 0, options = {}) {
		if (!Number.isSafeInteger(offset) || offset < 0 || offset > data.length) throw new RangeError(`Invalid Vorbis Comment offset ${offset} for a ${data.length}-byte buffer`);
		this.data = data;
		this.offset = offset;
		this.createError = options.createError ?? ((message) => new VorbisCommentError$1(message));
		this.maxComments = options.maxComments ?? 1e5;
		validateMaxComments(this.maxComments);
	}
	get remaining() {
		return this.data.length - this.offset;
	}
	readInt32() {
		if (this.remaining < 4) throw this.createError("Truncated Vorbis comment length");
		const value = UINT32_LE.get(this.data, this.offset);
		this.offset += 4;
		return value;
	}
	readStringUtf8() {
		const length = this.readInt32();
		if (length > this.remaining) throw this.createError(`Vorbis comment length ${length} exceeds remaining data ${this.remaining}`);
		const value = textDecode(this.data.subarray(this.offset, this.offset + length), "utf-8");
		this.offset += length;
		return value;
	}
	/**
	* Decode the shared structure, leaving packet framing and metadata policy to
	* callers. Iterating the returned comments consumes the underlying buffer.
	*/
	parseCommentList(createCountError = this.createError, maxComments = this.maxComments) {
		validateMaxComments(maxComments);
		const vendor = this.readStringUtf8();
		const count = this.readInt32();
		if (count > Math.floor(this.remaining / 4)) throw createCountError(`Vorbis comment count ${count} exceeds remaining data`);
		if (count > maxComments) throw createCountError(`Vorbis comment count ${count} exceeds entry limit ${maxComments}`);
		return {
			vendor,
			comments: this.parseUserComments(count)
		};
	}
	parseUserComment() {
		const offset0 = this.offset;
		const value = this.readStringUtf8();
		const separator = value.indexOf("=");
		return {
			key: value.substring(0, separator),
			value: value.substring(separator + 1),
			len: this.offset - offset0
		};
	}
	*parseUserComments(count) {
		for (let index = 0; index < count; index++) yield this.parseUserComment();
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/vorbis/VorbisDecoder.js
var VorbisCommentError = class extends makeUnexpectedFileContentError("Vorbis") {};
/**
* Vorbis Comment decoder used by the reader.
*
* The shared decoder preserves the original key spelling; this boundary
* uppercases keys to keep `music-metadata`'s native-tag behavior unchanged.
*/
var VorbisDecoder = class extends VorbisDecoder$1 {
	constructor(data, offset = 0, options = {}) {
		super(data, offset, {
			createError: (message) => new VorbisCommentError(message),
			maxComments: options.maxComments ?? 1e5
		});
	}
	parseUserComment() {
		const tag = super.parseUserComment();
		return {
			...tag,
			key: tag.key.toUpperCase()
		};
	}
	parseCommentList(createCountError, maxComments) {
		return super.parseCommentList(createCountError, maxComments);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/vorbis/VorbisStream.js
var debug$19 = (0, import_src.default)("music-metadata:parser:ogg:vorbis1");
var VorbisContentError = class extends makeUnexpectedFileContentError("Vorbis") {};
/**
* Vorbis 1 Parser.
* Used by OggStream
*/
var VorbisStream = class {
	pageSegments = [];
	bufferedPageLength = 0;
	metadata;
	options;
	lastPageHeader;
	maxBufferedSegments;
	durationOnLastPage = true;
	isMetadataComplete = false;
	constructor(metadata, options) {
		this.metadata = metadata;
		this.options = options;
		this.maxBufferedSegments = getMaxMetadataEntries(options);
	}
	/**
	* Vorbis 1 parser
	* @param header Ogg Page Header
	* @param pageData Page data
	*/
	async parsePage(header, pageData) {
		this.lastPageHeader = header;
		if (header.headerType.firstPage) this.parseFirstPage(header, pageData);
		else {
			if (header.headerType.continued) {
				if (this.pageSegments.length === 0) throw new VorbisContentError("Cannot continue on previous page");
				validateAllocation(this.bufferedPageLength + pageData.length, this.options);
				if (this.pageSegments.length >= this.maxBufferedSegments) throw new VorbisContentError("Buffered Ogg page count exceeds entry limit");
				this.pageSegments.push(pageData);
				this.bufferedPageLength += pageData.length;
			}
			if (header.headerType.lastPage || !header.headerType.continued) {
				if (this.pageSegments.length > 0) {
					const fullPage = this.mergeUint8Arrays(this.pageSegments);
					await this.parseFullPage(fullPage);
				}
				this.bufferedPageLength = header.headerType.lastPage ? 0 : pageData.length;
				validateAllocation(this.bufferedPageLength, this.options);
				this.pageSegments = header.headerType.lastPage ? [] : [pageData];
			}
		}
	}
	mergeUint8Arrays(arrays) {
		const totalSize = arrays.reduce((acc, e) => acc + e.length, 0);
		validateAllocation(totalSize, this.options);
		const merged = new Uint8Array(totalSize);
		let offset = 0;
		for (const array of arrays) {
			merged.set(array, offset);
			offset += array.length;
		}
		return merged;
	}
	async flush() {
		if (this.pageSegments.length === 0) return;
		await this.parseFullPage(this.mergeUint8Arrays(this.pageSegments));
	}
	async parseUserComment(pageData, offset) {
		const tag = new VorbisDecoder(pageData, offset).parseUserComment();
		await this.addTag(tag.key, tag.value);
		return tag.len;
	}
	async addTag(id, value) {
		if (id === "METADATA_BLOCK_PICTURE" && typeof value === "string") {
			if (this.options.skipCovers) {
				debug$19("Ignore picture");
				return;
			}
			value = VorbisPictureToken.fromBase64(value);
			debug$19(`Push picture: id=${id}, format=${value.format}`);
		} else debug$19(`Push tag: id=${id}, value=${value}`);
		await this.metadata.addTag("vorbis", id, value);
	}
	calculateDuration(enfOfStream) {
		if (this.lastPageHeader && (enfOfStream || this.lastPageHeader.headerType.lastPage) && this.metadata.format.sampleRate && this.lastPageHeader.absoluteGranulePosition >= 0) {
			this.metadata.setFormat("numberOfSamples", this.lastPageHeader.absoluteGranulePosition);
			this.metadata.setFormat("duration", this.lastPageHeader.absoluteGranulePosition / this.metadata.format.sampleRate);
		}
	}
	/**
	* Parse first Ogg/Vorbis page
	* @param _header
	* @param pageData
	*/
	parseFirstPage(_header, pageData) {
		this.metadata.setFormat("codec", "Vorbis I");
		this.metadata.setFormat("lossless", false);
		this.metadata.setFormat("hasAudio", true);
		debug$19("Parse first page");
		if (pageData.length < CommonHeader.len) throw new VorbisContentError("Truncated Vorbis packet header");
		const commonHeader = CommonHeader.get(pageData, 0);
		if (commonHeader.vorbis !== "vorbis") throw new VorbisContentError("Metadata does not look like Vorbis");
		if (commonHeader.packetType === 1) {
			if (pageData.length < CommonHeader.len + IdentificationHeader$1.len) throw new VorbisContentError("Truncated Vorbis identification header");
			const idHeader = IdentificationHeader$1.get(pageData, CommonHeader.len);
			this.metadata.setFormat("sampleRate", idHeader.sampleRate);
			this.metadata.setFormat("bitrate", idHeader.bitrateNominal);
			this.metadata.setFormat("numberOfChannels", idHeader.channelMode);
			debug$19("sample-rate=%s[hz], bitrate=%s[b/s], channel-mode=%s", idHeader.sampleRate, idHeader.bitrateNominal, idHeader.channelMode);
		} else throw new VorbisContentError("First Ogg page should be type 1: the identification header");
	}
	async parseFullPage(pageData) {
		if (pageData.length > 0 && (pageData[0] & 1) === 0) return;
		if (pageData.length < CommonHeader.len) throw new VorbisContentError("Truncated Vorbis packet header");
		const commonHeader = CommonHeader.get(pageData, 0);
		debug$19("Parse full page: type=%s, byteLength=%s", commonHeader.packetType, pageData.byteLength);
		switch (commonHeader.packetType) {
			case 3: return this.parseUserCommentList(pageData, CommonHeader.len);
		}
	}
	/**
	* Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-840005.2
	*/
	async parseUserCommentList(pageData, offset) {
		const { comments } = new VorbisDecoder(pageData, offset).parseCommentList((message) => new VorbisContentError(message), getMaxMetadataEntries(this.options));
		for (const tag of comments) await this.addTag(tag.key, tag.value);
		this.isMetadataComplete = true;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/flac/FlacToken.js
/**
* METADATA_BLOCK_DATA
* Ref: https://xiph.org/flac/format.html#metadata_block_streaminfo
*/
var BlockStreamInfo = {
	len: 34,
	get: (buf, off) => {
		return {
			minimumBlockSize: UINT16_BE.get(buf, off),
			maximumBlockSize: UINT16_BE.get(buf, off + 2),
			minimumFrameSize: UINT24_BE.get(buf, off + 4),
			maximumFrameSize: UINT24_BE.get(buf, off + 7),
			sampleRate: UINT24_BE.get(buf, off + 10) >> 4,
			channels: getBitAllignedNumber$1(buf, off + 12, 4, 3) + 1,
			bitsPerSample: getBitAllignedNumber$1(buf, off + 12, 7, 5) + 1,
			totalSamples: getBitAllignedNumber$1(buf, off + 13, 4, 36),
			fileMD5: new Uint8ArrayType(16).get(buf, off + 18)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/flac/FlacParser.js
var FlacParser_exports = /* @__PURE__ */ __exportAll({ FlacParser: () => FlacParser });
var debug$18 = (0, import_src.default)("music-metadata:parser:FLAC");
var FlacContentError$1 = class extends makeUnexpectedFileContentError("FLAC") {};
var FlacParser = class extends AbstractID3Parser {
	vorbisParser = new VorbisStream(this.metadata, this.options);
	async postId3v2Parse() {
		if ((await this.readToken(FourCcToken)).toString() !== "fLaC") throw new FlacContentError$1("Invalid FLAC preamble");
		let blockHeader;
		do {
			blockHeader = await this.readToken(BlockHeader);
			await this.parseDataBlock(blockHeader);
		} while (!blockHeader.lastBlock);
		if (this.tokenizer.fileInfo.size && this.metadata.format.duration) {
			const dataSize = this.tokenizer.fileInfo.size - this.tokenizer.position;
			this.metadata.setFormat("bitrate", 8 * dataSize / this.metadata.format.duration);
		}
	}
	async parseDataBlock(blockHeader) {
		debug$18(`blockHeader type=${blockHeader.type}, length=${blockHeader.length}`);
		switch (blockHeader.type) {
			case BlockType.STREAMINFO: return this.readBlockStreamInfo(blockHeader.length);
			case BlockType.PADDING: break;
			case BlockType.APPLICATION: break;
			case BlockType.SEEKTABLE: break;
			case BlockType.VORBIS_COMMENT: return this.readComment(blockHeader.length);
			case BlockType.CUESHEET: break;
			case BlockType.PICTURE:
				await this.parsePicture(blockHeader.length);
				return;
			default: this.metadata.addWarning(`Unknown block type: ${blockHeader.type}`);
		}
		return this.tokenizer.ignore(blockHeader.length).then();
	}
	/**
	* Parse STREAMINFO
	*/
	async readBlockStreamInfo(dataLen) {
		if (dataLen !== BlockStreamInfo.len) throw new FlacContentError$1("Unexpected block-stream-info length");
		const streamInfo = await this.readToken(BlockStreamInfo);
		this.metadata.setFormat("container", "FLAC");
		this.processsStreamInfo(streamInfo);
	}
	/**
	* Parse STREAMINFO
	*/
	processsStreamInfo(streamInfo) {
		this.metadata.setFormat("codec", "FLAC");
		this.metadata.setFormat("hasAudio", true);
		this.metadata.setFormat("lossless", true);
		this.metadata.setFormat("numberOfChannels", streamInfo.channels);
		this.metadata.setFormat("bitsPerSample", streamInfo.bitsPerSample);
		this.metadata.setFormat("sampleRate", streamInfo.sampleRate);
		if (streamInfo.totalSamples > 0) this.metadata.setFormat("duration", streamInfo.totalSamples / streamInfo.sampleRate);
	}
	/**
	* Read VORBIS_COMMENT from tokenizer
	* Ref: https://www.xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-640004.2.3
	*/
	async readComment(dataLen) {
		const data = await this.readToken(new Uint8ArrayType(dataLen));
		return this.parseComment(data);
	}
	/**
	* Parse VORBIS_COMMENT
	* Ref: https://www.xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-640004.2.3
	*/
	async parseComment(data) {
		const { vendor, comments } = new VorbisDecoder(data, 0).parseCommentList((message) => new FlacContentError$1(message), getMaxMetadataEntries(this.options));
		if (vendor.length > 0) this.metadata.setFormat("tool", vendor);
		for (const tag of comments) {
			if (tag.key === "ENCODER") this.metadata.setFormat("tool", tag.value);
			await this.addTag(tag.key, tag.value);
		}
	}
	async parsePicture(dataLen) {
		if (this.options.skipCovers) return this.tokenizer.ignore(dataLen);
		return this.addPictureTag(await this.readToken(new VorbisPictureToken(dataLen, { createError: (message) => new FlacContentError$1(message) })));
	}
	addPictureTag(picture) {
		return this.addTag("METADATA_BLOCK_PICTURE", picture);
	}
	addTag(id, value) {
		return this.vorbisParser.addTag(id, value);
	}
};
async function getLyricsHeaderLength(tokenizer) {
	const fileSize = tokenizer.fileInfo.size;
	if (fileSize >= 143) {
		const buf = /* @__PURE__ */ new Uint8Array(15);
		const position = tokenizer.position;
		await tokenizer.readBuffer(buf, { position: fileSize - 143 });
		tokenizer.setPosition(position);
		const txt = textDecode(buf, "latin1");
		if (txt.substring(6) === "LYRICS200") return Number.parseInt(txt.substring(0, 6), 10) + 15;
	}
	return 0;
}
//#endregion
//#region node_modules/music-metadata/lib/aiff/AiffLoader.js
var aiffParserLoader = {
	parserType: "aiff",
	extensions: [
		".aif",
		"aiff",
		"aifc"
	],
	mimeTypes: [
		"audio/aiff",
		"audio/aif",
		"audio/aifc",
		"application/aiff"
	],
	async load() {
		return (await Promise.resolve().then(() => AiffParser_exports)).AIFFParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/apev2/Apev2Loader.js
var apeParserLoader = {
	parserType: "apev2",
	extensions: [".ape"],
	mimeTypes: ["audio/ape", "audio/monkeys-audio"],
	async load() {
		return (await Promise.resolve().then(() => APEv2Parser_exports)).APEv2Parser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfLoader.js
var asfParserLoader = {
	parserType: "asf",
	extensions: [
		".asf",
		".wma",
		".wmv"
	],
	mimeTypes: [
		"audio/ms-wma",
		"video/ms-wmv",
		"audio/ms-asf",
		"video/ms-asf",
		"application/vnd.ms-asf"
	],
	async load() {
		return (await Promise.resolve().then(() => AsfParser_exports)).AsfParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/caf/CafLoader.js
var cafParserLoader = {
	parserType: "caf",
	extensions: [".caf", ".caff"],
	mimeTypes: ["audio/caf", "application/caf"],
	async load() {
		return (await Promise.resolve().then(() => CafParser_exports)).CafParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/lrc/LyricsParser.js
var TIMESTAMP_REGEX = /\[(\d{2}):(\d{2})\.(\d{2,3})]/;
var LyricsContentError = class extends makeUnexpectedFileContentError("lyrics") {};
function parseLyrics(input, maxLines = defaultMaxMetadataEntries) {
	if (TIMESTAMP_REGEX.test(input)) return parseLrc(input, maxLines);
	return toUnsyncedLyrics(input);
}
/**
* Complete a reader-produced lyrics value with the fields required by
* `ILyricsTag`. ID3 USLT/ULT values are plain comments before this step.
*/
function normalizeLyricsTag(lyrics) {
	return {
		...lyrics,
		contentType: lyrics.contentType ?? LyricsContentType.lyrics,
		timeStampFormat: lyrics.timeStampFormat ?? TimestampFormat.notSynchronized,
		syncText: lyrics.syncText ?? []
	};
}
function toUnsyncedLyrics(lyrics) {
	return {
		contentType: LyricsContentType.lyrics,
		timeStampFormat: TimestampFormat.notSynchronized,
		text: lyrics.trim(),
		syncText: []
	};
}
/**
* Parse LRC (Lyrics) formatted text
* Ref: https://en.wikipedia.org/wiki/LRC_(file_format)
* @param lrcString
*/
function parseLrc(lrcString, maxLines = defaultMaxMetadataEntries) {
	let lineCount = 1;
	for (let offset = lrcString.indexOf("\n"); offset >= 0; offset = lrcString.indexOf("\n", offset + 1)) ++lineCount;
	if (lineCount > maxLines) throw new LyricsContentError(`Line count ${lineCount} exceeds entry limit ${maxLines}`);
	const lines = lrcString.split("\n");
	const syncText = [];
	for (const line of lines) {
		const match = line.match(TIMESTAMP_REGEX);
		if (match) {
			const minutes = Number.parseInt(match[1], 10);
			const seconds = Number.parseInt(match[2], 10);
			const ms = match[3].length === 3 ? Number.parseInt(match[3], 10) : Number.parseInt(match[3], 10) * 10;
			const timestamp = (minutes * 60 + seconds) * 1e3 + ms;
			const text = line.replace(TIMESTAMP_REGEX, "").trim();
			syncText.push({
				timestamp,
				text
			});
		}
	}
	return {
		contentType: LyricsContentType.lyrics,
		timeStampFormat: TimestampFormat.milliseconds,
		text: syncText.map((line) => line.text).join("\n"),
		syncText
	};
}
//#endregion
//#region node_modules/music-metadata/lib/common/GenericTagMapper.js
var CommonTagMapper = class {
	static maxRatingScore = 1;
	static toIntOrNull(str) {
		const cleaned = Number.parseInt(str, 10);
		return Number.isNaN(cleaned) ? null : cleaned;
	}
	static normalizeTrack(origVal) {
		const split = origVal.toString().split("/", 2);
		return {
			no: Number.parseInt(split[0], 10) || null,
			of: Number.parseInt(split[1], 10) || null
		};
	}
	tagTypes;
	tagMap;
	constructor(tagTypes, tagMap) {
		this.tagTypes = tagTypes;
		this.tagMap = tagMap;
	}
	/**
	* Process and set common tags
	* write common tags to
	* @param tag Native tag
	* @param warnings Register warnings
	* @return common name
	*/
	mapGenericTag(tag, warnings) {
		tag = {
			id: tag.id,
			value: tag.value
		};
		this.postMap(tag, warnings);
		const id = this.getCommonName(tag.id);
		return id ? {
			id,
			value: tag.value
		} : null;
	}
	/**
	* Convert native tag key to common tag key
	* @param tag Native header tag
	* @return common tag name (alias)
	*/
	getCommonName(tag) {
		return Object.hasOwn(this.tagMap, tag) ? this.tagMap[tag] : void 0;
	}
	/**
	* Handle post mapping exceptions / correction
	* @param tag Tag e.g. {"©alb", "Buena Vista Social Club")
	* @param warnings Used to register warnings
	*/
	postMap(_tag, _warnings) {}
};
//#endregion
//#region node_modules/music-metadata/lib/aiff/AiffTagMap.js
/**
* ID3v1 tag mappings
*/
var tagMap = {
	NAME: "title",
	AUTH: "artist",
	"(c) ": "copyright",
	ANNO: "comment"
};
var AiffTagMapper = class extends CommonTagMapper {
	constructor() {
		super(["AIFF"], tagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/CaseInsensitiveTagMap.js
var CaseInsensitiveTagMap = class extends CommonTagMapper {
	constructor(tagTypes, tagMap) {
		const upperCaseMap = {};
		for (const [tag, commonName] of Object.entries(tagMap)) upperCaseMap[tag.toUpperCase()] = commonName;
		super(tagTypes, upperCaseMap);
	}
	/**
	* @tag  Native header tag
	* @return common tag name (alias)
	*/
	getCommonName(tag) {
		return super.getCommonName(tag.toUpperCase());
	}
};
//#endregion
//#region node_modules/music-metadata/lib/apev2/APEv2TagMapper.js
/**
* ID3v2.2 tag mappings
*/
var apev2TagMap = {
	Title: "title",
	Artist: "artist",
	Artists: "artists",
	"Album Artist": "albumartist",
	Album: "album",
	Year: "date",
	Date: "date",
	Originalyear: "originalyear",
	Originaldate: "originaldate",
	Releasedate: "releasedate",
	Comment: "comment",
	Track: "track",
	Disc: "disk",
	DISCNUMBER: "disk",
	Genre: "genre",
	"Cover Art (Front)": "picture",
	"Cover Art (Back)": "picture",
	Composer: "composer",
	Lyrics: "lyrics",
	ALBUMSORT: "albumsort",
	TITLESORT: "titlesort",
	WORK: "work",
	ARTISTSORT: "artistsort",
	ALBUMARTISTSORT: "albumartistsort",
	COMPOSERSORT: "composersort",
	Lyricist: "lyricist",
	Writer: "writer",
	Conductor: "conductor",
	MixArtist: "remixer",
	Arranger: "arranger",
	Engineer: "engineer",
	Producer: "producer",
	DJMixer: "djmixer",
	Mixer: "mixer",
	Label: "label",
	Grouping: "grouping",
	Subtitle: "subtitle",
	DiscSubtitle: "discsubtitle",
	Compilation: "compilation",
	BPM: "bpm",
	Mood: "mood",
	Media: "media",
	CatalogNumber: "catalognumber",
	MUSICBRAINZ_ALBUMSTATUS: "releasestatus",
	MUSICBRAINZ_ALBUMTYPE: "releasetype",
	RELEASECOUNTRY: "releasecountry",
	Script: "script",
	Language: "language",
	Copyright: "copyright",
	LICENSE: "license",
	EncodedBy: "encodedby",
	EncoderSettings: "encodersettings",
	Barcode: "barcode",
	ISRC: "isrc",
	ASIN: "asin",
	musicbrainz_trackid: "musicbrainz_recordingid",
	musicbrainz_releasetrackid: "musicbrainz_trackid",
	MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
	MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
	MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
	MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
	MUSICBRAINZ_WORKID: "musicbrainz_workid",
	MUSICBRAINZ_TRMID: "musicbrainz_trmid",
	MUSICBRAINZ_DISCID: "musicbrainz_discid",
	Acoustid_Id: "acoustid_id",
	ACOUSTID_FINGERPRINT: "acoustid_fingerprint",
	MUSICIP_PUID: "musicip_puid",
	Weblink: "website",
	REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
	REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
	MP3GAIN_MINMAX: "replaygain_track_minmax",
	MP3GAIN_UNDO: "replaygain_undo"
};
var APEv2TagMapper = class extends CaseInsensitiveTagMap {
	constructor() {
		super(["APEv2"], apev2TagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfTagMapper.js
/**
* ASF Metadata tag mappings.
* See http://msdn.microsoft.com/en-us/library/ms867702.aspx
*/
var asfTagMap = {
	Title: "title",
	Author: "artist",
	"WM/AlbumArtist": "albumartist",
	"WM/AlbumTitle": "album",
	"WM/Year": "date",
	"WM/OriginalReleaseTime": "originaldate",
	"WM/OriginalReleaseYear": "originalyear",
	Description: "comment",
	"WM/TrackNumber": "track",
	TotalTracks: "totaltracks",
	"WM/PartOfSet": "disk",
	"WM/Genre": "genre",
	"WM/Composer": "composer",
	"WM/Lyrics": "lyrics",
	"WM/AlbumSortOrder": "albumsort",
	"WM/TitleSortOrder": "titlesort",
	"WM/ArtistSortOrder": "artistsort",
	"WM/AlbumArtistSortOrder": "albumartistsort",
	"WM/ComposerSortOrder": "composersort",
	"WM/Writer": "lyricist",
	"WM/Conductor": "conductor",
	"WM/ModifiedBy": "remixer",
	"WM/Engineer": "engineer",
	"WM/Producer": "producer",
	"WM/DJMixer": "djmixer",
	"WM/Mixer": "mixer",
	"WM/Publisher": "label",
	"WM/ContentGroupDescription": "grouping",
	"WM/SubTitle": "subtitle",
	"WM/SetSubTitle": "discsubtitle",
	REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
	REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
	REPLAYGAIN_ALBUM_GAIN: "replaygain_album_gain",
	REPLAYGAIN_ALBUM_PEAK: "replaygain_album_peak",
	replaygain_track_gain: "replaygain_track_gain",
	replaygain_track_peak: "replaygain_track_peak",
	replaygain_album_gain: "replaygain_album_gain",
	replaygain_album_peak: "replaygain_album_peak",
	"WM/IsCompilation": "compilation",
	"WM/SharedUserRating": "rating",
	POPULARIMETER: "rating",
	"WM/BeatsPerMinute": "bpm",
	"WM/Mood": "mood",
	"WM/Media": "media",
	"WM/CatalogNo": "catalognumber",
	"MusicBrainz/Album Status": "releasestatus",
	"MusicBrainz/Album Type": "releasetype",
	"MusicBrainz/Album Release Country": "releasecountry",
	"WM/Script": "script",
	"WM/Language": "language",
	Copyright: "copyright",
	LICENSE: "license",
	"WM/EncodedBy": "encodedby",
	"WM/EncodingSettings": "encodersettings",
	"WM/Barcode": "barcode",
	"WM/ISRC": "isrc",
	"MusicBrainz/Track Id": "musicbrainz_recordingid",
	"MusicBrainz/Release Track Id": "musicbrainz_trackid",
	"MusicBrainz/Album Id": "musicbrainz_albumid",
	"MusicBrainz/Artist Id": "musicbrainz_artistid",
	"MusicBrainz/Album Artist Id": "musicbrainz_albumartistid",
	"MusicBrainz/Release Group Id": "musicbrainz_releasegroupid",
	"MusicBrainz/Work Id": "musicbrainz_workid",
	"MusicBrainz/TRM Id": "musicbrainz_trmid",
	"MusicBrainz/Disc Id": "musicbrainz_discid",
	"Acoustid/Id": "acoustid_id",
	"Acoustid/Fingerprint": "acoustid_fingerprint",
	"MusicIP/PUID": "musicip_puid",
	"WM/ARTISTS": "artists",
	"WM/InitialKey": "key",
	ASIN: "asin",
	"WM/Work": "work",
	"WM/AuthorURL": "website",
	"WM/Picture": "picture"
};
var AsfTagMapper = class AsfTagMapper extends CommonTagMapper {
	static toRating(rating) {
		const value = typeof rating === "number" ? rating : Number.parseFloat(rating);
		if (!Number.isFinite(value) || value <= 0) return { rating: void 0 };
		return { rating: value / 99 };
	}
	constructor() {
		super(["asf"], asfTagMap);
	}
	postMap(tag, warnings) {
		if (this.getCommonName(tag.id)?.startsWith("replaygain_")) {
			const value = typeof tag.value === "string" ? tag.value.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(dB)?$/i) : null;
			const normalized = value ? `${value[1]}${value[2] ? " dB" : ""}` : void 0;
			const ratio = normalized ? toRatio(normalized) : void 0;
			if (!ratio || !Number.isFinite(ratio.ratio) || Number.isNaN(ratio.dB)) {
				warnings.addWarning(`Invalid ASF ReplayGain value for ${tag.id}`);
				tag.id = "";
			} else tag.value = normalized;
		}
		switch (tag.id) {
			case "POPULARIMETER": {
				const [email, rating] = tag.value.split("|", 2);
				const value = Number(rating);
				const valid = /^\d+$/.test(rating) && Number.isInteger(value) && value >= 0 && value <= 255;
				if (!valid) warnings.addWarning(`Invalid ASF POPULARIMETER rating: ${rating}`);
				tag.value = {
					source: email,
					rating: valid && value > 0 ? (value - 1) / 254 * CommonTagMapper.maxRatingScore : void 0
				};
				break;
			}
			case "WM/SharedUserRating": {
				const keys = tag.id.split(":", 2);
				tag.value = AsfTagMapper.toRating(tag.value);
				tag.id = keys[0];
				break;
			}
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/caf/CafTagMap.js
var infoTagMap = {
	tempo: "bpm",
	"key signature": "key",
	artist: "artist",
	album: "album",
	"track number": "track",
	year: "year",
	composer: "composer",
	lyricist: "lyricist",
	genre: "genre",
	title: "title",
	"recorded date": "date",
	comments: "comment",
	copyright: "copyright",
	"source encoder": "encodersettings",
	"encoding application": "encodedby"
};
var commaSeparatedKeys = /* @__PURE__ */ new Set([
	"artist",
	"composer",
	"lyricist",
	"genre"
]);
var CafTagMapper = class extends CommonTagMapper {
	constructor() {
		super(["CAF"], infoTagMap);
	}
	mapGenericTag(tag, warnings) {
		if (commaSeparatedKeys.has(tag.id) && typeof tag.value === "string") tag = {
			id: tag.id,
			value: tag.value.split(",").map((value) => value.trim()).filter((value) => value.length > 0)
		};
		return super.mapGenericTag(tag, warnings);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v1/ID3v1TagMap.js
/**
* ID3v1 tag mappings
*/
var id3v1TagMap = {
	title: "title",
	artist: "artist",
	album: "album",
	year: "year",
	comment: "comment",
	track: "track",
	genre: "genre"
};
var ID3v1TagMapper = class extends CommonTagMapper {
	constructor() {
		super(["ID3v1"], id3v1TagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v22TagMapper.js
/**
* ID3v2.2 tag mappings
*/
var id3v22TagMap = {
	TT2: "title",
	TP1: "artist",
	TP2: "albumartist",
	TAL: "album",
	TYE: "year",
	COM: "comment",
	ULT: "lyrics",
	"IPL:arranger": "arranger",
	"IPL:engineer": "engineer",
	"IPL:producer": "producer",
	"IPL:DJ-mix": "djmixer",
	"IPL:mix": "mixer",
	TRK: "track",
	TPA: "disk",
	TCO: "genre",
	PIC: "picture",
	TCM: "composer",
	TOR: "originaldate",
	TOT: "originalalbum",
	TXT: "lyricist",
	TP3: "conductor",
	TPB: "label",
	TT1: "grouping",
	TT3: "subtitle",
	TLA: "language",
	TCR: "copyright",
	WCP: "license",
	TEN: "encodedby",
	TSS: "encodersettings",
	WAR: "website",
	PCS: "podcast",
	TCP: "compilation",
	TDR: "date",
	TS2: "albumartistsort",
	TSA: "albumsort",
	TSC: "composersort",
	TSP: "artistsort",
	TST: "titlesort",
	WFD: "podcasturl",
	TBP: "bpm",
	GP1: "grouping"
};
var ID3v22TagMapper = class extends CaseInsensitiveTagMap {
	constructor() {
		super(["ID3v2.2"], id3v22TagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v24TagMapper.js
/**
* ID3v2.3/ID3v2.4 tag mappings
*/
var id3v24TagMap = {
	TIT2: "title",
	TPE1: "artist",
	"TXXX:Artists": "artists",
	TPE2: "albumartist",
	TALB: "album",
	TDRV: "date",
	/**
	* Original release year
	*/
	TORY: "originalyear",
	TPOS: "disk",
	TCON: "genre",
	APIC: "picture",
	TCOM: "composer",
	USLT: "lyrics",
	TSOA: "albumsort",
	TSOT: "titlesort",
	TOAL: "originalalbum",
	TSOP: "artistsort",
	TSO2: "albumartistsort",
	TSOC: "composersort",
	TEXT: "lyricist",
	"TXXX:Writer": "writer",
	TPE3: "conductor",
	TPE4: "remixer",
	"IPLS:arranger": "arranger",
	"IPLS:engineer": "engineer",
	"IPLS:producer": "producer",
	"IPLS:DJ-mix": "djmixer",
	"IPLS:mix": "mixer",
	TPUB: "label",
	TIT1: "grouping",
	TIT3: "subtitle",
	TRCK: "track",
	TCMP: "compilation",
	POPM: "rating",
	TBPM: "bpm",
	TMED: "media",
	"TXXX:CATALOGNUMBER": "catalognumber",
	"TXXX:MusicBrainz Album Status": "releasestatus",
	"TXXX:MusicBrainz Album Type": "releasetype",
	/**
	* Release country as documented: https://picard.musicbrainz.org/docs/mappings/#cite_note-0
	*/
	"TXXX:MusicBrainz Album Release Country": "releasecountry",
	/**
	* Release country as implemented // ToDo: report
	*/
	"TXXX:RELEASECOUNTRY": "releasecountry",
	"TXXX:SCRIPT": "script",
	TLAN: "language",
	TCOP: "copyright",
	WCOP: "license",
	TENC: "encodedby",
	TSSE: "encodersettings",
	"TXXX:BARCODE": "barcode",
	"TXXX:ISRC": "isrc",
	TSRC: "isrc",
	"TXXX:ASIN": "asin",
	"TXXX:originalyear": "originalyear",
	"UFID:http://musicbrainz.org": "musicbrainz_recordingid",
	"TXXX:MusicBrainz Release Track Id": "musicbrainz_trackid",
	"TXXX:MusicBrainz Album Id": "musicbrainz_albumid",
	"TXXX:MusicBrainz Artist Id": "musicbrainz_artistid",
	"TXXX:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
	"TXXX:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
	"TXXX:MusicBrainz Work Id": "musicbrainz_workid",
	"TXXX:MusicBrainz TRM Id": "musicbrainz_trmid",
	"TXXX:MusicBrainz Disc Id": "musicbrainz_discid",
	"TXXX:ACOUSTID_ID": "acoustid_id",
	"TXXX:Acoustid Id": "acoustid_id",
	"TXXX:Acoustid Fingerprint": "acoustid_fingerprint",
	"TXXX:MusicIP PUID": "musicip_puid",
	"TXXX:MusicMagic Fingerprint": "musicip_fingerprint",
	WOAR: "website",
	TDRC: "date",
	TYER: "year",
	TDOR: "originaldate",
	"TIPL:arranger": "arranger",
	"TIPL:engineer": "engineer",
	"TIPL:producer": "producer",
	"TIPL:DJ-mix": "djmixer",
	"TIPL:mix": "mixer",
	TMOO: "mood",
	SYLT: "lyrics",
	TSST: "discsubtitle",
	TKEY: "key",
	COMM: "comment",
	TOPE: "originalartist",
	"PRIV:AverageLevel": "averageLevel",
	"PRIV:PeakValue": "peakLevel",
	"PRIV:PeakLevel": "peakLevel",
	"TXXX:DISCOGS_ARTIST_ID": "discogs_artist_id",
	"TXXX:DISCOGS_ARTISTS": "artists",
	"TXXX:DISCOGS_ARTIST_NAME": "artists",
	"TXXX:DISCOGS_ALBUM_ARTISTS": "albumartists",
	"TXXX:DISCOGS_CATALOG": "catalognumber",
	"TXXX:DISCOGS_COUNTRY": "releasecountry",
	"TXXX:DISCOGS_DATE": "originaldate",
	"TXXX:DISCOGS_LABEL": "label",
	"TXXX:DISCOGS_LABEL_ID": "discogs_label_id",
	"TXXX:DISCOGS_MASTER_RELEASE_ID": "discogs_master_release_id",
	"TXXX:DISCOGS_RATING": "discogs_rating",
	"TXXX:DISCOGS_RELEASED": "date",
	"TXXX:DISCOGS_RELEASE_ID": "discogs_release_id",
	"TXXX:DISCOGS_VOTES": "discogs_votes",
	"TXXX:CATALOGID": "catalognumber",
	"TXXX:STYLE": "genre",
	"TXXX:REPLAYGAIN_TRACK_PEAK": "replaygain_track_peak",
	"TXXX:REPLAYGAIN_TRACK_GAIN": "replaygain_track_gain",
	"TXXX:REPLAYGAIN_ALBUM_PEAK": "replaygain_album_peak",
	"TXXX:REPLAYGAIN_ALBUM_GAIN": "replaygain_album_gain",
	"TXXX:MP3GAIN_MINMAX": "replaygain_track_minmax",
	"TXXX:MP3GAIN_ALBUM_MINMAX": "replaygain_album_minmax",
	"TXXX:MP3GAIN_UNDO": "replaygain_undo",
	MVNM: "movement",
	MVIN: "movementIndex",
	PCST: "podcast",
	TCAT: "category",
	TDES: "description",
	TDRL: "releasedate",
	TGID: "podcastId",
	TKWD: "keywords",
	WFED: "podcasturl",
	GRP1: "grouping",
	PCNT: "playCounter"
};
var ID3v24TagMapper = class ID3v24TagMapper extends CaseInsensitiveTagMap {
	static toRating(popm) {
		return {
			source: popm.email,
			rating: popm.rating > 0 ? (popm.rating - 1) / 254 * CommonTagMapper.maxRatingScore : void 0
		};
	}
	constructor() {
		super(["ID3v2.3", "ID3v2.4"], id3v24TagMap);
	}
	/**
	* Handle post mapping exceptions / correction
	* @param tag to post map
	* @param warnings Wil be used to register (collect) warnings
	*/
	postMap(tag, warnings) {
		switch (tag.id) {
			case "UFID":
				{
					const idTag = tag.value;
					if (idTag.owner_identifier === "http://musicbrainz.org") {
						tag.id += `:${idTag.owner_identifier}`;
						tag.value = decodeString(idTag.identifier, "latin1");
					}
				}
				break;
			case "PRIV":
				{
					const customTag = tag.value;
					switch (customTag.owner_identifier) {
						case "AverageLevel":
						case "PeakValue":
						case "PeakLevel":
							tag.id += `:${customTag.owner_identifier}`;
							tag.value = customTag.data.length === 4 ? UINT32_LE.get(customTag.data, 0) : null;
							if (tag.value === null) warnings.addWarning(`Failed to parse PRIV:${customTag.owner_identifier}`);
							break;
						default: warnings.addWarning(`Unknown PRIV owner-identifier: ${customTag.owner_identifier.slice(0, 128)}`);
					}
				}
				break;
			case "POPM": tag.value = ID3v24TagMapper.toRating(tag.value);
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/matroska/MatroskaTagMapper.js
/**
* EBML Tag map
*/
var ebmlTagMap = {
	"segment:title": "title",
	"album:ARTIST": "albumartist",
	"album:ARTISTSORT": "albumartistsort",
	"album:TITLE": "album",
	"album:DATE_RECORDED": "originaldate",
	"album:DATE_RELEASED": "releasedate",
	"album:PART_NUMBER": "disk",
	"album:TOTAL_PARTS": "totaltracks",
	"track:ALBUM": "album",
	"track:ALBUM_ARTIST": "albumartist",
	"track:COMPOSER": "composer",
	"track:DATE": "date",
	"track:DISC": "disk",
	"track:ARTIST": "artist",
	"track:ARTISTSORT": "artistsort",
	"track:TITLE": "title",
	"track:PART_NUMBER": "track",
	"track:MUSICBRAINZ_TRACKID": "musicbrainz_recordingid",
	"track:MUSICBRAINZ_ALBUMID": "musicbrainz_albumid",
	"track:MUSICBRAINZ_ARTISTID": "musicbrainz_artistid",
	"track:PUBLISHER": "label",
	"track:GENRE": "genre",
	"track:ENCODER": "encodedby",
	"track:ENCODER_OPTIONS": "encodersettings",
	"edition:TOTAL_PARTS": "totaldiscs",
	picture: "picture"
};
var MatroskaTagMapper = class extends CaseInsensitiveTagMap {
	constructor() {
		super(["matroska"], ebmlTagMap);
	}
	mapGenericTag(tag, warnings) {
		if (tag.id.toUpperCase() === "TRACK:DATE" && typeof tag.value !== "string") return null;
		return super.mapGenericTag(tag, warnings);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/MP4TagMapper.js
/**
* Ref: https://github.com/sergiomb2/libmp4v2/wiki/iTunesMetadata
*/
var mp4TagMap = {
	"mdta:title": "title",
	"mdta:album": "album",
	"mdta:artist": "artist",
	"mdta:album_artist": "albumartist",
	"mdta:albumartist": "albumartist",
	"mdta:composer": "composer",
	"mdta:date": "date",
	"mdta:comment": "comment",
	"mdta:description": "description",
	"mdta:synopsis": "longDescription",
	"mdta:genre": "genre",
	"mdta:track": "track",
	"mdta:disc": "disk",
	"mdta:publisher": "label",
	"mdta:subtitle": "subtitle",
	"mdta:language": "language",
	"mdta:copyright": "copyright",
	"mdta:encoder": "encodedby",
	"mdta:asin": "asin",
	"mdta:com.apple.quicktime.title": "title",
	"mdta:com.apple.quicktime.album": "album",
	"mdta:com.apple.quicktime.artist": "artist",
	"mdta:com.apple.quicktime.creationdate": "date",
	"mdta:com.apple.quicktime.comment": "comment",
	"mdta:com.apple.quicktime.description": "description",
	"mdta:com.apple.quicktime.genre": "genre",
	"mdta:com.apple.quicktime.copyright": "copyright",
	"©nam": "title",
	"©ART": "artist",
	aART: "albumartist",
	/**
	* ToDo: Album artist seems to be stored here while Picard documentation says: aART
	*/
	"----:com.apple.iTunes:Band": "albumartist",
	"©alb": "album",
	"©day": "date",
	"©cmt": "comment",
	"©com": "comment",
	trkn: "track",
	disk: "disk",
	"©gen": "genre",
	covr: "picture",
	"©wrt": "composer",
	"©lyr": "lyrics",
	soal: "albumsort",
	sonm: "titlesort",
	soar: "artistsort",
	soaa: "albumartistsort",
	soco: "composersort",
	"----:com.apple.iTunes:LYRICIST": "lyricist",
	"----:com.apple.iTunes:CONDUCTOR": "conductor",
	"----:com.apple.iTunes:REMIXER": "remixer",
	"----:com.apple.iTunes:ENGINEER": "engineer",
	"----:com.apple.iTunes:PRODUCER": "producer",
	"----:com.apple.iTunes:DJMIXER": "djmixer",
	"----:com.apple.iTunes:MIXER": "mixer",
	"----:com.apple.iTunes:LABEL": "label",
	"©grp": "grouping",
	"----:com.apple.iTunes:SUBTITLE": "subtitle",
	"----:com.apple.iTunes:DISCSUBTITLE": "discsubtitle",
	cpil: "compilation",
	tmpo: "bpm",
	"----:com.apple.iTunes:MOOD": "mood",
	"----:com.apple.iTunes:MEDIA": "media",
	"----:com.apple.iTunes:CATALOGNUMBER": "catalognumber",
	tvsh: "tvShow",
	tvsn: "tvSeason",
	tves: "tvEpisode",
	sosn: "tvShowSort",
	tven: "tvEpisodeId",
	tvnn: "tvNetwork",
	pcst: "podcast",
	purl: "podcasturl",
	"----:com.apple.iTunes:MusicBrainz Album Status": "releasestatus",
	"----:com.apple.iTunes:MusicBrainz Album Type": "releasetype",
	"----:com.apple.iTunes:MusicBrainz Album Release Country": "releasecountry",
	"----:com.apple.iTunes:SCRIPT": "script",
	"----:com.apple.iTunes:LANGUAGE": "language",
	cprt: "copyright",
	"©cpy": "copyright",
	"----:com.apple.iTunes:LICENSE": "license",
	"©too": "encodedby",
	pgap: "gapless",
	"----:com.apple.iTunes:BARCODE": "barcode",
	"----:com.apple.iTunes:ISRC": "isrc",
	"----:com.apple.iTunes:ASIN": "asin",
	"----:com.apple.iTunes:NOTES": "comment",
	"----:com.apple.iTunes:MusicBrainz Track Id": "musicbrainz_recordingid",
	"----:com.apple.iTunes:MusicBrainz Release Track Id": "musicbrainz_trackid",
	"----:com.apple.iTunes:MusicBrainz Album Id": "musicbrainz_albumid",
	"----:com.apple.iTunes:MusicBrainz Artist Id": "musicbrainz_artistid",
	"----:com.apple.iTunes:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
	"----:com.apple.iTunes:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
	"----:com.apple.iTunes:MusicBrainz Work Id": "musicbrainz_workid",
	"----:com.apple.iTunes:MusicBrainz TRM Id": "musicbrainz_trmid",
	"----:com.apple.iTunes:MusicBrainz Disc Id": "musicbrainz_discid",
	"----:com.apple.iTunes:Acoustid Id": "acoustid_id",
	"----:com.apple.iTunes:Acoustid Fingerprint": "acoustid_fingerprint",
	"----:com.apple.iTunes:MusicIP PUID": "musicip_puid",
	"----:com.apple.iTunes:fingerprint": "musicip_fingerprint",
	"----:com.apple.iTunes:replaygain_track_gain": "replaygain_track_gain",
	"----:com.apple.iTunes:replaygain_track_peak": "replaygain_track_peak",
	"----:com.apple.iTunes:replaygain_album_gain": "replaygain_album_gain",
	"----:com.apple.iTunes:replaygain_album_peak": "replaygain_album_peak",
	"----:com.apple.iTunes:replaygain_track_minmax": "replaygain_track_minmax",
	"----:com.apple.iTunes:replaygain_album_minmax": "replaygain_album_minmax",
	"----:com.apple.iTunes:replaygain_undo": "replaygain_undo",
	"----:com.apple.iTunes:Movement Name": "movement",
	"----:com.apple.iTunes:Movement": "movementIndex",
	"----:com.apple.iTunes:Movement Total": "movementTotal",
	gnre: "genre",
	"----:com.apple.iTunes:ALBUMARTISTSORT": "albumartistsort",
	"----:com.apple.iTunes:ARTISTS": "artists",
	"----:com.apple.iTunes:ORIGINALDATE": "originaldate",
	"----:com.apple.iTunes:ORIGINALYEAR": "originalyear",
	"----:com.apple.iTunes:RELEASEDATE": "releasedate",
	desc: "description",
	ldes: "longDescription",
	"©mvn": "movement",
	"©mvi": "movementIndex",
	"©mvc": "movementTotal",
	"©wrk": "work",
	catg: "category",
	egid: "podcastId",
	hdvd: "hdVideo",
	keyw: "keywords",
	shwm: "showMovement",
	stik: "stik",
	rate: "rating"
};
var tagType = "iTunes";
var MP4TagMapper = class extends CaseInsensitiveTagMap {
	constructor() {
		super([tagType], mp4TagMap);
	}
	postMap(tag, _warnings) {
		switch (tag.id) {
			case "rate": tag.value = {
				source: void 0,
				rating: Number.parseFloat(tag.value) / 100
			};
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/vorbis/VorbisTagMapper.js
/**
* Vorbis tag mappings
*
* Mapping from native header format to one or possibly more 'common' entries
* The common entries aim to read the same information from different media files
* independent of the underlying format
*/
var vorbisTagMap = {
	TITLE: "title",
	ARTIST: "artist",
	ARTISTS: "artists",
	ALBUMARTIST: "albumartist",
	"ALBUM ARTIST": "albumartist",
	ALBUM: "album",
	DATE: "date",
	ORIGINALDATE: "originaldate",
	ORIGINALYEAR: "originalyear",
	RELEASEDATE: "releasedate",
	COMMENT: "comment",
	DESCRIPTION: "comment",
	TRACKNUMBER: "track",
	DISCNUMBER: "disk",
	GENRE: "genre",
	METADATA_BLOCK_PICTURE: "picture",
	COMPOSER: "composer",
	LYRICS: "lyrics",
	UNSYNCEDLYRICS: "lyrics",
	ALBUMSORT: "albumsort",
	TITLESORT: "titlesort",
	WORK: "work",
	ARTISTSORT: "artistsort",
	ALBUMARTISTSORT: "albumartistsort",
	COMPOSERSORT: "composersort",
	LYRICIST: "lyricist",
	WRITER: "writer",
	CONDUCTOR: "conductor",
	REMIXER: "remixer",
	ARRANGER: "arranger",
	ENGINEER: "engineer",
	PRODUCER: "producer",
	DJMIXER: "djmixer",
	MIXER: "mixer",
	LABEL: "label",
	ORGANIZATION: "label",
	PUBLISHER: "label",
	GROUPING: "grouping",
	SUBTITLE: "subtitle",
	DISCSUBTITLE: "discsubtitle",
	TRACKTOTAL: "totaltracks",
	DISCTOTAL: "totaldiscs",
	COMPILATION: "compilation",
	RATING: "rating",
	BPM: "bpm",
	KEY: "key",
	MOOD: "mood",
	MEDIA: "media",
	CATALOGNUMBER: "catalognumber",
	RELEASESTATUS: "releasestatus",
	RELEASETYPE: "releasetype",
	RELEASECOUNTRY: "releasecountry",
	SCRIPT: "script",
	LANGUAGE: "language",
	COPYRIGHT: "copyright",
	LICENSE: "license",
	ENCODEDBY: "encodedby",
	ENCODERSETTINGS: "encodersettings",
	BARCODE: "barcode",
	ISRC: "isrc",
	ASIN: "asin",
	MUSICBRAINZ_TRACKID: "musicbrainz_recordingid",
	MUSICBRAINZ_RELEASETRACKID: "musicbrainz_trackid",
	MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
	MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
	MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
	MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
	MUSICBRAINZ_WORKID: "musicbrainz_workid",
	MUSICBRAINZ_TRMID: "musicbrainz_trmid",
	MUSICBRAINZ_DISCID: "musicbrainz_discid",
	ACOUSTID_ID: "acoustid_id",
	ACOUSTID_ID_FINGERPRINT: "acoustid_fingerprint",
	MUSICIP_PUID: "musicip_puid",
	WEBSITE: "website",
	NOTES: "notes",
	TOTALTRACKS: "totaltracks",
	TOTALDISCS: "totaldiscs",
	DISCOGS_ARTIST_ID: "discogs_artist_id",
	DISCOGS_ARTISTS: "artists",
	DISCOGS_ARTIST_NAME: "artists",
	DISCOGS_ALBUM_ARTISTS: "albumartists",
	DISCOGS_CATALOG: "catalognumber",
	DISCOGS_COUNTRY: "releasecountry",
	DISCOGS_DATE: "originaldate",
	DISCOGS_LABEL: "label",
	DISCOGS_LABEL_ID: "discogs_label_id",
	DISCOGS_MASTER_RELEASE_ID: "discogs_master_release_id",
	DISCOGS_RATING: "discogs_rating",
	DISCOGS_RELEASED: "date",
	DISCOGS_RELEASE_ID: "discogs_release_id",
	DISCOGS_VOTES: "discogs_votes",
	CATALOGID: "catalognumber",
	STYLE: "genre",
	REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
	REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
	REPLAYGAIN_ALBUM_GAIN: "replaygain_album_gain",
	REPLAYGAIN_ALBUM_PEAK: "replaygain_album_peak",
	REPLAYGAIN_MINMAX: "replaygain_track_minmax",
	REPLAYGAIN_ALBUM_MINMAX: "replaygain_album_minmax",
	REPLAYGAIN_UNDO: "replaygain_undo"
};
var VorbisTagMapper = class VorbisTagMapper extends CommonTagMapper {
	hasStandardDate = false;
	static toRating(email, rating, maxScore) {
		return {
			source: email ? email.toLowerCase() : void 0,
			rating: Number.parseFloat(rating) / maxScore * CommonTagMapper.maxRatingScore
		};
	}
	constructor() {
		super(["vorbis"], vorbisTagMap);
	}
	mapGenericTag(tag, warnings) {
		if (tag.id === "DATE") {
			if (typeof tag.value !== "string" || tag.value.trim().length === 0) return null;
			this.hasStandardDate = true;
		} else if (tag.id === "DISCOGS_RELEASED" && this.hasStandardDate) return null;
		return super.mapGenericTag(tag, warnings);
	}
	postMap(tag) {
		if (tag.id === "RATING") tag.value = VorbisTagMapper.toRating(void 0, tag.value, 100);
		else if (tag.id.indexOf("RATING:") === 0) {
			const keys = tag.id.split(":", 2);
			tag.value = VorbisTagMapper.toRating(keys[1], tag.value, 1);
			tag.id = keys[0];
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/riff/RiffInfoTagMap.js
/**
* RIFF Info Tags; part of the EXIF 2.3
* Ref: http://owl.phy.queensu.ca/~phil/exiftool/TagNames/RIFF.html#Info
*/
var riffInfoTagMap = {
	IART: "artist",
	ICRD: "date",
	INAM: "title",
	TITL: "title",
	IPRD: "album",
	ITRK: "track",
	IPRT: "track",
	COMM: "comment",
	ICMT: "comment",
	ICOP: "copyright",
	ICNT: "releasecountry",
	GNRE: "genre",
	IWRI: "writer",
	RATE: "rating",
	YEAR: "year",
	ISFT: "encodedby",
	CODE: "encodedby",
	TURL: "website",
	IGNR: "genre",
	IENG: "engineer",
	ITCH: "technician",
	IMED: "media",
	IRPD: "album"
};
var RiffInfoTagMapper = class extends CommonTagMapper {
	constructor() {
		super(["exif"], riffInfoTagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/CombinedTagMapper.js
var CombinedTagMapper = class {
	tagMappers = {};
	constructor() {
		[
			new ID3v1TagMapper(),
			new ID3v22TagMapper(),
			new ID3v24TagMapper(),
			new MP4TagMapper(),
			new VorbisTagMapper(),
			new APEv2TagMapper(),
			new AsfTagMapper(),
			new RiffInfoTagMapper(),
			new MatroskaTagMapper(),
			new AiffTagMapper(),
			new CafTagMapper()
		].forEach((mapper) => {
			this.registerTagMapper(mapper);
		});
	}
	/**
	* Convert native to generic (common) tags
	* @param tagType Originating tag format
	* @param tag     Native tag to map to a generic tag id
	* @param warnings
	* @return Generic tag result (output of this function)
	*/
	mapTag(tagType, tag, warnings) {
		if (this.tagMappers[tagType]) return this.tagMappers[tagType].mapGenericTag(tag, warnings);
		throw new InternalParserError(`No generic tag mapper defined for tag-format: ${tagType}`);
	}
	registerTagMapper(genericTagMapper) {
		for (const tagType of genericTagMapper.tagTypes) this.tagMappers[tagType] = genericTagMapper;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/GenericTagTypes.js
var defaultTagInfo = { multiple: false };
var commonTags = {
	year: defaultTagInfo,
	track: defaultTagInfo,
	disk: defaultTagInfo,
	title: defaultTagInfo,
	artist: defaultTagInfo,
	artists: {
		multiple: true,
		unique: true
	},
	albumartist: defaultTagInfo,
	albumartists: {
		multiple: true,
		unique: true
	},
	album: defaultTagInfo,
	date: defaultTagInfo,
	originaldate: defaultTagInfo,
	originalyear: defaultTagInfo,
	releasedate: defaultTagInfo,
	comment: {
		multiple: true,
		unique: false
	},
	genre: {
		multiple: true,
		unique: true
	},
	picture: {
		multiple: true,
		unique: true
	},
	composer: {
		multiple: true,
		unique: true
	},
	lyrics: {
		multiple: true,
		unique: false
	},
	albumsort: {
		multiple: false,
		unique: true
	},
	titlesort: {
		multiple: false,
		unique: true
	},
	work: {
		multiple: false,
		unique: true
	},
	artistsort: {
		multiple: false,
		unique: true
	},
	albumartistsort: {
		multiple: false,
		unique: true
	},
	composersort: {
		multiple: false,
		unique: true
	},
	lyricist: {
		multiple: true,
		unique: true
	},
	writer: {
		multiple: true,
		unique: true
	},
	conductor: {
		multiple: true,
		unique: true
	},
	remixer: {
		multiple: true,
		unique: true
	},
	arranger: {
		multiple: true,
		unique: true
	},
	engineer: {
		multiple: true,
		unique: true
	},
	publisher: defaultTagInfo,
	producer: {
		multiple: true,
		unique: true
	},
	djmixer: {
		multiple: true,
		unique: true
	},
	mixer: {
		multiple: true,
		unique: true
	},
	technician: {
		multiple: true,
		unique: true
	},
	label: {
		multiple: true,
		unique: true
	},
	grouping: defaultTagInfo,
	subtitle: { multiple: true },
	description: { multiple: true },
	longDescription: defaultTagInfo,
	discsubtitle: defaultTagInfo,
	totaltracks: defaultTagInfo,
	totaldiscs: defaultTagInfo,
	movementTotal: defaultTagInfo,
	compilation: defaultTagInfo,
	rating: { multiple: true },
	bpm: defaultTagInfo,
	mood: defaultTagInfo,
	media: defaultTagInfo,
	catalognumber: {
		multiple: true,
		unique: true
	},
	tvShow: defaultTagInfo,
	tvShowSort: defaultTagInfo,
	tvSeason: defaultTagInfo,
	tvEpisode: defaultTagInfo,
	tvEpisodeId: defaultTagInfo,
	tvNetwork: defaultTagInfo,
	podcast: defaultTagInfo,
	podcasturl: defaultTagInfo,
	releasestatus: defaultTagInfo,
	releasetype: { multiple: true },
	releasecountry: defaultTagInfo,
	script: defaultTagInfo,
	language: defaultTagInfo,
	copyright: defaultTagInfo,
	license: defaultTagInfo,
	encodedby: defaultTagInfo,
	encodersettings: defaultTagInfo,
	gapless: defaultTagInfo,
	barcode: defaultTagInfo,
	isrc: { multiple: true },
	asin: defaultTagInfo,
	musicbrainz_recordingid: defaultTagInfo,
	musicbrainz_trackid: defaultTagInfo,
	musicbrainz_albumid: defaultTagInfo,
	musicbrainz_artistid: { multiple: true },
	musicbrainz_albumartistid: { multiple: true },
	musicbrainz_releasegroupid: defaultTagInfo,
	musicbrainz_workid: defaultTagInfo,
	musicbrainz_trmid: defaultTagInfo,
	musicbrainz_discid: defaultTagInfo,
	acoustid_id: defaultTagInfo,
	acoustid_fingerprint: defaultTagInfo,
	musicip_puid: defaultTagInfo,
	musicip_fingerprint: defaultTagInfo,
	website: defaultTagInfo,
	"performer:instrument": {
		multiple: true,
		unique: true
	},
	averageLevel: defaultTagInfo,
	peakLevel: defaultTagInfo,
	notes: {
		multiple: true,
		unique: false
	},
	originalalbum: defaultTagInfo,
	originalartist: defaultTagInfo,
	discogs_artist_id: {
		multiple: true,
		unique: true
	},
	discogs_release_id: defaultTagInfo,
	discogs_label_id: defaultTagInfo,
	discogs_master_release_id: defaultTagInfo,
	discogs_votes: defaultTagInfo,
	discogs_rating: defaultTagInfo,
	replaygain_track_gain_ratio: defaultTagInfo,
	replaygain_track_peak_ratio: defaultTagInfo,
	replaygain_track_gain: defaultTagInfo,
	replaygain_track_peak: defaultTagInfo,
	replaygain_album_gain: defaultTagInfo,
	replaygain_album_peak: defaultTagInfo,
	replaygain_undo: defaultTagInfo,
	replaygain_track_minmax: defaultTagInfo,
	replaygain_album_minmax: defaultTagInfo,
	key: defaultTagInfo,
	category: { multiple: true },
	hdVideo: defaultTagInfo,
	keywords: { multiple: true },
	movement: defaultTagInfo,
	movementIndex: defaultTagInfo,
	podcastId: defaultTagInfo,
	showMovement: defaultTagInfo,
	stik: defaultTagInfo,
	playCounter: defaultTagInfo
};
/**
* @param alias Name of common tag
* @returns {boolean|*} true if given alias is mapped as a singleton', otherwise false
*/
function isSingleton(alias) {
	return !!commonTags[alias] && !commonTags[alias].multiple;
}
/**
* @param alias Common (generic) tag
* @returns {boolean|*} true if given alias is a singleton or explicitly marked as unique
*/
function isUnique(alias) {
	const info = commonTags[alias];
	return !info?.multiple || info.unique || false;
}
//#endregion
//#region node_modules/music-metadata/lib/common/TrackInfo.js
/** Return a bitrate only when it conveys a finite, positive value. */
function normalizeBitrate(bitrate) {
	return bitrate !== void 0 && Number.isFinite(bitrate) && bitrate > 0 ? bitrate : void 0;
}
/** Map the format of a single audio stream to the shared track abstraction. */
function createAudioTrackInfo(format) {
	const audio = {};
	const track = {
		type: TrackType.audio,
		audio
	};
	if (format.codec !== void 0) track.codecName = format.codec;
	if (format.codecProfile !== void 0) track.codecProfile = format.codecProfile;
	if (format.duration !== void 0) track.duration = format.duration;
	const bitrate = normalizeBitrate(format.bitrate);
	if (bitrate !== void 0) track.bitrate = bitrate;
	if (format.lossless !== void 0) track.lossless = format.lossless;
	if (format.sampleRate !== void 0) audio.samplingFrequency = format.sampleRate;
	if (format.numberOfChannels !== void 0) audio.channels = format.numberOfChannels;
	if (format.bitsPerSample !== void 0) audio.bitDepth = format.bitsPerSample;
	if (format.numberOfSamples !== void 0) audio.numberOfSamples = format.numberOfSamples;
	return track;
}
/** Derive whole-file statistics without treating an audio bitrate as a video bitrate. */
function finalizeContainerInfo(metadata, fileSize) {
	const { format } = metadata;
	let duration = format.containerDuration;
	if (duration === void 0) {
		const durations = format.trackInfo.filter((track) => track.type === TrackType.audio || track.type === TrackType.video).map((track) => track.duration);
		if (durations.length > 0 && durations.every((duration) => duration !== void 0 && duration > 0 && Number.isFinite(duration))) duration = durations.reduce((maximum, trackDuration) => Math.max(maximum, trackDuration), 0);
		else if (!format.hasVideo) duration = format.duration;
	}
	if (duration !== void 0 && Number.isFinite(duration) && duration > 0) {
		metadata.setFormat("containerDuration", duration);
		if (format.duration === void 0) metadata.setFormat("duration", duration);
		if (fileSize !== void 0 && Number.isSafeInteger(fileSize) && fileSize > 0) {
			const bitrate = 8 * fileSize / duration;
			if (Number.isFinite(bitrate)) metadata.setFormat("overallBitrate", bitrate);
		}
	}
}
//#endregion
//#region node_modules/music-metadata/lib/common/MetadataCollector.js
var debug$17 = (0, import_src.default)("music-metadata:collector");
var TagPriority = [
	"matroska",
	"APEv2",
	"vorbis",
	"ID3v2.4",
	"ID3v2.3",
	"ID3v2.2",
	"exif",
	"asf",
	"iTunes",
	"AIFF",
	"CAF",
	"ID3v1"
];
/**
* Provided to the parser to update the metadata result.
* Responsible for notifying observers synchronously after updates.
*/
var MetadataCollector = class {
	format = {
		tagTypes: [],
		trackInfo: []
	};
	native = {};
	get nativeTyped() {
		return toNativeTyped(this.native);
	}
	common = {
		track: {
			no: null,
			of: null
		},
		disk: {
			no: null,
			of: null
		},
		movementIndex: {
			no: null,
			of: null
		}
	};
	quality = { warnings: [] };
	/**
	* Keeps track of origin priority for each mapped id
	*/
	commonOrigin = {};
	/**
	* Maps a tag type to a priority
	*/
	originPriority = {};
	tagMapper = new CombinedTagMapper();
	opts;
	constructor(opts) {
		this.opts = opts;
		let priority = 1;
		for (const tagType of TagPriority) this.originPriority[tagType] = priority++;
		this.originPriority.artificial = 500;
		this.originPriority.id3v1 = 600;
	}
	/**
	* @returns {boolean} true if one or more tags have been found
	*/
	hasAny() {
		return Object.keys(this.native).length > 0;
	}
	addStreamInfo(streamInfo) {
		debug$17(`streamInfo: type=${streamInfo.type ? TrackTypeValueToKeyMap[streamInfo.type] : "?"}, codec=${streamInfo.codecName}`);
		if (normalizeBitrate(streamInfo.bitrate) === void 0) delete streamInfo.bitrate;
		this.format.trackInfo.push(streamInfo);
	}
	setFormat(key, value) {
		if ((value === null || typeof value !== "object") && Object.is(this.format[key], value)) return;
		debug$17(`format: ${key} = ${value}`);
		this.format[key] = value;
		if (this.opts?.observer) this.opts.observer({
			metadata: this,
			tag: {
				type: "format",
				id: key,
				value
			}
		});
	}
	setAudioOnly() {
		this.setFormat("hasAudio", true);
		this.setFormat("hasVideo", false);
	}
	registerTagType(tagType) {
		if (!this.format.tagTypes.includes(tagType)) this.format.tagTypes.push(tagType);
	}
	async addTag(tagType, tagId, value) {
		debug$17("tag %s.%s = %o", tagType, tagId, value);
		if (!this.native[tagType]) {
			this.registerTagType(tagType);
			this.native[tagType] = [];
		}
		this.native[tagType].push({
			id: tagId,
			value
		});
		await this.toCommon(tagType, tagId, value);
	}
	addWarning(warning) {
		this.quality.warnings.push({ message: warning });
	}
	async postMap(tagType, tag) {
		switch (tag.id) {
			case "artist": return this.handleSingularArtistTag(tagType, tag, "artist", "artists");
			case "albumartist": return this.handleSingularArtistTag(tagType, tag, "albumartist", "albumartists");
			case "artists": return this.handlePluralArtistTag(tagType, tag, "artist", "artists");
			case "albumartists": return this.handlePluralArtistTag(tagType, tag, "albumartist", "albumartists");
			case "picture": return this.postFixPicture(tag.value).then((picture) => {
				if (picture !== null) {
					tag.value = picture;
					this.setGenericTag(tagType, tag);
				}
			});
			case "totaltracks":
				this.common.track.of = CommonTagMapper.toIntOrNull(tag.value);
				this.notifyCommonTag({
					id: "track",
					value: { ...this.common.track }
				});
				return;
			case "totaldiscs":
				this.common.disk.of = CommonTagMapper.toIntOrNull(tag.value);
				this.notifyCommonTag({
					id: "disk",
					value: { ...this.common.disk }
				});
				return;
			case "movementTotal":
				this.common.movementIndex.of = CommonTagMapper.toIntOrNull(tag.value);
				this.notifyCommonTag({
					id: "movementIndex",
					value: { ...this.common.movementIndex }
				});
				return;
			case "track":
			case "disk":
			case "movementIndex": {
				const of = this.common[tag.id].of;
				this.common[tag.id] = CommonTagMapper.normalizeTrack(tag.value);
				this.common[tag.id].of = of != null ? of : this.common[tag.id].of;
				this.notifyCommonTag({
					id: tag.id,
					value: { ...this.common[tag.id] }
				});
				return;
			}
			case "bpm":
			case "year":
			case "originalyear":
				tag.value = Number.parseInt(tag.value, 10);
				break;
			case "date": {
				const year = Number.parseInt(tag.value.substr(0, 4), 10);
				if (!Number.isNaN(year)) this.common.year = year;
				break;
			}
			case "discogs_label_id":
			case "discogs_release_id":
			case "discogs_master_release_id":
			case "discogs_artist_id":
			case "discogs_votes":
				tag.value = typeof tag.value === "string" ? Number.parseInt(tag.value, 10) : tag.value;
				break;
			case "replaygain_track_gain":
			case "replaygain_track_peak":
			case "replaygain_album_gain":
			case "replaygain_album_peak": {
				const ratio = toRatio(tag.value);
				if (!ratio) {
					this.addWarning(`Invalid ReplayGain value for ${tagType}.${tag.id}`);
					return;
				}
				tag.value = ratio;
				break;
			}
			case "replaygain_track_minmax":
				tag.value = tag.value.split(",", 2).map((v) => Number.parseInt(v, 10));
				break;
			case "replaygain_undo": {
				const minMix = tag.value.split(",", 2).map((v) => Number.parseInt(v, 10));
				tag.value = {
					leftChannel: minMix[0],
					rightChannel: minMix[1]
				};
				break;
			}
			case "gapless":
			case "compilation":
			case "podcast":
			case "showMovement":
				tag.value = tag.value === "1" || tag.value === 1 || tag.value === true;
				break;
			case "isrc": {
				const commonTag = this.common[tag.id];
				if (commonTag && commonTag.indexOf(tag.value) !== -1) return;
				break;
			}
			case "comment":
				if (typeof tag.value === "string") tag.value = { text: tag.value };
				if (tag.value.descriptor === "iTunPGAP") this.setGenericTag(tagType, {
					id: "gapless",
					value: tag.value.text === "1"
				});
				break;
			case "lyrics": if (typeof tag.value === "string") tag.value = parseLyrics(tag.value, getMaxMetadataEntries(this.opts ?? {}));
			else if (tag.value && typeof tag.value === "object" && !Array.isArray(tag.value)) tag.value = normalizeLyricsTag(tag.value);
		}
		if (tag.value !== null) this.setGenericTag(tagType, tag);
	}
	/**
	* Convert native tags to common tags
	* @returns {IAudioMetadata} Native + common tags
	*/
	toCommonMetadata() {
		return {
			format: this.format,
			native: this.native,
			get nativeTyped() {
				return toNativeTyped(this.native);
			},
			quality: this.quality,
			common: this.common
		};
	}
	/**
	* Handle singular artist tags (artist, albumartist) and cross-populate to plural form
	*/
	handleSingularArtistTag(tagType, tag, singularId, pluralId) {
		if (this.commonOrigin[singularId] === this.originPriority[tagType]) return this.postMap("artificial", {
			id: pluralId,
			value: tag.value
		});
		if (!this.common[pluralId]) this.setGenericTag("artificial", {
			id: pluralId,
			value: tag.value
		});
		this.setGenericTag(tagType, tag);
	}
	/**
	* Handle plural artist tags (artists, albumartists) and cross-populate to singular form
	*/
	handlePluralArtistTag(tagType, tag, singularId, pluralId) {
		if (!this.common[singularId] || this.commonOrigin[singularId] === this.originPriority.artificial) {
			if (!this.common[pluralId] || this.common[pluralId].indexOf(tag.value) === -1) {
				const value = joinArtists((this.common[pluralId] || []).concat([tag.value]));
				this.setGenericTag("artificial", {
					id: singularId,
					value
				});
			}
		}
		this.setGenericTag(tagType, tag);
	}
	/**
	* Fix some common issues with picture object
	* @param picture Picture
	*/
	async postFixPicture(picture) {
		if (picture.data && picture.data.length > 0) {
			if (!picture.format) {
				const fileType = await fileTypeFromBuffer(Uint8Array.from(picture.data), { maxBufferSize: getMaxMemoryAllocation(this.opts ?? {}) });
				if (fileType) picture.format = fileType.mime;
				else return null;
			}
			picture.format = picture.format.toLocaleLowerCase();
			switch (picture.format) {
				case "image/jpg": picture.format = "image/jpeg";
			}
			return picture;
		}
		this.addWarning("Empty picture tag found");
		return null;
	}
	/**
	* Convert native tag to common tags
	*/
	async toCommon(tagType, tagId, value) {
		if ((tagType === "ID3v2.2" && tagId === "IPL" || tagType === "ID3v2.3" && tagId === "IPLS" || tagType === "ID3v2.4" && tagId === "TIPL") && value !== null && typeof value === "object") {
			for (const [role, people] of Object.entries(value)) if (Array.isArray(people)) {
				for (const person of people) if (typeof person === "string" && person.length > 0) await this.toCommon(tagType, `${tagId}:${role}`, person);
			}
			return;
		}
		const tag = {
			id: tagId,
			value
		};
		const genericTag = this.tagMapper.mapTag(tagType, tag, this);
		if (genericTag) {
			if (Array.isArray(genericTag.value)) for (const value of genericTag.value) await this.postMap(tagType, {
				id: genericTag.id,
				value
			});
			else await this.postMap(tagType, genericTag);
		}
	}
	/**
	* Set generic tag
	*/
	setGenericTag(tagType, tag) {
		debug$17(`common.${tag.id} = ${tag.value}`);
		const prio0 = this.commonOrigin[tag.id] || 1e3;
		const prio1 = this.originPriority[tagType];
		if (isSingleton(tag.id)) {
			if (prio1 <= prio0) {
				this.common[tag.id] = tag.value;
				this.commonOrigin[tag.id] = prio1;
			} else return debug$17(`Ignore native tag (singleton): ${tagType}.${tag.id} = ${tag.value}`);
		} else if (prio1 === prio0) {
			if (!isUnique(tag.id) || this.common[tag.id].indexOf(tag.value) === -1) this.common[tag.id].push(tag.value);
			else return debug$17(`Ignore duplicate value: ${tagType}.${tag.id} = ${tag.value}`);
		} else if (prio1 < prio0) {
			this.common[tag.id] = [tag.value];
			this.commonOrigin[tag.id] = prio1;
		} else return debug$17(`Ignore native tag (list): ${tagType}.${tag.id} = ${tag.value}`);
		this.notifyCommonTag(tag);
	}
	notifyCommonTag(tag) {
		if (this.opts?.observer) this.opts.observer({
			metadata: this,
			tag: {
				type: "common",
				id: tag.id,
				value: tag.value
			}
		});
	}
};
function joinArtists(artists) {
	if (artists.length > 2) return `${artists.slice(0, artists.length - 1).join(", ")} & ${artists[artists.length - 1]}`;
	return artists.join(" & ");
}
//#endregion
//#region node_modules/music-metadata/lib/dsdiff/DsdiffLoader.js
var dsdiffParserLoader = {
	parserType: "dsdiff",
	extensions: [".dff"],
	mimeTypes: [
		"audio/dsf",
		"audio/dsd",
		"audio/dff"
	],
	async load() {
		return (await Promise.resolve().then(() => DsdiffParser_exports)).DsdiffParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsf/DsfLoader.js
var dsfParserLoader = {
	parserType: "dsf",
	extensions: [".dsf"],
	mimeTypes: ["audio/dsf"],
	async load() {
		return (await Promise.resolve().then(() => DsfParser_exports)).DsfParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/flac/FlacLoader.js
var flacParserLoader = {
	parserType: "flac",
	extensions: [".flac"],
	mimeTypes: ["audio/flac"],
	async load() {
		return (await Promise.resolve().then(() => FlacParser_exports)).FlacParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/matroska/MatroskaLoader.js
var matroskaParserLoader = {
	parserType: "matroska",
	extensions: [
		".mka",
		".mkv",
		".mk3d",
		".mks",
		"webm"
	],
	mimeTypes: [
		"audio/matroska",
		"video/matroska",
		"audio/webm",
		"video/webm"
	],
	async load() {
		return (await Promise.resolve().then(() => MatroskaParser_exports)).MatroskaParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/Mp4Loader.js
var mp4ParserLoader = {
	parserType: "mp4",
	extensions: [
		".mp4",
		".m4a",
		".m4b",
		".m4pa",
		"m4v",
		"m4r",
		"3gp",
		".mov",
		".movie",
		".qt"
	],
	mimeTypes: [
		"audio/mp4",
		"audio/m4a",
		"video/m4v",
		"video/mp4",
		"video/quicktime"
	],
	async load() {
		return (await Promise.resolve().then(() => MP4Parser_exports)).MP4Parser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mpeg/MpegLoader.js
var mpegParserLoader = {
	parserType: "mpeg",
	extensions: [
		".mp1",
		".mp2",
		".mp3",
		".m2a",
		".aac",
		"aacp"
	],
	mimeTypes: [
		"audio/mpeg",
		"audio/mp3",
		"audio/aacs",
		"audio/aacp"
	],
	async load() {
		return (await Promise.resolve().then(() => MpegParser_exports)).MpegParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/MusepackLoader.js
var musepackParserLoader = {
	parserType: "musepack",
	extensions: [".mpc"],
	mimeTypes: ["audio/musepack"],
	async load() {
		return (await Promise.resolve().then(() => MusepackParser_exports)).MusepackParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/OggLoader.js
var oggParserLoader = {
	parserType: "ogg",
	extensions: [
		".ogg",
		".ogv",
		".oga",
		".ogm",
		".ogx",
		".opus",
		".spx"
	],
	mimeTypes: [
		"application/ogg",
		"audio/ogg",
		"audio/opus",
		"audio/speex",
		"video/ogg"
	],
	async load() {
		return (await Promise.resolve().then(() => OggParser_exports)).OggParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wav/WaveLoader.js
var riffParserLoader = {
	parserType: "riff",
	extensions: [
		".wav",
		"wave",
		".bwf"
	],
	mimeTypes: [
		"audio/vnd.wave",
		"audio/wav",
		"audio/wave"
	],
	async load() {
		return (await Promise.resolve().then(() => WaveParser_exports)).WaveParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wavpack/WavPackLoader.js
var wavpackParserLoader = {
	parserType: "wavpack",
	extensions: [".wv", ".wvp"],
	mimeTypes: ["audio/wavpack"],
	async load() {
		return (await Promise.resolve().then(() => WavPackParser_exports)).WavPackParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ParserFactory.js
var debug$16 = (0, import_src.default)("music-metadata:parser:factory");
function parseHttpContentType(contentType) {
	const type = parse(contentType);
	const mime = parse$1(type.type);
	return {
		type: mime.type,
		subtype: mime.subtype,
		suffix: mime.suffix,
		parameters: type.parameters
	};
}
var ParserFactory = class {
	parsers = [];
	constructor() {
		[
			flacParserLoader,
			mpegParserLoader,
			apeParserLoader,
			mp4ParserLoader,
			matroskaParserLoader,
			riffParserLoader,
			oggParserLoader,
			asfParserLoader,
			aiffParserLoader,
			wavpackParserLoader,
			musepackParserLoader,
			dsfParserLoader,
			dsdiffParserLoader,
			cafParserLoader
		].forEach((parser) => {
			this.registerParser(parser);
		});
	}
	registerParser(parser) {
		this.parsers.push(parser);
	}
	async parse(tokenizer, parserLoader, opts = {}) {
		const maxBufferSize = getMaxMemoryAllocation(opts);
		getMaxMetadataEntries(opts);
		getMaxChapterCount(opts);
		if (isRandomAccessTokenizer(tokenizer)) {
			debug$16("tokenizer supports random-access, scanning for appending headers");
			await scanAppendingHeaders(tokenizer, opts);
		} else debug$16("tokenizer does not support random-access, cannot scan for appending headers");
		if (!parserLoader) {
			const buf = /* @__PURE__ */ new Uint8Array(4100);
			if (tokenizer.fileInfo.mimeType) parserLoader = this.findLoaderForContentType(tokenizer.fileInfo.mimeType);
			if (!parserLoader && tokenizer.fileInfo.path) parserLoader = this.findLoaderForExtension(tokenizer.fileInfo.path);
			if (!parserLoader) {
				debug$16("Guess parser on content...");
				await tokenizer.peekBuffer(buf, { mayBeLess: true });
				const guessedType = await fileTypeFromBuffer(buf, {
					mpegOffsetTolerance: 10,
					maxBufferSize
				});
				if (!guessedType?.mime) throw new CouldNotDetermineFileTypeError("Failed to determine audio format");
				debug$16(`Guessed file type is mime=${guessedType.mime}, extension=${guessedType.ext}`);
				parserLoader = this.findLoaderForContentType(guessedType.mime);
				if (!parserLoader) throw new UnsupportedFileTypeError(`Guessed MIME-type not supported: ${guessedType.mime}`);
			}
		}
		debug$16(`Loading ${parserLoader.parserType} parser...`);
		const metadata = new MetadataCollector(opts);
		const parser = new (await (parserLoader.load()))(metadata, tokenizer, opts);
		debug$16(`Parser ${parserLoader.parserType} loaded`);
		await parser.parse();
		if (metadata.format.trackInfo.length === 0 && metadata.format.hasAudio === true) metadata.addStreamInfo(createAudioTrackInfo(metadata.format));
		if (metadata.format.trackInfo) {
			if (metadata.format.hasAudio === void 0) metadata.setFormat("hasAudio", !!metadata.format.trackInfo.find((track) => track.type === TrackType.audio));
			if (metadata.format.hasVideo === void 0) metadata.setFormat("hasVideo", !!metadata.format.trackInfo.find((track) => track.type === TrackType.video));
		}
		finalizeContainerInfo(metadata, tokenizer.fileInfo.size);
		return metadata.toCommonMetadata();
	}
	/**
	* @param filePath - Path, filename or extension to audio file
	* @return Parser submodule name
	*/
	findLoaderForExtension(filePath) {
		if (!filePath) return;
		const extension = getExtension(filePath).toLocaleLowerCase() || filePath;
		return this.parsers.find((parser) => parser.extensions.indexOf(extension) !== -1);
	}
	findLoaderForContentType(httpContentType) {
		let mime;
		if (!httpContentType) return;
		try {
			mime = parseHttpContentType(httpContentType);
		} catch (_err) {
			debug$16(`Invalid HTTP Content-Type header value: ${httpContentType}`);
			return;
		}
		const subType = mime.subtype.indexOf("x-") === 0 ? mime.subtype.substring(2) : mime.subtype;
		return this.parsers.find((parser) => parser.mimeTypes.find((loader) => loader.indexOf(`${mime.type}/${subType}`) !== -1));
	}
	getSupportedMimeTypes() {
		const mimeTypeSet = /* @__PURE__ */ new Set();
		this.parsers.forEach((loader) => {
			loader.mimeTypes.forEach((mimeType) => {
				mimeTypeSet.add(mimeType);
				mimeTypeSet.add(mimeType.replace("/", "/x-"));
			});
		});
		return Array.from(mimeTypeSet);
	}
};
function getExtension(fname) {
	const i = fname.lastIndexOf(".");
	return i === -1 ? "" : fname.substring(i);
}
//#endregion
//#region node_modules/music-metadata/lib/mpeg/AdtsFrameHeader.js
/**
* ADTS/AAC fixed header. The remaining three bytes contain the rest of the frame length.
* Ref: https://wiki.multimedia.cx/index.php/ADTS
*/
var AdtsFrameHeader = class AdtsFrameHeader {
	static profiles = [
		"AAC Main",
		"AAC LC",
		"AAC SSR",
		"AAC LTP"
	];
	static samplingRates = [
		96e3,
		88200,
		64e3,
		48e3,
		44100,
		32e3,
		24e3,
		22050,
		16e3,
		12e3,
		11025,
		8e3,
		7350,
		null,
		null,
		null
	];
	static channelCounts = [
		void 0,
		1,
		2,
		3,
		4,
		5,
		6,
		8
	];
	container;
	codec = "AAC";
	codecProfile;
	samplingRate;
	numberOfChannels;
	frameLength;
	headerLength;
	static matches(buf) {
		return (buf[1] & 22) === 16;
	}
	constructor(buf) {
		this.headerLength = (buf[1] & 1) === 0 ? 9 : 7;
		this.container = `ADTS/MPEG-${isBitSet$2(buf, 1, 4) ? 2 : 4}`;
		this.codecProfile = AdtsFrameHeader.profiles[getBitAllignedNumber$1(buf, 2, 0, 2)];
		this.samplingRate = AdtsFrameHeader.samplingRates[getBitAllignedNumber$1(buf, 2, 2, 4)];
		this.numberOfChannels = AdtsFrameHeader.channelCounts[getBitAllignedNumber$1(buf, 2, 7, 3)];
		this.frameLength = getBitAllignedNumber$1(buf, 3, 6, 2) << 11;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/core.js
/**
* Cross-platform entry point for reading and writing metadata.
*/
/**
* Parse Web API File
* Requires Blob to be able to stream using a ReadableStreamBYOBReader, only available since Node.js ≥ 20
* @param blob - Blob to parse
* @param options - Parsing options
* @returns Metadata
*/
async function parseBlob(blob, options = {}) {
	const tokenizer = fromBlob(blob, getTokenizerOptions(options));
	try {
		return await parseFromTokenizer(tokenizer, options);
	} finally {
		await tokenizer.close();
	}
}
/**
* Parse audio from ITokenizer source
* @param tokenizer - Audio source implementing the tokenizer interface
* @param options - Parsing options
* @returns Metadata
*/
function parseFromTokenizer(tokenizer, options) {
	return new ParserFactory().parse(tokenizer, void 0, options);
}
async function scanAppendingHeaders(tokenizer, options = {}) {
	let apeOffset = tokenizer.fileInfo.size;
	if (await hasID3v1Header(tokenizer)) {
		apeOffset -= 128;
		const lyricsLen = await getLyricsHeaderLength(tokenizer);
		apeOffset -= lyricsLen;
	}
	options.apeHeader = await APEv2Parser.findApeFooterOffset(tokenizer, apeOffset);
}
//#endregion
//#region node_modules/music-metadata/lib/index.js
/**
* Node.js specific entry point.
*/
var lib_exports = /* @__PURE__ */ __exportAll({
	FieldDecodingError: () => FieldDecodingError,
	InternalParserError: () => InternalParserError,
	UnexpectedFileContentError: () => UnexpectedFileContentError,
	makeParseError: () => makeParseError,
	makeUnexpectedFileContentError: () => makeUnexpectedFileContentError,
	parseBlob: () => parseBlob,
	parseFromTokenizer: () => parseFromTokenizer,
	scanAppendingHeaders: () => scanAppendingHeaders
});
//#endregion
//#region node_modules/music-metadata/lib/ebml/types.js
var DataType = {
	string: 0,
	uint: 1,
	uid: 2,
	bool: 3,
	binary: 4,
	float: 5,
	int: 6
};
//#endregion
//#region node_modules/music-metadata/lib/ebml/EbmlIterator.js
var debug$15 = (0, import_src.default)("music-metadata:parser:ebml");
var EbmlContentError = class extends makeUnexpectedFileContentError("EBML") {};
var ParseAction = {
	ReadNext: 0,
	IgnoreElement: 2,
	SkipSiblings: 3,
	TerminateParsing: 4,
	SkipElement: 5
};
/**
* Extensible Binary Meta Language (EBML) iterator
* https://en.wikipedia.org/wiki/Extensible_Binary_Meta_Language
* http://matroska.sourceforge.net/technical/specs/rfc/index.html
*
* WEBM VP8 AUDIO FILE
*/
var EbmlIterator = class {
	options;
	parserMap = /* @__PURE__ */ new Map();
	ebmlMaxIDLength = 4;
	ebmlMaxSizeLength = 8;
	tokenizer;
	elementHeader;
	/**
	* @param {ITokenizer} tokenizer Input
	* @param tokenizer
	*/
	constructor(tokenizer, options = {}) {
		this.options = options;
		this.tokenizer = tokenizer;
		const maxMemoryAllocation = getMaxMemoryAllocation(options);
		this.elementHeader = new Uint8Array(Math.min(12, maxMemoryAllocation));
		this.parserMap.set(DataType.uint, (e) => this.readUint(e));
		this.parserMap.set(DataType.int, (e) => this.readInt(e));
		this.parserMap.set(DataType.string, (e) => this.readString(e));
		this.parserMap.set(DataType.binary, (e) => this.readBuffer(e));
		this.parserMap.set(DataType.uid, async (e) => this.readBuffer(e));
		this.parserMap.set(DataType.bool, (e) => this.readFlag(e));
		this.parserMap.set(DataType.float, (e) => this.readFloat(e));
	}
	async iterate(dtdElement, posDone, listener) {
		const root = {
			...dtdElement,
			id: 0,
			parent: void 0
		};
		return await this.parseContainer(root, posDone, {
			startNext: listener.startNext,
			collect: listener.collect ?? (() => true),
			elementValue: async (element, value, offset) => {
				await listener.elementValue?.(element, value, offset);
				await listener.onElement?.({
					id: element.id,
					element,
					value,
					offset
				});
			}
		}, listener.collect?.(root) ?? true);
	}
	async parseContainer(dtdElement, posDone, listener, collect) {
		const tree = {};
		while (this.tokenizer.position < posDone) {
			let element;
			const elementPosition = this.tokenizer.position;
			try {
				element = await this.readElement();
			} catch (error) {
				if (error instanceof EndOfStreamError) break;
				throw error;
			}
			const definition = dtdElement.container?.[element.id];
			if (definition) {
				const child = {
					...definition,
					id: element.id,
					parent: dtdElement
				};
				switch (await listener.startNext(child)) {
					case ParseAction.ReadNext:
						debug$15(`Read element: name=${getElementPath(child)}{id=0x${element.id.toString(16)}, container=${!!child.container}} at position=${elementPosition}`);
						if (child.container) {
							const childEnd = Math.min(posDone, this.tokenizer.fileInfo.size ?? Number.POSITIVE_INFINITY, element.len >= 0 ? this.tokenizer.position + element.len : posDone);
							const res = await this.parseContainer(child, childEnd, listener, collect || listener.collect(child));
							if (collect) this.collect(tree, child, res);
							await listener.elementValue(child, res, elementPosition);
						} else {
							const parser = child.value === void 0 ? void 0 : this.parserMap.get(child.value);
							if (typeof parser === "function") {
								const end = Math.min(posDone, this.tokenizer.fileInfo.size ?? Number.POSITIVE_INFINITY);
								if (!Number.isSafeInteger(element.len) || element.len < 0 || element.len > end - this.tokenizer.position) throw new EbmlContentError(`Invalid element length: ${element.len}`);
								const value = await parser(element);
								if (collect) this.collect(tree, child, value);
								await listener.elementValue(child, value, elementPosition);
							} else if (!await this.ignore(element.len, posDone)) return tree;
						}
						break;
					case ParseAction.SkipElement:
						debug$15(`Go to next element: name=${getElementPath(child)}, element.id=0x${element.id}, container=${!!child.container} at position=${elementPosition}`);
						break;
					case ParseAction.IgnoreElement:
						debug$15(`Ignore element: name=${getElementPath(child)}, element.id=0x${element.id}, container=${!!child.container} at position=${elementPosition}`);
						if (!await this.ignore(element.len, posDone)) return tree;
						break;
					case ParseAction.SkipSiblings:
						debug$15(`Ignore remaining container, at: name=${getElementPath(child)}, element.id=0x${element.id}, container=${!!child.container} at position=${elementPosition}`);
						if (!await this.ignore(posDone - this.tokenizer.position, posDone)) return tree;
						break;
					case ParseAction.TerminateParsing:
						debug$15(`Terminate parsing at element: name=${getElementPath(child)}, element.id=0x${element.id}, container=${!!child.container} at position=${elementPosition}`);
						return tree;
				}
			} else switch (element.id) {
				case 236:
					if (!await this.ignore(element.len, posDone)) return tree;
					break;
				default:
					debug$15(`parseEbml: parent=${getElementPath(dtdElement)}, unknown child: id=${element.id.toString(16)} at position=${elementPosition}`);
					if (!await this.ignore(element.len, posDone)) return tree;
			}
		}
		return tree;
	}
	collect(tree, element, value) {
		if (element.multiple) {
			const values = tree[element.name] ??= [];
			if (Array.isArray(values)) {
				if (values.length >= getMaxMetadataEntries(this.options)) throw new EbmlContentError("Collected EBML element count exceeds entry limit");
				values.push(value);
			}
		} else tree[element.name] = value;
	}
	async ignore(length, posDone) {
		const end = Math.min(posDone, this.tokenizer.fileInfo.size ?? Number.POSITIVE_INFINITY);
		const boundedLength = Math.min(length, end - this.tokenizer.position);
		if (!Number.isSafeInteger(boundedLength) || boundedLength < 0) throw new EbmlContentError(`Invalid element length: ${length}`);
		try {
			return await this.tokenizer.ignore(boundedLength) === boundedLength;
		} catch (error) {
			if (error instanceof EndOfStreamError) return false;
			throw error;
		}
	}
	async readVintData(maxLength) {
		const msb = await this.tokenizer.peekNumber(UINT8);
		let mask = 128;
		let oc = 1;
		while ((msb & mask) === 0) {
			if (oc > maxLength) throw new EbmlContentError("VINT value exceeding maximum size");
			++oc;
			mask >>= 1;
		}
		const id = new Uint8Array(oc);
		await this.tokenizer.readBuffer(id);
		return id;
	}
	async readElement() {
		if (isRandomAccessTokenizer(this.tokenizer) && this.elementHeader.length === 12) {
			const available = await this.tokenizer.peekBuffer(this.elementHeader, { mayBeLess: true });
			const width = (offset, maximum) => {
				if (offset >= available) throw new EndOfStreamError();
				for (let length = 1; length <= maximum; ++length) if ((this.elementHeader[offset] & 128 >> length - 1) !== 0) {
					if (offset + length > available) throw new EndOfStreamError();
					return length;
				}
				throw new EbmlContentError("VINT value exceeding maximum size");
			};
			const idLength = width(0, this.ebmlMaxIDLength);
			const sizeLength = width(idLength, this.ebmlMaxSizeLength);
			const id = readUIntBE(this.elementHeader.subarray(0, idLength), idLength);
			const lenField = this.elementHeader.subarray(idLength, idLength + sizeLength);
			lenField[0] ^= 128 >> sizeLength - 1;
			this.tokenizer.setPosition(this.tokenizer.position + idLength + sizeLength);
			return {
				id,
				len: readUIntBE(lenField, sizeLength)
			};
		}
		const id = await this.readVintData(this.ebmlMaxIDLength);
		const lenField = await this.readVintData(this.ebmlMaxSizeLength);
		lenField[0] ^= 128 >> lenField.length - 1;
		return {
			id: readUIntBE(id, id.length),
			len: readUIntBE(lenField, lenField.length)
		};
	}
	async readFloat(e) {
		switch (e.len) {
			case 0: return 0;
			case 4: return this.tokenizer.readNumber(Float32_BE);
			case 8: return this.tokenizer.readNumber(Float64_BE);
			case 10: return this.tokenizer.readNumber(Float64_BE);
			default: throw new EbmlContentError(`Invalid IEEE-754 float length: ${e.len}`);
		}
	}
	async readFlag(e) {
		return await this.readUint(e) === 1;
	}
	async readUint(e) {
		return readUIntBE(await this.readBuffer(e), e.len);
	}
	async readInt(e) {
		const buffer = await this.readBuffer(e);
		const value = readUIntBeAsBigInt(buffer, e.len);
		return Number(buffer[0] & 128 ? value - (1n << BigInt(8 * e.len)) : value);
	}
	async readString(e) {
		const buf = await this.readBuffer(e);
		return new StringType(e.len, "utf-8").get(buf, 0).replace(/\x00.*$/g, "");
	}
	async readBuffer(e) {
		return readBuffer(this.tokenizer, e.len, this.options, void 0, (message) => new EbmlContentError(message));
	}
};
function readUIntBE(buf, len) {
	return Number(readUIntBeAsBigInt(buf, len));
}
/**
* Reeds an unsigned integer from a big endian buffer of length `len`
* @param buf Buffer to decode from
* @param len Number of bytes
* @private
*/
function readUIntBeAsBigInt(buf, len) {
	const normalizedNumber = /* @__PURE__ */ new Uint8Array(8);
	const cleanNumber = buf.subarray(0, len);
	try {
		normalizedNumber.set(cleanNumber, 8 - len);
		return UINT64_BE.get(normalizedNumber, 0);
	} catch (_error) {
		return BigInt(-1);
	}
}
function getElementPath(element) {
	let path = "";
	if (element.parent && element.parent.name !== "dtd") path += `${getElementPath(element.parent)}/`;
	return path + element.name;
}
//#endregion
//#region node_modules/music-metadata/lib/matroska/MatroskaDtd.js
/**
* Elements of document type description
* Derived from https://github.com/tungol/EBML/blob/master/doctypes/matroska.dtd
* Extended with:
* - https://www.matroska.org/technical/specs/index.html
* Cardinality and paths audited against:
* https://github.com/ietf-wg-cellar/matroska-specification/blob/master/ebml_matroska.xml
* UID integers deliberately decode as bytes to preserve all 64 bits.
* Recursive ChapterAtom/SimpleTag children are not expanded by this metadata subset.
*/
var matroskaDtd = {
	name: "dtd",
	container: {
		440786851: {
			name: "ebml",
			container: {
				17030: {
					name: "ebmlVersion",
					value: DataType.uint
				},
				17143: {
					name: "ebmlReadVersion",
					value: DataType.uint
				},
				17138: {
					name: "ebmlMaxIDWidth",
					value: DataType.uint
				},
				17139: {
					name: "ebmlMaxSizeWidth",
					value: DataType.uint
				},
				17026: {
					name: "docType",
					value: DataType.string
				},
				17031: {
					name: "docTypeVersion",
					value: DataType.uint
				},
				17029: {
					name: "docTypeReadVersion",
					value: DataType.uint
				}
			}
		},
		408125543: {
			name: "segment",
			container: {
				290298740: {
					name: "seekHead",
					multiple: true,
					container: { 19899: {
						name: "seek",
						multiple: true,
						container: {
							21419: {
								name: "id",
								value: DataType.binary
							},
							21420: {
								name: "position",
								value: DataType.uint
							}
						}
					} }
				},
				357149030: {
					name: "info",
					container: {
						29604: {
							name: "uid",
							value: DataType.uid
						},
						29572: {
							name: "filename",
							value: DataType.string
						},
						3979555: {
							name: "prevUID",
							value: DataType.uid
						},
						3965867: {
							name: "prevFilename",
							value: DataType.string
						},
						4110627: {
							name: "nextUID",
							value: DataType.uid
						},
						4096955: {
							name: "nextFilename",
							value: DataType.string
						},
						2807729: {
							name: "timecodeScale",
							value: DataType.uint
						},
						17545: {
							name: "duration",
							value: DataType.float
						},
						17505: {
							name: "dateUTC",
							value: DataType.int
						},
						31657: {
							name: "title",
							value: DataType.string
						},
						19840: {
							name: "muxingApp",
							value: DataType.string
						},
						22337: {
							name: "writingApp",
							value: DataType.string
						}
					}
				},
				524531317: {
					name: "cluster",
					multiple: true,
					container: {
						231: {
							name: "timecode",
							value: DataType.uint
						},
						22612: {
							name: "silentTracks",
							container: { 22743: {
								name: "trackNumber",
								value: DataType.uint,
								multiple: true
							} }
						},
						167: {
							name: "position",
							value: DataType.uint
						},
						171: {
							name: "prevSize",
							value: DataType.uint
						},
						160: {
							name: "blockGroup",
							multiple: true
						},
						163: {
							name: "simpleBlock",
							value: DataType.binary,
							multiple: true
						}
					}
				},
				374648427: {
					name: "tracks",
					container: { 174: {
						name: "entries",
						multiple: true,
						container: {
							215: {
								name: "trackNumber",
								value: DataType.uint
							},
							29637: {
								name: "uid",
								value: DataType.uid
							},
							131: {
								name: "trackType",
								value: DataType.uint
							},
							185: {
								name: "flagEnabled",
								value: DataType.bool
							},
							136: {
								name: "flagDefault",
								value: DataType.bool
							},
							21930: {
								name: "flagForced",
								value: DataType.bool
							},
							156: {
								name: "flagLacing",
								value: DataType.bool
							},
							28135: {
								name: "minCache",
								value: DataType.uint
							},
							28152: {
								name: "maxCache",
								value: DataType.uint
							},
							2352003: {
								name: "defaultDuration",
								value: DataType.uint
							},
							2306383: {
								name: "trackTimecodeScale",
								value: DataType.float
							},
							21358: {
								name: "name",
								value: DataType.string
							},
							2274716: {
								name: "language",
								value: DataType.string
							},
							2274717: {
								name: "languageIETF",
								value: DataType.string
							},
							134: {
								name: "codecID",
								value: DataType.string
							},
							25506: {
								name: "codecPrivate",
								value: DataType.binary
							},
							2459272: {
								name: "codecName",
								value: DataType.string
							},
							3839639: {
								name: "codecSettings",
								value: DataType.string
							},
							3883072: {
								name: "codecInfoUrl",
								value: DataType.string,
								multiple: true
							},
							2536e3: {
								name: "codecDownloadUrl",
								value: DataType.string,
								multiple: true
							},
							170: {
								name: "codecDecodeAll",
								value: DataType.bool
							},
							28587: {
								name: "trackOverlay",
								value: DataType.uint,
								multiple: true
							},
							224: {
								name: "video",
								container: {
									154: {
										name: "flagInterlaced",
										value: DataType.uint
									},
									21432: {
										name: "stereoMode",
										value: DataType.uint
									},
									176: {
										name: "pixelWidth",
										value: DataType.uint
									},
									186: {
										name: "pixelHeight",
										value: DataType.uint
									},
									21680: {
										name: "displayWidth",
										value: DataType.uint
									},
									21690: {
										name: "displayHeight",
										value: DataType.uint
									},
									21682: {
										name: "displayUnit",
										value: DataType.uint
									},
									21683: {
										name: "aspectRatioType",
										value: DataType.uint
									},
									3061028: {
										name: "colourSpace",
										value: DataType.binary
									},
									3126563: {
										name: "gammaValue",
										value: DataType.float
									}
								}
							},
							225: {
								name: "audio",
								container: {
									181: {
										name: "samplingFrequency",
										value: DataType.float
									},
									30901: {
										name: "outputSamplingFrequency",
										value: DataType.float
									},
									159: {
										name: "channels",
										value: DataType.uint
									},
									32123: {
										name: "channelPositions",
										value: DataType.binary
									},
									25188: {
										name: "bitDepth",
										value: DataType.uint
									}
								}
							},
							28032: {
								name: "contentEncodings",
								container: { 25152: {
									name: "contentEncoding",
									multiple: true,
									container: {
										20529: {
											name: "order",
											value: DataType.uint
										},
										20530: {
											name: "scope",
											value: DataType.uint
										},
										20531: {
											name: "type",
											value: DataType.uint
										},
										20532: {
											name: "contentCompression",
											container: {
												16980: {
													name: "contentCompAlgo",
													value: DataType.uint
												},
												16981: {
													name: "contentCompSettings",
													value: DataType.binary
												}
											}
										},
										20533: {
											name: "contentEncryption",
											container: {
												18401: {
													name: "contentEncAlgo",
													value: DataType.uint
												},
												18402: {
													name: "contentEncKeyID",
													value: DataType.binary
												},
												18403: {
													name: "contentSignature",
													value: DataType.binary
												},
												18404: {
													name: "contentSigKeyID",
													value: DataType.binary
												},
												18405: {
													name: "contentSigAlgo",
													value: DataType.uint
												},
												18406: {
													name: "contentSigHashAlgo",
													value: DataType.uint
												}
											}
										}
									}
								} }
							}
						}
					} }
				},
				475249515: {
					name: "cues",
					container: { 187: {
						name: "cuePoint",
						multiple: true,
						container: {
							179: {
								name: "cueTime",
								value: DataType.uint
							},
							183: {
								name: "positions",
								multiple: true,
								container: {
									247: {
										name: "track",
										value: DataType.uint
									},
									241: {
										name: "clusterPosition",
										value: DataType.uint
									},
									21368: {
										name: "blockNumber",
										value: DataType.uint
									},
									234: {
										name: "codecState",
										value: DataType.uint
									},
									219: {
										name: "reference",
										multiple: true,
										container: {
											150: {
												name: "time",
												value: DataType.uint
											},
											151: {
												name: "cluster",
												value: DataType.uint
											},
											21343: {
												name: "number",
												value: DataType.uint
											},
											235: {
												name: "codecState",
												value: DataType.uint
											}
										}
									},
									240: {
										name: "relativePosition",
										value: DataType.uint
									}
								}
							}
						}
					} }
				},
				423732329: {
					name: "attachments",
					container: { 24999: {
						name: "attachedFiles",
						multiple: true,
						container: {
							18046: {
								name: "description",
								value: DataType.string
							},
							18030: {
								name: "name",
								value: DataType.string
							},
							18016: {
								name: "mimeType",
								value: DataType.string
							},
							18012: {
								name: "data",
								value: DataType.binary
							},
							18094: {
								name: "uid",
								value: DataType.uid
							}
						}
					} }
				},
				272869232: {
					name: "chapters",
					container: { 17849: {
						name: "editionEntry",
						multiple: true,
						container: { 182: {
							name: "chapterAtom",
							multiple: true,
							container: {
								29636: {
									name: "uid",
									value: DataType.uid
								},
								145: {
									name: "timeStart",
									value: DataType.uint
								},
								146: {
									name: "timeEnd",
									value: DataType.uint
								},
								152: {
									name: "hidden",
									value: DataType.bool
								},
								17816: {
									name: "enabled",
									value: DataType.bool
								},
								143: {
									name: "track",
									container: { 137: {
										name: "trackUID",
										value: DataType.uid,
										multiple: true
									} }
								},
								128: {
									name: "display",
									multiple: true,
									container: {
										133: {
											name: "string",
											value: DataType.string
										},
										17276: {
											name: "language",
											value: DataType.string,
											multiple: true
										},
										17278: {
											name: "country",
											value: DataType.string,
											multiple: true
										}
									}
								}
							}
						} }
					} }
				},
				307544935: {
					name: "tags",
					multiple: true,
					container: { 29555: {
						name: "tag",
						multiple: true,
						container: {
							25536: {
								name: "target",
								container: {
									25541: {
										name: "tagTrackUID",
										value: DataType.uid,
										multiple: true
									},
									25540: {
										name: "tagChapterUID",
										value: DataType.uid,
										multiple: true
									},
									25542: {
										name: "tagAttachmentUID",
										value: DataType.uid,
										multiple: true
									},
									25546: {
										name: "targetType",
										value: DataType.string
									},
									26826: {
										name: "targetTypeValue",
										value: DataType.uint
									},
									25545: {
										name: "tagEditionUID",
										value: DataType.uid,
										multiple: true
									}
								}
							},
							26568: {
								name: "simpleTags",
								multiple: true,
								container: {
									17827: {
										name: "name",
										value: DataType.string
									},
									17543: {
										name: "string",
										value: DataType.string
									},
									17541: {
										name: "binary",
										value: DataType.binary
									},
									17530: {
										name: "language",
										value: DataType.string
									},
									17531: {
										name: "languageIETF",
										value: DataType.string
									},
									17540: {
										name: "default",
										value: DataType.bool
									}
								}
							}
						}
					} }
				}
			}
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/matroska/types.js
var TargetType = {
	10: "shot",
	20: "scene",
	30: "track",
	40: "part",
	50: "album",
	60: "edition",
	70: "collection"
};
//#endregion
//#region node_modules/music-metadata/lib/matroska/MatroskaParser.js
var MatroskaParser_exports = /* @__PURE__ */ __exportAll({ MatroskaParser: () => MatroskaParser });
var debug$14 = (0, import_src.default)("music-metadata:parser:matroska");
var targetTypes = TargetType;
function isCompleteTrack(entry) {
	return typeof entry.trackNumber === "number" && Number.isSafeInteger(entry.trackNumber) && entry.trackNumber > 0 && typeof entry.codecID === "string" && entry.codecID.length > 0 && Object.values(TrackType).some((type) => type === entry.trackType);
}
function isCompleteFile(file) {
	return typeof file.name === "string" && typeof file.mimeType === "string" && file.data instanceof Uint8Array && file.uid instanceof Uint8Array;
}
function videoInfo(video) {
	const { flagInterlaced, ...properties } = video;
	const result = properties;
	if (flagInterlaced === 1 || flagInterlaced === 2) result.flagInterlaced = flagInterlaced === 1;
	return result;
}
/**
* Extensible Binary Meta Language (EBML) parser
* https://en.wikipedia.org/wiki/Extensible_Binary_Meta_Language
* http://matroska.sourceforge.net/technical/specs/rfc/index.html
*
* WEBM VP8 AUDIO FILE
*/
var MatroskaParser = class extends BasicParser {
	tracksByUid = /* @__PURE__ */ new Map();
	trackStatistics = /* @__PURE__ */ new Map();
	seekHead;
	seekHeadOffset = 0;
	selectedAudioTrackUid;
	albumCandidates = [];
	/**
	* Use index to skip multiple segment/cluster elements at once.
	* Significant performance impact
	*/
	flagUseIndexToSkipClusters = this.options.mkvUseIndex ?? false;
	async parse() {
		const containerSize = this.tokenizer.fileInfo.size ?? Number.MAX_SAFE_INTEGER;
		const attachmentMimeTypes = /* @__PURE__ */ new WeakMap();
		const matroskaIterator = new EbmlIterator(this.tokenizer, this.options);
		debug$14("Initializing DTD end MatroskaIterator");
		await matroskaIterator.iterate(matroskaDtd, containerSize, {
			collect: (element) => [
				290298740,
				357149030,
				374648427,
				29555,
				24999
			].includes(element.id),
			startNext: async (element) => {
				switch (element.id) {
					case 408125543:
						this.seekHeadOffset = this.tokenizer.position;
						return ParseAction.ReadNext;
					case 423732329: return this.options.skipCovers ? ParseAction.IgnoreElement : ParseAction.ReadNext;
					case 18012: {
						const mimeType = element.parent && attachmentMimeTypes.get(element.parent);
						return mimeType !== void 0 && !mimeType.startsWith("image/") ? ParseAction.IgnoreElement : ParseAction.ReadNext;
					}
					case 290298740: return this.flagUseIndexToSkipClusters ? ParseAction.ReadNext : ParseAction.IgnoreElement;
					case 25506:
					case 28032:
					case 272869232:
					case 475249515:
						debug$14(`Skip element: name=${element.name}, id=0x${element.id.toString(16)}`);
						return ParseAction.IgnoreElement;
					case 524531317:
						if (this.flagUseIndexToSkipClusters && this.seekHead) {
							const index = (this.seekHead.seek ?? []).find((index) => index.position !== void 0 && index.position + this.seekHeadOffset > this.tokenizer.position);
							if (index?.position !== void 0) {
								const ignoreSize = index.position + this.seekHeadOffset - this.tokenizer.position;
								debug$14(`Use index to go to next position, ignoring ${ignoreSize} bytes`);
								await this.tokenizer.ignore(ignoreSize);
								return ParseAction.SkipElement;
							}
						}
						return ParseAction.IgnoreElement;
					default: return ParseAction.ReadNext;
				}
			},
			onElement: async (event) => {
				if (debug$14.enabled) {
					const value = event.value instanceof Uint8Array ? `${event.value.byteLength} bytes` : event.value;
					debug$14(`Received: name=${event.element.name}, value=${value}`);
				}
				switch (event.id) {
					case 17026:
						this.metadata.setFormat("container", `EBML/${event.value}`);
						break;
					case 290298740:
						this.seekHead = event.value;
						break;
					case 357149030:
						{
							const info = event.value;
							if (info.title !== void 0) await this.addTag("segment:title", info.title);
							const timecodeScale = info.timecodeScale ? info.timecodeScale : 1e6;
							if (typeof info.duration === "number") {
								const duration = info.duration * timecodeScale / 1e9;
								if (Number.isFinite(duration) && duration > 0) {
									this.metadata.setFormat("duration", duration);
									this.metadata.setFormat("containerDuration", duration);
								}
							}
						}
						break;
					case 374648427:
						{
							const audioTracks = event.value;
							if (audioTracks?.entries) {
								const entries = audioTracks.entries.filter((entry) => {
									if (isCompleteTrack(entry)) return true;
									this.metadata.addWarning("Ignoring Matroska track without valid TrackNumber, TrackType or CodecID");
									return false;
								}).filter(isCompleteTrack);
								entries.forEach((entry) => {
									const stream = {
										id: entry.trackNumber,
										codecId: entry.codecID,
										codecName: entry.codecName ?? entry.codecID.replace(/^[AV]_/, ""),
										codecSettings: entry.codecSettings,
										flagDefault: entry.flagDefault ?? true,
										flagLacing: entry.flagLacing ?? true,
										flagEnabled: entry.flagEnabled ?? true,
										flagForced: entry.flagForced ?? false,
										language: entry.languageIETF ?? entry.language ?? "eng",
										name: entry.name,
										type: entry.trackType,
										audio: entry.trackType === TrackType.audio ? {
											...entry.audio,
											samplingFrequency: entry.audio?.samplingFrequency ?? 8e3,
											channels: entry.audio?.channels ?? 1
										} : void 0,
										video: entry.trackType === TrackType.video && entry.video ? videoInfo(entry.video) : void 0
									};
									if (stream.video && entry.defaultDuration && entry.defaultDuration > 0) stream.video = {
										...stream.video,
										frameRate: 1e9 / entry.defaultDuration
									};
									if (entry.uid) this.tracksByUid.set(this.uidKey(entry.uid), stream);
									this.metadata.addStreamInfo(stream);
								});
								const audioTrack = entries.filter((entry) => entry.trackType === TrackType.audio && entry.flagEnabled !== false).reduce((acc, cur) => {
									if (!acc) return cur;
									const currentDefault = cur.flagDefault ?? true;
									if (currentDefault !== (acc.flagDefault ?? true)) return currentDefault ? cur : acc;
									if (cur.trackNumber < acc.trackNumber) return cur;
									return acc;
								}, null);
								if (audioTrack) {
									if (audioTrack.uid) this.selectedAudioTrackUid = this.uidKey(audioTrack.uid);
									this.metadata.setFormat("codec", audioTrack.codecID.replace(/^A_/, ""));
									this.metadata.setFormat("hasAudio", true);
									this.metadata.setFormat("sampleRate", audioTrack.audio?.outputSamplingFrequency ?? audioTrack.audio?.samplingFrequency ?? 8e3);
									this.metadata.setFormat("numberOfChannels", audioTrack.audio?.channels ?? 1);
									if (audioTrack.audio?.bitDepth !== void 0) this.metadata.setFormat("bitsPerSample", audioTrack.audio.bitDepth);
								}
							}
						}
						break;
					case 29555: {
						const tag = event.value;
						const target = tag.target;
						for (const uid of target?.tagTrackUID ?? []) {
							const key = this.uidKey(uid);
							if (key !== "0") {
								const statistics = this.trackStatistics.get(key) ?? /* @__PURE__ */ new Map();
								for (const simpleTag of tag.simpleTags ?? []) if (simpleTag.name && typeof simpleTag.string === "string") statistics.set(simpleTag.name.toUpperCase(), simpleTag.string);
								this.trackStatistics.set(key, statistics);
							}
						}
						const targetType = target?.targetTypeValue !== void 0 ? targetTypes[target.targetTypeValue] ?? "track" : target?.targetType ?? "track";
						const isTrackTarget = targetType.toLowerCase() === "track";
						const targetUidKeys = (target?.tagTrackUID ?? []).map((uid) => this.uidKey(uid)).filter((uid) => uid !== "0");
						const selectedAudioUid = this.selectedAudioTrackUid;
						const targetsSelectedAudio = selectedAudioUid !== void 0 && targetUidKeys.includes(selectedAudioUid);
						const isUntargeted = (target?.tagTrackUID ?? []).length === 0;
						for (const simpleTag of tag.simpleTags ?? []) {
							const value = simpleTag.string ?? simpleTag.binary;
							if (simpleTag.name && value !== void 0) {
								const nameUpper = simpleTag.name.toUpperCase();
								if (isTrackTarget && nameUpper === "ALBUM") {
									this.addNativeTag("track:ALBUM", value);
									this.albumCandidates.push({
										value,
										targetUIDs: targetUidKeys,
										untargeted: isUntargeted
									});
								} else if (isTrackTarget && (nameUpper === "DATE" || nameUpper === "DISC" || nameUpper === "COMPOSER" || nameUpper === "ALBUM_ARTIST")) {
									if (selectedAudioUid !== void 0 && !targetsSelectedAudio && !isUntargeted) this.addNativeTag(`track:${simpleTag.name}`, value);
									else await this.addTag(`${targetType}:${simpleTag.name}`, value);
								} else await this.addTag(`${targetType}:${simpleTag.name}`, value);
							}
						}
						break;
					}
					case 18016:
						if (event.element.parent) attachmentMimeTypes.set(event.element.parent, event.value);
						break;
					case 24999: {
						const file = event.value;
						if (file.mimeType?.startsWith("image/")) {
							if (isCompleteFile(file)) await this.addTag("picture", {
								data: file.data,
								format: file.mimeType,
								description: file.description,
								name: file.name
							});
							else this.metadata.addWarning("Ignoring incomplete Matroska image attachment");
						}
						break;
					}
				}
			}
		});
		this.applyTrackStatistics();
		await this.resolveTrackAlbum();
	}
	addNativeTag(tagId, value) {
		this.metadata.registerTagType("matroska");
		if (!this.metadata.native.matroska) this.metadata.native.matroska = [];
		this.metadata.native.matroska.push({
			id: tagId,
			value
		});
	}
	async resolveTrackAlbum() {
		if (this.albumCandidates.length === 0) return;
		const selectedAudioUid = this.selectedAudioTrackUid;
		const targetsSelectedAudio = (candidate) => selectedAudioUid !== void 0 && candidate.targetUIDs.includes(selectedAudioUid);
		const targetsVideoOnly = (candidate) => candidate.targetUIDs.length > 0 && candidate.targetUIDs.every((uid) => this.tracksByUid.get(uid)?.type === TrackType.video);
		const selected = this.albumCandidates.findLast(targetsSelectedAudio) ?? this.albumCandidates.findLast((candidate) => candidate.untargeted) ?? this.albumCandidates.findLast((candidate) => !targetsVideoOnly(candidate)) ?? this.albumCandidates[this.albumCandidates.length - 1];
		if (this.metadata.common.album === void 0) await this.metadata.postMap("matroska", {
			id: "album",
			value: selected.value
		});
	}
	uidKey(uid) {
		return Array.from(uid, (byte) => byte.toString(16).padStart(2, "0")).join("").replace(/^0+/, "") || "0";
	}
	applyTrackStatistics() {
		for (const [uid, tags] of this.trackStatistics) {
			const track = this.tracksByUid.get(uid);
			if (!track) continue;
			const duration = tags.get("DURATION")?.match(/^(\d+):([0-5]\d):([0-5]\d(?:\.\d+)?)$/);
			if (duration) {
				const seconds = Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
				if (Number.isFinite(seconds) && seconds > 0) track.duration = seconds;
			}
			const number = (name) => {
				const value = tags.get(name);
				if (value && /^\d+$/.test(value)) {
					const result = Number(value);
					if (Number.isSafeInteger(result) && result >= 0) return result;
				}
			};
			const bitrate = number("BPS");
			const size = number("NUMBER_OF_BYTES");
			if (bitrate !== void 0 && bitrate > 0) track.bitrate = bitrate;
			else if (size !== void 0 && track.duration) track.bitrate = size * 8 / track.duration;
			const frames = number("NUMBER_OF_FRAMES");
			if (track.video && frames !== void 0 && frames > 0 && track.duration) track.video.frameRate ??= frames / track.duration;
		}
	}
	async addTag(tagId, value) {
		await this.metadata.addTag("matroska", tagId, value);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/AtomToken.js
var debug$13 = (0, import_src.default)("music-metadata:parser:MP4:atom");
var Mp4ContentError = class extends makeUnexpectedFileContentError("MP4") {};
var maxMp4StructureEntries = 5e6;
var Header$3 = {
	len: 8,
	get: (buf, off) => {
		const length = UINT32_BE.get(buf, off);
		if (length < 0) throw new Mp4ContentError("Invalid atom header length");
		return {
			length: BigInt(length),
			name: new StringType(4, "latin1").get(buf, off + 4)
		};
	},
	put: (buf, off, hdr) => {
		UINT32_BE.put(buf, off, Number(hdr.length));
		return FourCcToken.put(buf, off + 4, hdr.name);
	}
};
/**
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap1/qtff1.html#//apple_ref/doc/uid/TP40000939-CH203-38190
*/
var ExtendedSize = UINT64_BE;
var ftyp = {
	len: 4,
	get: (buf, off) => {
		return { type: new StringType(4, "ascii").get(buf, off) };
	}
};
/**
* Base class for 'fixed' length atoms.
* In some cases these atoms are longer then the sum of the described fields.
* Issue: https://github.com/Borewit/music-metadata/issues/120
*/
var FixedLengthAtom = class {
	len;
	/**
	*
	* @param {number} len Length as specified in the size field
	* @param {number} expLen Total length of sum of specified fields in the standard
	* @param atomId Atom ID
	*/
	constructor(len, expLen, atomId) {
		if (len < expLen) throw new Mp4ContentError(`Atom ${atomId} expected to be ${expLen}, but specifies ${len} bytes long.`);
		if (len > expLen) debug$13(`Warning: atom ${atomId} expected to be ${expLen}, but was actually ${len} bytes long.`);
		this.len = len;
	}
};
/**
* Timestamp stored in seconds since Mac Epoch (1 January 1904)
*/
var SecondsSinceMacEpoch = {
	len: 4,
	get: (buf, off) => {
		const secondsSinceUnixEpoch = UINT32_BE.get(buf, off) - 2082844800;
		return /* @__PURE__ */ new Date(secondsSinceUnixEpoch * 1e3);
	}
};
var SecondsSinceMacEpoch64 = {
	len: 8,
	get: (buf, off) => {
		const secondsSinceUnixEpoch = Number(UINT64_BE.get(buf, off)) - 2082844800;
		return /* @__PURE__ */ new Date(secondsSinceUnixEpoch * 1e3);
	}
};
/** Shared creation, modification and timing fields of media/movie headers. */
function readTimeHeader(buf, off) {
	const version = UINT8.get(buf, off);
	const wide = version === 1;
	const timestamp = wide ? SecondsSinceMacEpoch64 : SecondsSinceMacEpoch;
	return {
		version,
		flags: UINT24_BE.get(buf, off + 1),
		creationTime: timestamp.get(buf, off + 4),
		modificationTime: timestamp.get(buf, off + (wide ? 12 : 8)),
		timeScale: UINT32_BE.get(buf, off + (wide ? 20 : 12)),
		duration: wide ? Number(UINT64_BE.get(buf, off + 24)) : UINT32_BE.get(buf, off + 16)
	};
}
/**
* Token: Media Header Atom
* Ref:
* - https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-SW34
* - https://wiki.multimedia.cx/index.php/QuickTime_container#mdhd
*/
var MdhdAtom = class extends FixedLengthAtom {
	constructor(len) {
		super(len, 24, "mdhd");
	}
	get(buf, off) {
		const version = UINT8.get(buf, off);
		if (version !== 0 && version !== 1) throw new FieldDecodingError("Invalid mdhd version header");
		const tail = off + (version === 1 ? 32 : 20);
		return {
			...readTimeHeader(buf, off),
			language: UINT16_BE.get(buf, tail),
			quality: UINT16_BE.get(buf, tail + 2)
		};
	}
};
/**
* Token: Movie Header Atom
*/
var MvhdAtom = class extends FixedLengthAtom {
	constructor(len) {
		super(len, 100, "mvhd");
	}
	get(buf, off) {
		const tail = off + (UINT8.get(buf, off) === 1 ? 32 : 20);
		return {
			...readTimeHeader(buf, off),
			preferredRate: UINT32_BE.get(buf, tail),
			preferredVolume: UINT16_BE.get(buf, tail + 4),
			previewTime: UINT32_BE.get(buf, tail + 52),
			previewDuration: UINT32_BE.get(buf, tail + 56),
			posterTime: UINT32_BE.get(buf, tail + 60),
			selectionTime: UINT32_BE.get(buf, tail + 64),
			selectionDuration: UINT32_BE.get(buf, tail + 68),
			currentTime: UINT32_BE.get(buf, tail + 72),
			nextTrackID: UINT32_BE.get(buf, tail + 76)
		};
	}
};
/** Fixed type/locale header, shared by buffered and skipped values. */
var DataAtomHeader = {
	len: 8,
	get(buf, off) {
		if (off < 0 || buf.length - off < 8) throw new Mp4ContentError("Truncated data atom header");
		return {
			type: {
				set: UINT8.get(buf, off),
				type: UINT24_BE.get(buf, off + 1)
			},
			locale: UINT32_BE.get(buf, off + 4)
		};
	}
};
/**
* Data Atom Structure
* Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW31
*/
var NameAtom = class {
	len;
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		return {
			version: UINT8.get(buf, off),
			flags: UINT24_BE.get(buf, off + 1),
			name: new StringType(this.len - 4, "utf-8").get(buf, off + 4)
		};
	}
};
/**
* Track Header Atoms structure (`tkhd`)
* Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25550
*/
var TrackHeaderAtom = class {
	len;
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const available = Math.min(this.len, buf.length - off);
		if (available < 4) throw new Mp4ContentError("Truncated tkhd header");
		const version = UINT8.get(buf, off);
		if (version === 0 && available < 38 || version === 1 && available < 50) throw new Mp4ContentError("Truncated tkhd header");
		const flags = UINT24_BE.get(buf, off + 1);
		switch (version) {
			case 0: return {
				version,
				flags,
				creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
				modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
				trackId: UINT32_BE.get(buf, off + 12),
				duration: UINT32_BE.get(buf, off + 20),
				layer: UINT16_BE.get(buf, off + 32),
				alternateGroup: UINT16_BE.get(buf, off + 34),
				volume: UINT16_BE.get(buf, off + 36),
				...available >= 84 ? {
					displayWidth: UINT32_BE.get(buf, off + 76) / 65536,
					displayHeight: UINT32_BE.get(buf, off + 80) / 65536
				} : {}
			};
			case 1: return {
				version,
				flags,
				creationTime: SecondsSinceMacEpoch64.get(buf, off + 4),
				modificationTime: SecondsSinceMacEpoch64.get(buf, off + 12),
				trackId: UINT32_BE.get(buf, off + 20),
				duration: Number(UINT64_BE.get(buf, off + 28)),
				layer: UINT16_BE.get(buf, off + 44),
				alternateGroup: UINT16_BE.get(buf, off + 46),
				volume: UINT16_BE.get(buf, off + 48),
				...available >= 96 ? {
					displayWidth: UINT32_BE.get(buf, off + 88) / 65536,
					displayHeight: UINT32_BE.get(buf, off + 92) / 65536
				} : {}
			};
			default: throw new FieldDecodingError("Invalid tkhd version header");
		}
	}
};
/**
* Atom: Sample Description Atom ('stsd')
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25691
*/
var stsdHeader = {
	len: 8,
	get: (buf, off) => {
		return {
			version: UINT8.get(buf, off),
			flags: UINT24_BE.get(buf, off + 1),
			numberOfEntries: UINT32_BE.get(buf, off + 4)
		};
	}
};
/**
* Atom: Sample Description Atom ('stsd')
* Ref: https://developer.apple.com/documentation/quicktime-file-format/sample_description_atom
*/
var SampleDescriptionTable = class {
	len;
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const descrLen = this.len - 12;
		return {
			dataFormat: FourCcToken.get(buf, off),
			dataReferenceIndex: UINT16_BE.get(buf, off + 10),
			description: descrLen > 0 ? new Uint8ArrayType(descrLen).get(buf, off + 12) : void 0
		};
	}
};
/**
* Atom: Sample-description Atom ('stsd')
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25691
*/
var StsdAtom = class {
	maxEntries;
	len;
	constructor(len, maxEntries = maxMp4StructureEntries) {
		this.maxEntries = maxEntries;
		this.len = len;
	}
	get(buf, off) {
		const end = Math.min(off + this.len, buf.length);
		if (end - off < stsdHeader.len) throw new Mp4ContentError("Truncated stsd header");
		const header = stsdHeader.get(buf, off);
		off += stsdHeader.len;
		const table = [];
		for (let n = 0; n < header.numberOfEntries; ++n) {
			if (end - off < UINT32_BE.len) throw new Mp4ContentError("Truncated stsd sample entry");
			const size = UINT32_BE.get(buf, off);
			if (size < 16 || size > end - off) throw new Mp4ContentError(`Invalid stsd sample entry size: ${size}`);
			if (n >= this.maxEntries) throw new Mp4ContentError(`stsd entry count ${header.numberOfEntries} exceeds entry limit ${this.maxEntries}`);
			off += UINT32_BE.len;
			table.push(new SampleDescriptionTable(size - UINT32_BE.len).get(buf, off));
			off += size - UINT32_BE.len;
		}
		return {
			header,
			table
		};
	}
};
/**
* Common Sound Sample Description (version & revision)
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-57317
*/
var SoundSampleDescriptionVersion = {
	len: 8,
	get(buf, off) {
		return {
			version: INT16_BE.get(buf, off),
			revision: INT16_BE.get(buf, off + 2),
			vendor: INT32_BE.get(buf, off + 4)
		};
	}
};
/**
* Sound Sample Description (Version 0)
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-130736
*/
var SoundSampleDescriptionV0 = {
	len: 12,
	get(buf, off) {
		return {
			numAudioChannels: INT16_BE.get(buf, off + 0),
			sampleSize: INT16_BE.get(buf, off + 2),
			compressionId: INT16_BE.get(buf, off + 4),
			packetSize: INT16_BE.get(buf, off + 6),
			sampleRate: UINT16_BE.get(buf, off + 8) + UINT16_BE.get(buf, off + 10) / 1e4
		};
	}
};
var SimpleTableAtom = class {
	maxEntries;
	len;
	token;
	constructor(len, token, maxEntries = maxMp4StructureEntries) {
		this.maxEntries = maxEntries;
		this.len = len;
		this.token = token;
	}
	get(buf, off) {
		const nrOfEntries = INT32_BE.get(buf, off + 4);
		return {
			version: INT8.get(buf, off + 0),
			flags: INT24_BE.get(buf, off + 1),
			numberOfEntries: nrOfEntries,
			entries: readTokenTable(buf, this.token, off + 8, this.len - 8, nrOfEntries, this.maxEntries)
		};
	}
};
var TimeToSampleToken = {
	len: 8,
	get(buf, off) {
		return {
			count: UINT32_BE.get(buf, off + 0),
			duration: UINT32_BE.get(buf, off + 4)
		};
	}
};
/**
* Time-to-sample('stts') atom.
* Store duration information for a media’s samples.
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25696
*/
var SttsAtom = class extends SimpleTableAtom {
	constructor(len, maxEntries) {
		super(len, TimeToSampleToken, maxEntries);
	}
};
var SampleToChunkToken = {
	len: 12,
	get(buf, off) {
		return {
			firstChunk: UINT32_BE.get(buf, off),
			samplesPerChunk: UINT32_BE.get(buf, off + 4),
			sampleDescriptionId: UINT32_BE.get(buf, off + 8)
		};
	}
};
/**
* Sample-to-Chunk ('stsc') atom interface
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25706
*/
var StscAtom = class extends SimpleTableAtom {
	constructor(len, maxEntries) {
		super(len, SampleToChunkToken, maxEntries);
	}
};
/**
* Sample-size ('stsz') atom
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25710
*/
var StszAtom = class {
	maxRetainedEntries;
	len;
	constructor(len, maxRetainedEntries = 0) {
		this.maxRetainedEntries = maxRetainedEntries;
		this.len = len;
	}
	get(buf, off) {
		if (this.len < 12) throw new Mp4ContentError("Invalid stsz payload length");
		const sampleSize = UINT32_BE.get(buf, off + 4);
		const numberOfEntries = UINT32_BE.get(buf, off + 8);
		const tableLength = this.len - 12;
		if (tableLength !== 0 && tableLength !== numberOfEntries * UINT32_BE.len) throw new Mp4ContentError("mismatch number-of-entries with remaining atom-length");
		const tableEntries = tableLength / UINT32_BE.len;
		const retainedCount = Math.min(tableEntries, this.maxRetainedEntries);
		const entries = [];
		let totalSize = sampleSize * numberOfEntries;
		for (let index = 0; index < tableEntries; ++index) {
			const size = UINT32_BE.get(buf, off + 12 + index * UINT32_BE.len);
			if (sampleSize === 0) totalSize += size;
			if (index < retainedCount) entries.push(size);
		}
		return {
			version: INT8.get(buf, off),
			flags: INT24_BE.get(buf, off + 1),
			sampleSize,
			numberOfEntries,
			totalSize: sampleSize > 0 || tableEntries > 0 ? totalSize : void 0,
			entries
		};
	}
};
/**
* Chunk offset atom, 'stco'
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25715
*/
var StcoAtom = class extends SimpleTableAtom {
	constructor(len, maxEntries) {
		super(len, UINT32_BE, maxEntries);
	}
};
/** 64-bit chunk offsets (co64), constrained to exact JavaScript positions. */
var Co64Atom = class extends SimpleTableAtom {
	constructor(len, maxEntries) {
		super(len, {
			len: 8,
			get(buf, off) {
				const offset = UINT64_BE.get(buf, off);
				if (offset > BigInt(Number.MAX_SAFE_INTEGER)) throw new Mp4ContentError("Chunk offset exceeds Number.MAX_SAFE_INTEGER");
				return Number(offset);
			}
		}, maxEntries);
	}
};
/**
* Token used to decode text-track from 'mdat' atom (raw data stream)
*/
var ChapterText = class {
	len;
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const available = Math.min(this.len, buf.length - off);
		if (available < 2) return "";
		const titleLen = Math.min(UINT16_BE.get(buf, off), available - 2);
		const bytes = buf.subarray(off + 2, off + 2 + titleLen);
		if (bytes[0] === 254 && bytes[1] === 255) {
			const littleEndian = new Uint8Array(bytes.length - 2);
			for (let i = 2; i + 1 < bytes.length; i += 2) {
				littleEndian[i - 2] = bytes[i + 1];
				littleEndian[i - 1] = bytes[i];
			}
			return textDecode(littleEndian, "utf-16le");
		}
		if (bytes[0] === 255 && bytes[1] === 254) return textDecode(bytes.subarray(2), "utf-16le");
		return textDecode(bytes);
	}
};
/** Nero chapter list (chpl): UTF-8 titles and start times in 100ns units. */
var ChapterListAtom = class {
	len;
	maxChapters;
	onLimit;
	constructor(len, maxChapters = defaultMaxChapterCount, onLimit) {
		this.len = len;
		this.maxChapters = maxChapters;
		this.onLimit = onLimit;
	}
	get(buf, off) {
		const end = off + Math.min(this.len, buf.length - off);
		if (end - off < 5) return [];
		const version = UINT8.get(buf, off);
		if (version > 1) throw new Mp4ContentError(`Unsupported chpl version: ${version}`);
		let position = off + (version === 1 ? 8 : 4);
		if (position >= end) return [];
		const count = UINT8.get(buf, position++);
		if (count > this.maxChapters) this.onLimit?.();
		const chapters = [];
		for (let i = 0; i < Math.min(count, this.maxChapters) && position + 9 <= end; ++i) {
			const start = UINT64_BE.get(buf, position);
			const titleLength = UINT8.get(buf, position + 8);
			position += 9;
			if (position + titleLength > end) break;
			if (start > BigInt(Number.MAX_SAFE_INTEGER)) throw new Mp4ContentError("Chapter start exceeds Number.MAX_SAFE_INTEGER");
			chapters.push({
				title: textDecode(buf.subarray(position, position + titleLength)),
				start: Number(start),
				timeScale: 1e7
			});
			position += titleLength;
		}
		return chapters;
	}
};
function readTokenTable(buf, token, off, remainingLen, numberOfEntries, maxEntries = maxMp4StructureEntries) {
	debug$13(`remainingLen=${remainingLen}, numberOfEntries=${numberOfEntries} * token-len=${token.len}`);
	if (remainingLen === 0) return [];
	if (remainingLen !== numberOfEntries * token.len) throw new Mp4ContentError("mismatch number-of-entries with remaining atom-length");
	if (numberOfEntries > maxEntries) throw new Mp4ContentError(`MP4 table entry count ${numberOfEntries} exceeds entry limit ${maxEntries}`);
	const entries = [];
	for (let n = 0; n < numberOfEntries; ++n) {
		entries.push(token.get(buf, off));
		off += token.len;
	}
	return entries;
}
/**
* Sample-size ('tfhd') TrackFragmentHeaderBox
*/
var TrackFragmentHeaderBox = class {
	len;
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const flagOffset = off + 1;
		const header = {
			version: INT8.get(buf, off),
			flags: {
				baseDataOffsetPresent: getBit(buf, flagOffset + 2, 0),
				sampleDescriptionIndexPresent: getBit(buf, flagOffset + 2, 1),
				defaultSampleDurationPresent: getBit(buf, flagOffset + 2, 3),
				defaultSampleSizePresent: getBit(buf, flagOffset + 2, 4),
				defaultSampleFlagsPresent: getBit(buf, flagOffset + 2, 5),
				defaultDurationIsEmpty: getBit(buf, flagOffset, 0),
				defaultBaseIsMoof: getBit(buf, flagOffset, 1)
			},
			trackId: UINT32_BE.get(buf, 4)
		};
		let dynOffset = 8;
		if (header.flags.baseDataOffsetPresent) {
			header.baseDataOffset = UINT64_BE.get(buf, dynOffset);
			dynOffset += 8;
		}
		if (header.flags.sampleDescriptionIndexPresent) {
			header.sampleDescriptionIndex = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		if (header.flags.defaultSampleDurationPresent) {
			header.defaultSampleDuration = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		if (header.flags.defaultSampleSizePresent) {
			header.defaultSampleSize = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		if (header.flags.defaultSampleFlagsPresent) header.defaultSampleFlags = UINT32_BE.get(buf, dynOffset);
		return header;
	}
};
/**
* Sample-size ('trun') TrackRunBox
*/
var TrackRunBox = class {
	maxSampleCount;
	len;
	constructor(len, maxSampleCount = maxMp4StructureEntries) {
		this.maxSampleCount = maxSampleCount;
		this.len = len;
	}
	get(buf, off) {
		const flagOffset = off + 1;
		const trun = {
			version: INT8.get(buf, off),
			flags: {
				dataOffsetPresent: getBit(buf, flagOffset + 2, 0),
				firstSampleFlagsPresent: getBit(buf, flagOffset + 2, 2),
				sampleDurationPresent: getBit(buf, flagOffset + 1, 0),
				sampleSizePresent: getBit(buf, flagOffset + 1, 1),
				sampleFlagsPresent: getBit(buf, flagOffset + 1, 2),
				sampleCompositionTimeOffsetsPresent: getBit(buf, flagOffset + 1, 3)
			},
			sampleCount: UINT32_BE.get(buf, off + 4),
			duration: 0,
			size: 0,
			timingComplete: true,
			explicitSampleCount: 0
		};
		let dynOffset = off + 8;
		if (trun.flags.dataOffsetPresent) {
			trun.dataOffset = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		if (trun.flags.firstSampleFlagsPresent) {
			trun.firstSampleFlags = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		const sampleFields = Number(trun.flags.sampleDurationPresent) + Number(trun.flags.sampleSizePresent) + Number(trun.flags.sampleFlagsPresent) + Number(trun.flags.sampleCompositionTimeOffsetsPresent);
		if (dynOffset + sampleFields * 4 * trun.sampleCount > off + this.len) throw new Mp4ContentError("Invalid trun sample count");
		if (sampleFields === 0) return trun;
		if (trun.sampleCount > this.maxSampleCount) throw new Mp4ContentError(`trun sample count ${trun.sampleCount} exceeds entry limit ${this.maxSampleCount}`);
		for (let n = 0; n < trun.sampleCount; ++n) {
			if (trun.flags.sampleDurationPresent) {
				const duration = UINT32_BE.get(buf, dynOffset);
				trun.duration += duration;
				trun.timingComplete &&= duration > 0;
				dynOffset += 4;
			}
			if (trun.flags.sampleSizePresent) {
				trun.size += UINT32_BE.get(buf, dynOffset);
				dynOffset += 4;
			}
			dynOffset += 4 * (Number(trun.flags.sampleFlagsPresent) + Number(trun.flags.sampleCompositionTimeOffsetsPresent));
		}
		trun.explicitSampleCount = trun.sampleCount;
		return trun;
	}
};
/**
* HandlerBox (`hdlr`)
*/
var HandlerBox = class {
	len;
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		off + 1;
		const charTypeToken = new StringType(4, "utf-8");
		return {
			version: INT8.get(buf, off),
			flags: UINT24_BE.get(buf, off + 1),
			componentType: charTypeToken.get(buf, off + 4),
			handlerType: charTypeToken.get(buf, off + 8),
			componentName: new StringType(this.len - 28, "utf-8").get(buf, off + 28)
		};
	}
};
/**
* Chapter Track Reference Box (`chap`)
*/
var ChapterTrackReferenceBox = class {
	maxEntries;
	len;
	constructor(len, maxEntries = maxMp4StructureEntries) {
		this.maxEntries = maxEntries;
		this.len = len;
	}
	get(buf, off) {
		if (this.len % UINT32_BE.len !== 0) throw new Mp4ContentError("Invalid chapter track-reference length");
		const count = this.len / UINT32_BE.len;
		if (count > this.maxEntries) throw new Mp4ContentError(`Chapter track-reference count ${count} exceeds entry limit ${this.maxEntries}`);
		let dynOffset = 0;
		const trackIds = [];
		while (dynOffset < this.len) {
			trackIds.push(UINT32_BE.get(buf, off + dynOffset));
			dynOffset += 4;
		}
		return trackIds;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/Atom.js
var debug$12 = (0, import_src.default)("music-metadata:parser:MP4:Atom");
var maxAtomDepth = 64;
var Atom = class Atom {
	payloadLength;
	reserveAtom;
	static async readAtom(tokenizer, dataHandler, parent, remaining, reserveAtom = () => void 0) {
		let depth = 0;
		for (let ancestor = parent; ancestor; ancestor = ancestor.parent) if (++depth >= maxAtomDepth) throw new Mp4ContentError(`MP4 atom nesting exceeds limit ${maxAtomDepth}`);
		const offset = tokenizer.position;
		remaining = Math.min(remaining, (tokenizer.fileInfo.size ?? Number.POSITIVE_INFINITY) - offset);
		if (remaining < Header$3.len) throw new Mp4ContentError("Truncated atom header");
		debug$12(`Reading next token on offset=${offset}...`);
		const header = await tokenizer.readToken(Header$3);
		const extended = header.length === 1n;
		if (extended) {
			if (remaining < 16) throw new Mp4ContentError("Truncated extended atom header");
			header.length = await tokenizer.readToken(ExtendedSize);
		}
		const headerLength = extended ? 16 : 8;
		if ((extended || header.length !== 0n) && header.length < BigInt(headerLength)) throw new Mp4ContentError(`Invalid atom size: ${header.length}`);
		if (header.length > BigInt(Number.MAX_SAFE_INTEGER)) throw new Mp4ContentError(`Atom size exceeds Number.MAX_SAFE_INTEGER: ${header.length}`);
		const length = header.length === 0n ? remaining : Number(header.length);
		if (length > remaining) throw new Mp4ContentError(`Atom size exceeds remaining bytes: ${header.length} > ${remaining}`);
		const payloadLength = length - headerLength;
		reserveAtom();
		const atomBean = new Atom(header, extended, parent, payloadLength, reserveAtom);
		debug$12(`parse atom name=${atomBean.atomPath}, extended=${atomBean.extended}, offset=${offset}, len=${atomBean.header.length}`);
		await atomBean.readData(tokenizer, dataHandler, payloadLength);
		return atomBean;
	}
	atomPath;
	header;
	extended;
	parent;
	constructor(header, extended, parent, payloadLength, reserveAtom = () => void 0) {
		this.payloadLength = payloadLength;
		this.reserveAtom = reserveAtom;
		this.header = header;
		this.extended = extended;
		this.parent = parent;
		this.atomPath = (this.parent ? `${this.parent.atomPath}.` : "") + this.header.name;
	}
	getHeaderLength() {
		return this.extended ? 16 : 8;
	}
	getPayloadLength() {
		return this.payloadLength;
	}
	async readAtoms(tokenizer, dataHandler, size) {
		while (size > 0) {
			if (size === Number.POSITIVE_INFINITY) {
				const bytesRead = await tokenizer.peekBuffer(new Uint8Array(Header$3.len), { mayBeLess: true });
				if (bytesRead === 0) return;
				if (bytesRead < Header$3.len) throw new Mp4ContentError("Truncated atom header");
			}
			const atomBean = await Atom.readAtom(tokenizer, dataHandler, this, size, this.reserveAtom);
			size = atomBean.header.length === 0n ? 0 : size - Number(atomBean.header.length);
		}
	}
	async readData(tokenizer, dataHandler, remaining) {
		switch (this.header.name) {
			case "moov":
			case "udta":
			case "mdia":
			case "minf":
			case "stbl":
			case "<id>":
			case "ilst":
			case "tref":
			case "mvex":
			case "moof": return this.readAtoms(tokenizer, dataHandler, remaining);
			case "meta": {
				if (remaining < 8) throw new Mp4ContentError("Truncated meta atom");
				const paddingLength = (await tokenizer.peekToken(Header$3)).name === "hdlr" ? 0 : 4;
				await tokenizer.ignore(paddingLength);
				return this.readAtoms(tokenizer, dataHandler, remaining - paddingLength);
			}
			default: return dataHandler(this, remaining);
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/MP4Parser.js
var MP4Parser_exports = /* @__PURE__ */ __exportAll({ MP4Parser: () => MP4Parser });
var debug$11 = (0, import_src.default)("music-metadata:parser:MP4");
var tagFormat = "iTunes";
var maxChapterTitleBytes = 65536;
var encoderDict = {
	raw: {
		lossy: false,
		format: "raw"
	},
	MAC3: {
		lossy: true,
		format: "MACE 3:1"
	},
	MAC6: {
		lossy: true,
		format: "MACE 6:1"
	},
	ima4: {
		lossy: true,
		format: "IMA 4:1"
	},
	ulaw: {
		lossy: true,
		format: "uLaw 2:1"
	},
	alaw: {
		lossy: true,
		format: "uLaw 2:1"
	},
	Qclp: {
		lossy: true,
		format: "QUALCOMM PureVoice"
	},
	".mp3": {
		lossy: true,
		format: "MPEG-1 layer 3"
	},
	alac: {
		lossy: false,
		format: "ALAC"
	},
	"ac-3": {
		lossy: true,
		format: "AC-3"
	},
	mp4a: {
		lossy: true,
		format: "MPEG-4/AAC"
	},
	mp4s: {
		lossy: true,
		format: "MP4S"
	},
	c608: {
		lossy: true,
		format: "CEA-608"
	},
	c708: {
		lossy: true,
		format: "CEA-708"
	}
};
/** Chapter offsets can be revisited even when the total input size is unknown. */
function supportsSeeking(tokenizer) {
	return tokenizer.supportsRandomAccess() && "setPosition" in tokenizer && typeof tokenizer.setPosition === "function";
}
/**
* Determine if a track carries audio.
*
* Ref: ISO/IEC 14496-12, 8.5.2: the sample entries in a sample description box are track-type specific,
* selected by the handler type of the enclosing track. Only an audio track holds an AudioSampleEntry.
* Both the 'soun' and 'audi' handler types are treated as audio.
*
* Falls back to the sample description when no handler box was found, preserving the previous behavior.
*/
function isAudioTrack(track) {
	const [ssd] = track.soundSampleDescription ?? [];
	if (!ssd) return false;
	if (track.handler) return track.handler.handlerType === "soun" || track.handler.handlerType === "audi";
	return !!ssd.description && ssd.description.numAudioChannels > 0;
}
/**
* Channel count from an AAC-LC AudioSpecificConfig (ISO/IEC 14496-3). The count in the
* sample entry is not reliable for AAC: some encoders leave it at the default of 2.
*/
function readAacLcChannels(objectType, config) {
	if (objectType !== 2 || config.length < 2) return;
	const frequencyIndex = (config[0] & 7) << 1 | config[1] >>> 7;
	let channelConfigByte = 1;
	if (frequencyIndex === 15) {
		if (config.length < 5) return;
		channelConfigByte = 4;
	}
	const channelConfig = config[channelConfigByte] >>> 3 & 15;
	if (channelConfig >= 1 && channelConfig <= 7) return channelConfig === 7 ? 8 : channelConfig;
	if (channelConfig === 0 && config.length > channelConfigByte + 1) {
		const pceByte = channelConfigByte + 1;
		if ((config[pceByte] & 128) !== 0) {
			if (config[pceByte] >>> 6 === 0) {
				const channels = config[pceByte] >> 1 & 7;
				if (channels > 0) return channels;
			}
		}
	}
}
var MP4Parser = class MP4Parser extends BasicParser {
	maxChapterCount = getMaxChapterCount(this.options);
	static read_BE_Integer(array, signed) {
		const integerType = (signed ? "INT" : "UINT") + array.length * 8 + (array.length > 1 ? "_BE" : "");
		const token = lib_exports$1[integerType];
		if (!token) throw new Mp4ContentError(`Token for integer type not found: "${integerType}"`);
		return Number(token.get(array, 0));
	}
	validatePayloadLength(length) {
		validateAllocation(length, this.options, (message) => new Mp4ContentError(message));
	}
	async readToken(token, position) {
		return readToken(this.tokenizer, token, this.options, position, (message) => new Mp4ContentError(message));
	}
	movieHeader;
	trackDefaults = /* @__PURE__ */ new Map();
	tracks = /* @__PURE__ */ new Map();
	mediaDataRanges = [];
	streamedChapters = /* @__PURE__ */ new Map();
	streamedChapterCount;
	neroChapters = [];
	hasVideoTrack = false;
	hasAudioTrack = false;
	remainingAtoms = 0;
	maxMetadataEntries = 0;
	metadataKeys = /* @__PURE__ */ new WeakMap();
	pendingTags = [];
	async parse() {
		this.hasVideoTrack = false;
		this.hasAudioTrack = false;
		this.maxMetadataEntries = getMaxMetadataEntries(this.options);
		this.remainingAtoms = maxMp4StructureEntries;
		this.tracks.clear();
		this.mediaDataRanges = [];
		this.streamedChapters.clear();
		this.streamedChapterCount = void 0;
		this.neroChapters = [];
		this.trackDefaults.clear();
		this.movieHeader = void 0;
		this.pendingTags = [];
		this.metadataKeys = /* @__PURE__ */ new WeakMap();
		let remainingFileSize = this.tokenizer.fileInfo.size ?? Number.POSITIVE_INFINITY;
		while (remainingFileSize > 0) {
			try {
				if ((await this.tokenizer.peekToken(Header$3)).name === "\0\0\0\0") {
					const errMsg = `Error at offset=${this.tokenizer.position}: box.id=0`;
					debug$11(errMsg);
					this.addWarning(errMsg);
					break;
				}
			} catch (error) {
				if (error instanceof Error) {
					const errMsg = `Error at offset=${this.tokenizer.position}: ${error.message}`;
					debug$11(errMsg);
					this.addWarning(errMsg);
				} else throw error;
				break;
			}
			const atomsBeforeRoot = this.remainingAtoms;
			const rootAtom = await Atom.readAtom(this.tokenizer, (atom, remaining) => this.handleAtom(atom, remaining), null, remainingFileSize, () => this.reserveAtom());
			this.remainingAtoms = atomsBeforeRoot;
			remainingFileSize = rootAtom.header.length === 0n ? 0 : remainingFileSize - Number(rootAtom.header.length);
			for (const tag of this.pendingTags) {
				let id = tag.id;
				if (tag.scope && id.length === 4 && id.charCodeAt(0) === 0) {
					const index = [...id].reduce((value, character) => value * 256 + character.charCodeAt(0), 0);
					const key = this.metadataKeys.get(tag.scope)?.[index - 1];
					if (key !== void 0) id = key;
					else this.addWarning(`Unresolved MP4 metadata key index ${index}`);
				}
				await this.metadata.addTag(tagFormat, id, tag.value);
			}
			this.pendingTags = [];
			this.metadataKeys = /* @__PURE__ */ new WeakMap();
		}
		if (this.mediaDataRanges.length > 0 && supportsSeeking(this.tokenizer)) {
			const tokenizer = this.tokenizer;
			const position = tokenizer.position;
			try {
				await this.parseChapters(this.mediaDataRanges);
			} finally {
				tokenizer.setPosition(position);
			}
		}
		if (this.streamedChapterCount !== void 0 && this.streamedChapters.size !== this.streamedChapterCount) {
			if (this.neroChapters.length === 0) throw new Mp4ContentError("Chapter chunk exceeding media data bounds");
			this.addWarning("Cannot read chapter track: Chapter chunk exceeding media data bounds");
		}
		if (this.options.includeChapters && this.neroChapters.length > 0 && !this.metadata.format.chapters?.some((chapter) => chapter.title)) this.metadata.setFormat("chapters", this.neroChapters);
		const formatList = [];
		this.tracks.forEach((track) => {
			const trackFormats = [];
			for (const ssd of track.soundSampleDescription) {
				const encoderInfo = ssd.encoder ?? encoderDict[ssd.dataFormat];
				if (encoderInfo) trackFormats.push(encoderInfo.format);
			}
			if (trackFormats.length >= 1) formatList.push(trackFormats.join("/"));
		});
		if (formatList.length > 0) this.metadata.setFormat("codec", [...new Set(formatList)].join("+"));
		const audioTracks = [...this.tracks.values()].filter(isAudioTrack);
		for (const track of this.tracks.values()) this.calculateTrackTiming(track);
		for (const audioTrack of audioTracks) {
			const ssd = audioTrack.soundSampleDescription[0];
			if (ssd.description && audioTrack.media.header) {
				this.metadata.setFormat("sampleRate", ssd.description.sampleRate);
				this.metadata.setFormat("bitsPerSample", ssd.description.sampleSize);
				this.metadata.setFormat("numberOfChannels", ssd.description.numAudioChannels);
				if (audioTrack.media.header.timeScale === 0 && audioTrack.timeToSampleTable.length > 0 && ssd.description.sampleRate > 0) audioTrack.duration = audioTrack.timeToSampleTable.map((ttstEntry) => ttstEntry.count * ttstEntry.duration).reduce((total, sampleSize) => total + sampleSize) / ssd.description.sampleRate;
			}
			const encoderInfo = ssd.encoder ?? encoderDict[ssd.dataFormat];
			if (encoderInfo) this.metadata.setFormat("lossless", !encoderInfo.lossy);
		}
		if (audioTracks.length >= 1) {
			const firstAudioTrack = audioTracks[0];
			if (firstAudioTrack.duration) {
				this.metadata.setFormat("duration", firstAudioTrack.duration);
				if (firstAudioTrack.sizeInBytes) this.metadata.setFormat("bitrate", 8 * firstAudioTrack.sizeInBytes / firstAudioTrack.duration);
			}
		}
		for (const track of this.tracks.values()) this.metadata.addStreamInfo(this.getTrackInfo(track));
		this.metadata.setFormat("hasAudio", this.hasAudioTrack || audioTracks.length > 0);
		this.metadata.setFormat("hasVideo", this.hasVideoTrack);
		const movieDuration = this.getDuration(this.movieHeader);
		if (movieDuration !== void 0) this.metadata.setFormat("containerDuration", movieDuration);
		else {
			const endTimes = [...this.tracks.values()].filter((track) => isAudioTrack(track) || track.handler?.handlerType === "vide").map((track) => track.endTime);
			if (endTimes.length > 0 && endTimes.every((endTime) => endTime !== void 0)) this.metadata.setFormat("containerDuration", endTimes.reduce((maximum, endTime) => Math.max(maximum, endTime), 0));
		}
	}
	async handleAtom(atom, remaining) {
		if (atom.header.name === "keys" && atom.parent?.header.name === "meta") return this.parseMetadataKeys(atom.parent, remaining);
		if (atom.parent) switch (atom.parent.header.name) {
			case "ilst":
			case "<id>": return this.parseMetadataItemData(atom);
			case "moov":
				switch (atom.header.name) {
					case "trak": return this.parseTrackBox(atom);
					case "udta": return this.parseTrackBox(atom);
				}
				break;
			case "moof": switch (atom.header.name) {
				case "traf": return this.parseTrackFragmentBox(atom);
			}
		}
		if ([
			"chap",
			"stsd",
			"stsz"
		].includes(atom.header.name)) {
			this.validatePayloadLength(remaining);
			if (atom.header.name === "stsd") await this.readToken(new StsdAtom(remaining, maxMp4StructureEntries));
			else if (atom.header.name === "stsz") await this.readToken(new StszAtom(remaining));
			else await this.tokenizer.ignore(remaining);
			this.addWarning(`Ignoring track-specific atom ${atom.atomPath} outside a track`);
			return;
		}
		if (this.atomParsers[atom.header.name]) {
			if (atom.header.name !== "mdat") this.validatePayloadLength(remaining);
			return this.atomParsers[atom.header.name](remaining);
		}
		debug$11(`No parser for atom path=${atom.atomPath}, payload-len=${remaining}, ignoring atom`);
		await this.tokenizer.ignore(remaining);
	}
	reserveAtom() {
		if (this.remainingAtoms === 0) throw new Mp4ContentError("MP4 atom count exceeds entry limit");
		--this.remainingAtoms;
	}
	assertRetainedEntryCapacity(count, collection, limit = maxMp4StructureEntries) {
		if (count >= limit) throw new Mp4ContentError(`${collection} count exceeds entry limit ${limit}`);
	}
	async addTag(id, value, scope) {
		this.assertRetainedEntryCapacity(this.pendingTags.length, "MP4 metadata value", this.maxMetadataEntries);
		this.pendingTags.push({
			id,
			value,
			scope
		});
	}
	async parseMetadataKeys(scope, length) {
		if (length < 8) throw new Mp4ContentError("Truncated metadata keys header");
		const data = await this.readToken(new Uint8ArrayType(length));
		if (UINT32_BE.get(data, 0) !== 0) throw new Mp4ContentError("Unsupported metadata keys version or flags");
		const count = UINT32_BE.get(data, 4);
		if (count > this.maxMetadataEntries || count > Math.floor((length - 8) / 8)) throw new Mp4ContentError("Metadata keys count exceeds entry limit or payload bounds");
		const keys = [];
		let offset = 8;
		for (let index = 0; index < count; ++index) {
			if (offset + 8 > length) throw new Mp4ContentError("Truncated metadata key entry");
			const size = UINT32_BE.get(data, offset);
			if (size < 8 || size > length - offset) throw new Mp4ContentError("Invalid metadata key entry size");
			const namespace = new StringType(4, "latin1").get(data, offset + 4);
			keys.push(`${namespace}:${textDecode(data.subarray(offset + 8, offset + size))}`);
			offset += size;
		}
		if (offset !== length) throw new Mp4ContentError("Unexpected bytes after metadata keys");
		if (this.metadataKeys.has(scope)) this.addWarning("Duplicate MP4 metadata keys table; keeping the first table");
		else this.metadataKeys.set(scope, keys);
	}
	addWarning(message) {
		debug$11(`Warning: ${message}`);
		this.metadata.addWarning(message);
	}
	/**
	* Parse data of Meta-item-list-atom (item of 'ilst' atom)
	* @param metaAtom
	* Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW8
	*/
	parseMetadataItemData(metaAtom) {
		let tagKey = metaAtom.header.name;
		let scope = metaAtom.parent;
		while (scope && scope.header.name !== "meta") scope = scope.parent;
		const indexed = scope !== null && tagKey.charCodeAt(0) === 0;
		return metaAtom.readAtoms(this.tokenizer, async (child) => {
			const payLoadLength = child.getPayloadLength();
			switch (child.header.name) {
				case "data": return this.parseValueAtom(tagKey, child, scope ?? void 0);
				case "name":
				case "mean":
				case "rate": {
					const name = await this.readToken(new NameAtom(payLoadLength));
					if (!indexed) tagKey += `:${name.name}`;
					break;
				}
				default: {
					const uint8Array = await this.readToken(new Uint8ArrayType(payLoadLength));
					this.addWarning(`Unsupported meta-item: ${tagKey}[${child.header.name}] => value=${uint8ArrayToHex(uint8Array)} ascii=${textDecode(uint8Array, "ascii")}`);
				}
			}
		}, metaAtom.getPayloadLength());
	}
	async parseValueAtom(tagKey, metaAtom, scope) {
		const length = metaAtom.getPayloadLength();
		if (length < DataAtomHeader.len) throw new Mp4ContentError("Truncated data atom header");
		const header = await this.readToken(DataAtomHeader);
		if (header.type.set !== 0) throw new Mp4ContentError(`Unsupported type-set != 0: ${header.type.set}`);
		const bodyLength = length - DataAtomHeader.len;
		if (this.options.skipCovers && (header.type.type === 13 || header.type.type === 14)) {
			const body = createTokenizerView(this.tokenizer, bodyLength);
			try {
				await body.consumeRemainder();
			} finally {
				await body.close();
			}
			return;
		}
		this.validatePayloadLength(length);
		const dataAtom = {
			...header,
			value: await this.readToken(new Uint8ArrayType(bodyLength))
		};
		switch (dataAtom.type.type) {
			case 0:
				switch (tagKey) {
					case "trkn":
					case "disk": {
						const num = UINT8.get(dataAtom.value, 3);
						const of = UINT8.get(dataAtom.value, 5);
						await this.addTag(tagKey, `${num}/${of}`, scope);
						break;
					}
					case "gnre": {
						const genreStr = Genres[UINT8.get(dataAtom.value, 1) - 1];
						await this.addTag(tagKey, genreStr, scope);
						break;
					}
					case "rate": {
						const rate = textDecode(dataAtom.value, "ascii");
						await this.addTag(tagKey, rate, scope);
						break;
					}
					default: debug$11(`unknown proprietary value type for: ${metaAtom.atomPath}`);
				}
				break;
			case 1:
			case 18:
				await this.addTag(tagKey, textDecode(dataAtom.value), scope);
				break;
			case 13:
				await this.addTag(tagKey, {
					format: "image/jpeg",
					data: Uint8Array.from(dataAtom.value)
				}, scope);
				break;
			case 14:
				await this.addTag(tagKey, {
					format: "image/png",
					data: Uint8Array.from(dataAtom.value)
				}, scope);
				break;
			case 21:
				await this.addTag(tagKey, MP4Parser.read_BE_Integer(dataAtom.value, true), scope);
				break;
			case 22:
				await this.addTag(tagKey, MP4Parser.read_BE_Integer(dataAtom.value, false), scope);
				break;
			case 65:
				await this.addTag(tagKey, INT8.get(dataAtom.value, 0), scope);
				break;
			case 66:
				await this.addTag(tagKey, INT16_BE.get(dataAtom.value, 0), scope);
				break;
			case 67:
				await this.addTag(tagKey, INT32_BE.get(dataAtom.value, 0), scope);
				break;
			default: this.addWarning(`atom key=${tagKey}, has unknown well-known-type (data-type): ${dataAtom.type.type}`);
		}
	}
	getDuration(header) {
		if (header && header.timeScale > 0 && header.duration > 0 && header.duration !== 4294967295 && header.duration !== Number(18446744073709551615n)) return header.duration / header.timeScale;
	}
	calculateTrackTiming(track) {
		const timeScale = track.media.header?.timeScale;
		track.duration = this.getDuration(track.media.header);
		track.endTime = track.duration;
		let sampleCount = track.timeToSampleTable.reduce((sum, entry) => sum + entry.count, 0);
		let timeUnits = track.timeToSampleTable.reduce((sum, entry) => sum + entry.count * entry.duration, 0);
		const fragments = track.fragmentStatistics;
		if (fragments) {
			const size = (track.sizeInBytes ?? 0) + fragments.size;
			const sizesComplete = (track.sampleCount === 0 || track.sizeInBytes !== void 0) && fragments.sizesComplete;
			sampleCount += fragments.sampleCount;
			if (sizesComplete && Number.isSafeInteger(size)) track.sizeInBytes = size;
			else track.sizeInBytes = void 0;
			if (fragments.timingComplete && timeScale && fragments.start !== void 0 && Number.isSafeInteger(fragments.end)) {
				timeUnits += fragments.end - fragments.start;
				track.duration = Math.max(track.duration ?? 0, timeUnits / timeScale);
				track.endTime = Math.max(fragments.end / timeScale, track.duration);
			} else timeUnits = 0;
		} else if (track.duration === void 0 && timeScale && timeUnits > 0) {
			track.duration = timeUnits / timeScale;
			track.endTime = track.duration;
		}
		if (timeScale && timeUnits > 0 && sampleCount > 0 && Number.isSafeInteger(sampleCount)) track.frameRate = sampleCount * timeScale / timeUnits;
		if (track.duration === void 0 && this.movieHeader && track.header.duration > 0 && track.header.duration !== 4294967295 && track.header.duration !== Number(18446744073709551615n) && this.movieHeader.timeScale > 0) {
			track.duration = track.header.duration / this.movieHeader.timeScale;
			track.endTime = track.duration;
		}
	}
	aggregateFragment(track, header, run, decodeTime) {
		if (run.sampleCount === 0) return;
		const defaults = this.trackDefaults.get(track.header.trackId);
		const fragments = track.fragmentStatistics ??= {
			cursor: track.timeToSampleTable.reduce((sum, entry) => sum + entry.count * entry.duration, 0),
			end: 0,
			sampleCount: 0,
			size: 0,
			timingComplete: true,
			sizesComplete: true
		};
		fragments.cursor = decodeTime ?? fragments.cursor;
		fragments.start = fragments.start === void 0 ? fragments.cursor : Math.min(fragments.start, fragments.cursor);
		const defaultDuration = header.defaultSampleDuration ?? defaults?.duration;
		const defaultSize = header.defaultSampleSize ?? defaults?.size;
		if (run.flags.sampleDurationPresent) {
			fragments.cursor += run.duration;
			fragments.timingComplete &&= run.timingComplete;
		} else if (defaultDuration !== void 0 && defaultDuration > 0) fragments.cursor += defaultDuration * run.sampleCount;
		else fragments.timingComplete = false;
		if (run.flags.sampleSizePresent) fragments.size += run.size;
		else if (defaultSize !== void 0) fragments.size += defaultSize * run.sampleCount;
		else fragments.sizesComplete = false;
		fragments.sampleCount += run.sampleCount;
		fragments.end = Math.max(fragments.end, fragments.cursor);
	}
	getTrackInfo(track) {
		const info = {
			id: track.header.trackId,
			flagEnabled: (track.header.flags & 1) !== 0
		};
		switch (track.handler?.handlerType) {
			case "soun":
			case "audi":
				info.type = TrackType.audio;
				break;
			case "vide":
				info.type = TrackType.video;
				break;
			case "text":
			case "sbtl":
			case "subt":
			case "clcp":
				info.type = TrackType.subtitle;
				break;
			case "meta":
			case "mdta":
				info.type = TrackType.metadata;
				break;
			default: if (isAudioTrack(track)) info.type = TrackType.audio;
		}
		const mediaHeader = track.media.header;
		if (mediaHeader) {
			const letters = [
				10,
				5,
				0
			].map((shift) => mediaHeader.language >> shift & 31);
			if (letters.every((letter) => letter >= 1 && letter <= 26)) info.language = String.fromCharCode(...letters.map((letter) => letter + 96));
		}
		if (track.duration !== void 0) info.duration = track.duration;
		const size = track.sizeInBytes;
		if (size !== void 0 && info.duration && info.duration > 0) info.bitrate = 8 * size / info.duration;
		const ssd = track.soundSampleDescription[0];
		if (ssd) {
			info.codecId = ssd.dataFormat;
			const encoder = ssd.encoder ?? encoderDict[ssd.dataFormat];
			info.codecName = encoder?.format ?? `<${ssd.dataFormat}>`;
			if (info.type === TrackType.audio) {
				if (encoder) info.lossless = !encoder.lossy;
				if (ssd.description) {
					info.audio = {};
					if (ssd.description.sampleRate > 0) info.audio.samplingFrequency = ssd.description.sampleRate;
					if (ssd.description.numAudioChannels > 0) info.audio.channels = ssd.description.numAudioChannels;
					if (ssd.description.sampleSize && ssd.description.sampleSize > 0) info.audio.bitDepth = ssd.description.sampleSize;
				}
			}
		}
		const description = track.sampleDescriptions?.[0]?.description;
		if (info.type === TrackType.video) {
			info.video = {};
			if (track.frameRate !== void 0) info.video.frameRate = track.frameRate;
			if (track.header.displayWidth && track.header.displayHeight) {
				info.video.displayWidth = track.header.displayWidth;
				info.video.displayHeight = track.header.displayHeight;
			}
		}
		if (info.video && description && description.length >= 20) {
			const pixelWidth = UINT16_BE.get(description, 16);
			const pixelHeight = UINT16_BE.get(description, 18);
			if (pixelWidth > 0 && pixelHeight > 0) {
				info.video.pixelWidth = pixelWidth;
				info.video.pixelHeight = pixelHeight;
			}
		}
		return info;
	}
	async parseTrackBox(trakBox) {
		const track = {
			media: {},
			soundSampleDescription: [],
			chunkOffsetTable: [],
			sampleSize: 0,
			sampleCount: 0,
			sampleSizeTable: [],
			sampleToChunkTable: [],
			timeToSampleTable: []
		};
		await trakBox.readAtoms(this.tokenizer, async (child) => {
			const payLoadLength = child.getPayloadLength();
			switch (child.header.name) {
				case "chap": {
					const chap = await this.readToken(new ChapterTrackReferenceBox(payLoadLength, maxMp4StructureEntries));
					track.chapterList = chap;
					break;
				}
				case "tkhd":
					track.header = await this.readToken(new TrackHeaderAtom(payLoadLength));
					break;
				case "hdlr":
					if (child.parent?.header.name !== "mdia" || child.parent.parent !== trakBox) {
						await this.tokenizer.ignore(payLoadLength);
						break;
					}
					track.handler = await this.readToken(new HandlerBox(payLoadLength));
					if (track.handler.handlerType === "audi" || track.handler.handlerType === "soun") this.hasAudioTrack = true;
					else if (track.handler.handlerType === "vide") this.hasVideoTrack = true;
					break;
				case "mdhd": {
					const mdhd_data = await this.readToken(new MdhdAtom(payLoadLength));
					track.media.header = mdhd_data;
					break;
				}
				case "stco":
				case "co64": {
					const token = child.header.name === "co64" ? new Co64Atom(payLoadLength, maxMp4StructureEntries) : new StcoAtom(payLoadLength, maxMp4StructureEntries);
					const stco = await this.readToken(token);
					track.chunkOffsetTable = stco.entries;
					break;
				}
				case "stsc": {
					const stsc = await this.readToken(new StscAtom(payLoadLength, maxMp4StructureEntries));
					track.sampleToChunkTable = stsc.entries;
					break;
				}
				case "stsd": {
					const stsd = await this.readToken(new StsdAtom(payLoadLength, maxMp4StructureEntries));
					track.sampleDescriptions = stsd.table;
					track.soundSampleDescription = stsd.table.map((dfEntry) => this.parseSoundSampleDescription(dfEntry));
					break;
				}
				case "stts": {
					const stts = await this.readToken(new SttsAtom(payLoadLength, maxMp4StructureEntries));
					track.timeToSampleTable = stts.entries;
					break;
				}
				case "stsz": {
					const stsz = await this.readToken(new StszAtom(payLoadLength, this.options.includeChapters ? this.maxChapterCount : 0));
					track.sampleSize = stsz.sampleSize;
					track.sampleCount = stsz.numberOfEntries;
					track.sampleSizeTable = stsz.entries;
					track.sizeInBytes = stsz.totalSize;
					break;
				}
				case "dinf":
				case "vmhd":
				case "smhd":
					debug$11(`Ignoring: ${child.header.name}`);
					await this.tokenizer.ignore(payLoadLength);
					break;
				default:
					if (child.parent?.header.name === "ilst" || child.parent?.header.name === "<id>" || child.header.name === "keys" && child.parent?.header.name === "meta") {
						await this.handleAtom(child, payLoadLength);
						break;
					}
					debug$11(`Unexpected track box: ${child.header.name}`);
					await this.tokenizer.ignore(payLoadLength);
			}
		}, trakBox.getPayloadLength());
		if (track.header) {
			if (!this.tracks.has(track.header.trackId)) this.assertRetainedEntryCapacity(this.tracks.size, "MP4 track");
			this.tracks.set(track.header.trackId, {
				...track,
				header: track.header
			});
		}
	}
	async parseTrackFragmentBox(trafBox) {
		let tfhd;
		let decodeTime;
		const runs = [];
		let remainingSamples = maxMp4StructureEntries;
		await trafBox.readAtoms(this.tokenizer, async (child) => {
			const length = child.getPayloadLength();
			switch (child.header.name) {
				case "tfhd":
					tfhd = await this.readToken(new TrackFragmentHeaderBox(length));
					break;
				case "tfdt": {
					const data = await this.readToken(new Uint8ArrayType(length));
					if (length < 4 || data[0] === 0 && length < 8 || data[0] === 1 && length < 12) throw new Mp4ContentError("Truncated tfdt box");
					if (data[0] === 0) decodeTime = UINT32_BE.get(data, 4);
					else if (data[0] === 1) decodeTime = Number(UINT64_BE.get(data, 4));
					else throw new Mp4ContentError("Invalid tfdt version");
					if (!Number.isSafeInteger(decodeTime)) throw new Mp4ContentError("Unsafe tfdt decode time");
					break;
				}
				case "trun": {
					const run = await this.readToken(new TrackRunBox(length, remainingSamples));
					remainingSamples -= run.explicitSampleCount;
					runs.push(run);
					break;
				}
				default: await this.tokenizer.ignore(length);
			}
		}, trafBox.getPayloadLength());
		if (tfhd) {
			const track = this.tracks.get(tfhd.trackId);
			for (const run of runs) {
				if (track) this.aggregateFragment(track, tfhd, run, decodeTime);
				decodeTime = void 0;
			}
		}
	}
	atomParsers = {
		/**
		* Parse movie header (mvhd) atom
		* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-56313
		*/
		mvhd: async (len) => {
			const mvhd = await this.readToken(new MvhdAtom(len));
			this.movieHeader = mvhd;
			this.metadata.setFormat("creationTime", mvhd.creationTime);
			this.metadata.setFormat("modificationTime", mvhd.modificationTime);
		},
		chpl: async (len) => {
			if (this.options.includeChapters) this.neroChapters = await this.readToken(new ChapterListAtom(len, this.maxChapterCount, () => {
				this.addWarning(`Chapter count exceeds the ${this.maxChapterCount} chapter limit`);
			}));
			else await this.tokenizer.ignore(len);
		},
		trex: async (len) => {
			const data = await this.readToken(new Uint8ArrayType(len));
			if (len < 24) throw new Mp4ContentError("Truncated trex box");
			const trackId = UINT32_BE.get(data, 4);
			if (!this.trackDefaults.has(trackId)) this.assertRetainedEntryCapacity(this.trackDefaults.size, "MP4 track-default");
			this.trackDefaults.set(trackId, {
				duration: UINT32_BE.get(data, 12),
				size: UINT32_BE.get(data, 16)
			});
		},
		/**
		* Parse mdat atom.
		* Will scan for chapters
		*/
		mdat: async (len) => {
			const range = {
				offset: this.tokenizer.position,
				end: this.tokenizer.position + len
			};
			if (this.options.includeChapters) {
				if (supportsSeeking(this.tokenizer)) {
					this.assertRetainedEntryCapacity(this.mediaDataRanges.length, "MP4 media-data range");
					this.mediaDataRanges.push(range);
				} else await this.parseChapters([range], true);
			}
			await this.tokenizer.ignore(range.end - this.tokenizer.position);
		},
		ftyp: async (len) => {
			if (len < 8 || len % ftyp.len !== 0) throw new Mp4ContentError(`Invalid ftyp payload length: ${len}`);
			const typeCount = len / ftyp.len;
			if (typeCount > 5e6) throw new Mp4ContentError(`ftyp entry count ${typeCount} exceeds entry limit ${maxMp4StructureEntries}`);
			const types = [];
			while (len > 0) {
				const ftype = await this.readToken(ftyp);
				len -= ftyp.len;
				const value = ftype.type.replace(/\W/g, "");
				if (value.length > 0) types.push(value);
			}
			debug$11(`ftyp: ${types.join("/")}`);
			const x = [...new Set(types)].join("/");
			this.metadata.setFormat("container", x);
		},
		date: async (len) => {
			const date = await this.readToken(new StringType(len, "utf-8"));
			await this.addTag("date", date);
		}
	};
	/**
	* @param sampleDescription
	* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-128916
	*/
	parseSoundSampleDescription(sampleDescription) {
		const ssd = {
			dataFormat: sampleDescription.dataFormat,
			dataReferenceIndex: sampleDescription.dataReferenceIndex
		};
		let offset = 0;
		const { description } = sampleDescription;
		if (description && description.length >= SoundSampleDescriptionVersion.len) {
			const version = SoundSampleDescriptionVersion.get(description, offset);
			offset += SoundSampleDescriptionVersion.len;
			if (version.version === 0 || version.version === 1) {
				if (description.length >= offset + SoundSampleDescriptionV0.len) {
					ssd.description = SoundSampleDescriptionV0.get(description, offset);
					if (ssd.dataFormat === "mp4a") {
						const childOffset = offset + SoundSampleDescriptionV0.len + (version.version === 1 ? 16 : 0);
						if (childOffset > description.length) throw new Mp4ContentError("Truncated mp4a sound sample description");
						const audioConfig = this.readAudioConfig(description, childOffset);
						if (audioConfig?.objectType === 36) ssd.encoder = {
							format: "MPEG-4/ALS",
							lossy: false
						};
						if (audioConfig?.channels) ssd.description.numAudioChannels = audioConfig.channels;
					}
				} else debug$11(`Warning: sound-sample-description too short: ${description.length} bytes`);
			} else debug$11(`Warning: sound-sample-description ${version} not implemented`);
		}
		return ssd;
	}
	/** Read codec configuration only inside the bounded AudioSampleEntry child boxes. */
	readAudioConfig(data, offset) {
		while (offset < data.length) {
			this.reserveAtom();
			if (data.length - offset < 8) throw new Mp4ContentError("Truncated mp4a child box header");
			let size = UINT32_BE.get(data, offset);
			const name = Header$3.get(data, offset).name;
			let headerSize = 8;
			if (size === 1) {
				if (data.length - offset < 16) throw new Mp4ContentError("Truncated mp4a extended child box header");
				const extendedSize = UINT64_BE.get(data, offset + 8);
				if (extendedSize > BigInt(data.length - offset)) throw new Mp4ContentError("mp4a child box exceeds sample entry");
				size = Number(extendedSize);
				headerSize = 16;
			} else if (size === 0) size = data.length - offset;
			if (size < headerSize || size > data.length - offset) throw new Mp4ContentError("Invalid mp4a child box size");
			if (name === "esds") return this.readEsdsAudioConfig(data.subarray(offset + headerSize, offset + size));
			offset += size;
		}
	}
	/** ISO/IEC 14496-1 descriptor sizes have at most four base-128 bytes. */
	*readDescriptors(data, offset) {
		while (offset < data.length) {
			this.reserveAtom();
			const tag = data[offset++];
			let size = 0;
			for (let i = 0;; i++) {
				if (offset >= data.length || i === 4) throw new Mp4ContentError("Truncated or invalid MPEG-4 descriptor length");
				const byte = data[offset++];
				size = size << 7 | byte & 127;
				if (!(byte & 128)) break;
			}
			if (size > data.length - offset) throw new Mp4ContentError("MPEG-4 descriptor exceeds its parent");
			yield {
				tag,
				body: data.subarray(offset, offset + size)
			};
			offset += size;
		}
	}
	readEsdsAudioConfig(data) {
		if (data.length < 4) throw new Mp4ContentError("Truncated esds full-box header");
		for (const es of this.readDescriptors(data, 4)) {
			if (es.tag !== 3) continue;
			if (es.body.length < 3) throw new Mp4ContentError("Truncated ES descriptor");
			const flags = es.body[2];
			let offset = 3 + (flags & 128 ? 2 : 0);
			if (flags & 64) {
				if (offset >= es.body.length) throw new Mp4ContentError("Truncated ES URL length");
				offset += 1 + es.body[offset];
			}
			offset += flags & 32 ? 2 : 0;
			if (offset > es.body.length) throw new Mp4ContentError("Truncated optional ES descriptor fields");
			for (const decoder of this.readDescriptors(es.body, offset)) {
				if (decoder.tag !== 4) continue;
				if (decoder.body.length < 13) throw new Mp4ContentError("Truncated decoder configuration");
				if (decoder.body[0] !== 64 || decoder.body[1] >>> 2 !== 5) continue;
				for (const specific of this.readDescriptors(decoder.body, 13)) {
					if (specific.tag !== 5) continue;
					if (specific.body.length === 0 || specific.body[0] >>> 3 === 31 && specific.body.length < 2) throw new Mp4ContentError("Truncated AudioSpecificConfig object type");
					const type = specific.body[0] >>> 3;
					if (type === 31) return { objectType: 32 + ((specific.body[0] & 7) << 3) + (specific.body[1] >>> 5) };
					return {
						objectType: type,
						channels: readAacLcChannels(type, specific.body)
					};
				}
			}
		}
	}
	async parseChapters(mediaDataRanges, forwardOnly = false) {
		for (const track of this.tracks.values()) for (const id of track.chapterList ?? []) {
			const chapterTrack = this.tracks.get(id);
			if (!chapterTrack || chapterTrack === track || chapterTrack.handler && !["text", "sbtl"].includes(chapterTrack.handler.handlerType)) continue;
			try {
				await this.parseChapterTrack(chapterTrack, track, mediaDataRanges, forwardOnly);
			} catch (error) {
				if (this.neroChapters.length === 0 || !(error instanceof Mp4ContentError)) throw error;
				this.streamedChapterCount = void 0;
				this.streamedChapters.clear();
				this.addWarning(`Cannot read chapter track: ${error.message}`);
			}
			return;
		}
	}
	async parseChapterTrack(chapterTrack, track, mediaDataRanges, forwardOnly) {
		const timeScale = chapterTrack.media.header?.timeScale;
		if (timeScale === void 0 || timeScale <= 0) throw new Mp4ContentError("Invalid chapter track timescale");
		const sampleCount = Math.min(chapterTrack.sampleCount, this.maxChapterCount);
		if (chapterTrack.sampleCount > this.maxChapterCount) this.addWarning(`Chapter count exceeds the ${this.maxChapterCount} chapter limit`);
		if (forwardOnly) this.streamedChapterCount = sampleCount;
		const chapters = [];
		let sampleIndex = 0;
		let timeRun = 0;
		let samplesInTimeRun = chapterTrack.timeToSampleTable[0]?.count ?? 0;
		let start = 0;
		const chunkRuns = chapterTrack.sampleToChunkTable;
		for (let run = 0; run < chunkRuns.length && sampleIndex < sampleCount; ++run) {
			const { firstChunk, samplesPerChunk } = chunkRuns[run];
			const nextFirstChunk = chunkRuns[run + 1]?.firstChunk ?? chapterTrack.chunkOffsetTable.length + 1;
			if (run === 0 && firstChunk !== 1 || firstChunk < 1 || samplesPerChunk === 0 || nextFirstChunk <= firstChunk || nextFirstChunk > chapterTrack.chunkOffsetTable.length + 1) throw new Mp4ContentError("Invalid chapter sample-to-chunk table");
			for (let chunk = firstChunk - 1; chunk < nextFirstChunk - 1 && sampleIndex < sampleCount; ++chunk) {
				let offset = chapterTrack.chunkOffsetTable[chunk];
				for (let sample = 0; sample < samplesPerChunk && sampleIndex < sampleCount; ++sample) {
					while (samplesInTimeRun === 0 && timeRun < chapterTrack.timeToSampleTable.length) samplesInTimeRun = chapterTrack.timeToSampleTable[++timeRun]?.count ?? 0;
					const timing = chapterTrack.timeToSampleTable[timeRun];
					if (!timing) throw new Mp4ContentError("Missing chapter sample timing");
					const size = chapterTrack.sampleSize || chapterTrack.sampleSizeTable[sampleIndex];
					if (!(forwardOnly && (this.streamedChapters.has(sampleIndex) || offset >= mediaDataRanges[0].end))) {
						if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || size < 0 || !mediaDataRanges.some((range) => offset >= range.offset && size <= range.end - offset)) throw new Mp4ContentError("Chapter chunk exceeding media data bounds");
						if (forwardOnly && offset < this.tokenizer.position) throw new Mp4ContentError("Chapter chunk exceeding media data bounds");
						const chapter = {
							title: size < 2 || size > maxChapterTitleBytes ? "" : await this.readToken(new ChapterText(size), offset),
							timeScale,
							start
						};
						if (track.chunkOffsetTable.length > 0 && track.sampleToChunkTable.length > 0 && track.timeToSampleTable.length > 0) {
							track.chapterSampleLookup ??= this.createSampleOffsetLookup(track);
							chapter.sampleOffset = track.chapterSampleLookup(offset + size);
						}
						if (forwardOnly) this.streamedChapters.set(sampleIndex, chapter);
						else chapters.push(chapter);
					}
					offset += size;
					start += timing.duration;
					--samplesInTimeRun;
					++sampleIndex;
				}
			}
		}
		if (sampleIndex < sampleCount) throw new Mp4ContentError("Missing chapter sample-to-chunk entries");
		if (!forwardOnly) this.metadata.setFormat("chapters", chapters);
		else if (this.streamedChapters.size === sampleCount) this.metadata.setFormat("chapters", [...this.streamedChapters].sort(([left], [right]) => left - right).map(([, chapter]) => chapter));
	}
	/** Advance across monotone queries; restart for backward queries without sorting file tables. */
	createSampleOffsetLookup(track) {
		let previousChunk = 0;
		for (const entry of track.sampleToChunkTable) {
			if (previousChunk === 0 && entry.firstChunk !== 1 || entry.firstChunk <= previousChunk || entry.samplesPerChunk === 0) throw new Mp4ContentError("Invalid audio sample-to-chunk table");
			previousChunk = entry.firstChunk;
		}
		let chunkIndex = 0;
		let chunkId = 1;
		let chunkRun = 0;
		let timingIndex = 0;
		let remainingSamples = 0;
		let sampleDuration = 0;
		let totalDuration = 0;
		let previousOffset = Number.NEGATIVE_INFINITY;
		return (chapterOffset) => {
			if (chapterOffset < previousOffset) {
				chunkIndex = chunkRun = timingIndex = remainingSamples = sampleDuration = totalDuration = 0;
				chunkId = 1;
			}
			previousOffset = chapterOffset;
			while (chunkIndex < track.chunkOffsetTable.length && track.chunkOffsetTable[chunkIndex] < chapterOffset) ++chunkIndex;
			const targetChunk = chunkIndex + 1;
			for (; chunkId < targetChunk; ++chunkId) {
				while (track.sampleToChunkTable[chunkRun + 1]?.firstChunk <= chunkId) ++chunkRun;
				let samplesPerChunk = track.sampleToChunkTable[chunkRun].samplesPerChunk;
				while (samplesPerChunk > 0) {
					while (remainingSamples === 0) {
						const timing = track.timeToSampleTable[timingIndex++];
						if (!timing) throw new Mp4ContentError("Missing audio sample timing for chapter offset");
						remainingSamples = timing.count;
						sampleDuration = timing.duration;
					}
					const samples = Math.min(remainingSamples, samplesPerChunk);
					totalDuration += samples * sampleDuration;
					if (!Number.isSafeInteger(totalDuration)) throw new Mp4ContentError("Unsafe audio sample timing for chapter offset");
					remainingSamples -= samples;
					samplesPerChunk -= samples;
				}
			}
			return totalDuration;
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mpeg/MpegFrameHeader.js
var MpegContentError = class extends makeUnexpectedFileContentError("MPEG") {};
/**
* MPEG Audio Layer I/II/III frame header.
* Bit layout: AAAAAAAA AAABBCCD EEEEFFGH IIJJKLMM
* Ref: https://www.mp3-tech.org/programmer/frame_header.html
*/
var MpegFrameHeader = class MpegFrameHeader {
	static len = 4;
	static versions = [
		2.5,
		null,
		2,
		1
	];
	static layers = [
		0,
		3,
		2,
		1
	];
	static sideInfoLengths = [[17, 32], [9, 17]];
	static bitrates = {
		1: {
			11: 32,
			12: 32,
			13: 32,
			21: 32,
			22: 8,
			23: 8
		},
		2: {
			11: 64,
			12: 48,
			13: 40,
			21: 48,
			22: 16,
			23: 16
		},
		3: {
			11: 96,
			12: 56,
			13: 48,
			21: 56,
			22: 24,
			23: 24
		},
		4: {
			11: 128,
			12: 64,
			13: 56,
			21: 64,
			22: 32,
			23: 32
		},
		5: {
			11: 160,
			12: 80,
			13: 64,
			21: 80,
			22: 40,
			23: 40
		},
		6: {
			11: 192,
			12: 96,
			13: 80,
			21: 96,
			22: 48,
			23: 48
		},
		7: {
			11: 224,
			12: 112,
			13: 96,
			21: 112,
			22: 56,
			23: 56
		},
		8: {
			11: 256,
			12: 128,
			13: 112,
			21: 128,
			22: 64,
			23: 64
		},
		9: {
			11: 288,
			12: 160,
			13: 128,
			21: 144,
			22: 80,
			23: 80
		},
		10: {
			11: 320,
			12: 192,
			13: 160,
			21: 160,
			22: 96,
			23: 96
		},
		11: {
			11: 352,
			12: 224,
			13: 192,
			21: 176,
			22: 112,
			23: 112
		},
		12: {
			11: 384,
			12: 256,
			13: 224,
			21: 192,
			22: 128,
			23: 128
		},
		13: {
			11: 416,
			12: 320,
			13: 256,
			21: 224,
			22: 144,
			23: 144
		},
		14: {
			11: 448,
			12: 384,
			13: 320,
			21: 256,
			22: 160,
			23: 160
		}
	};
	static samplingRates = {
		1: {
			0: 44100,
			1: 48e3,
			2: 32e3
		},
		2: {
			0: 22050,
			1: 24e3,
			2: 16e3
		},
		2.5: {
			0: 11025,
			1: 12e3,
			2: 8e3
		}
	};
	static samplesInFrameTable = [[
		0,
		384,
		1152,
		1152
	], [
		0,
		384,
		1152,
		576
	]];
	container = "MPEG";
	codec;
	layer;
	isProtectedByCRC;
	bitrate;
	samplingRate;
	numberOfChannels;
	samplesPerFrame;
	frameSize;
	sideInfoLength;
	constructor(buf) {
		const version = MpegFrameHeader.versions[getBitAllignedNumber$1(buf, 1, 3, 2)];
		if (version === null) throw new MpegContentError("Cannot determine bit-rate");
		this.layer = MpegFrameHeader.layers[getBitAllignedNumber$1(buf, 1, 5, 2)];
		this.isProtectedByCRC = !isBitSet$2(buf, 1, 7);
		const bitrateIndex = getBitAllignedNumber$1(buf, 2, 0, 4);
		const samplingRateIndex = getBitAllignedNumber$1(buf, 2, 4, 2);
		const padding = isBitSet$2(buf, 2, 6);
		this.numberOfChannels = getBitAllignedNumber$1(buf, 3, 0, 2) === 3 ? 1 : 2;
		this.codec = `MPEG ${version} Layer ${this.layer}`;
		const bitrate = MpegFrameHeader.bitrates[bitrateIndex]?.[10 * Math.floor(version) + this.layer];
		if (!bitrate) throw new MpegContentError("Cannot determine bit-rate");
		this.bitrate = bitrate * 1e3;
		const samplingRate = MpegFrameHeader.samplingRates[version][samplingRateIndex];
		if (samplingRate == null) throw new MpegContentError("Cannot determine sampling-rate");
		this.samplingRate = samplingRate;
		this.samplesPerFrame = MpegFrameHeader.samplesInFrameTable[version === 1 ? 0 : 1][this.layer];
		const slotSize = this.layer === 1 ? 4 : 1;
		this.frameSize = Math.floor(this.samplesPerFrame / 8 * this.bitrate / samplingRate + (padding ? slotSize : 0));
		this.sideInfoLength = this.layer !== 3 ? 2 : MpegFrameHeader.sideInfoLengths[version === 1 ? 0 : 1][this.numberOfChannels === 1 ? 0 : 1];
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mpeg/ReplayGainDataFormat.js
/**
* Replay Gain Data Format
*
* https://github.com/Borewit/music-metadata/wiki/Replay-Gain-Data-Format
*/
var ReplayGain = {
	len: 2,
	get: (buf, off) => {
		const gain_type = getBitAllignedNumber$1(buf, off, 0, 3);
		const sign = getBitAllignedNumber$1(buf, off, 6, 1);
		const gain_adj = getBitAllignedNumber$1(buf, off, 7, 9) / 10;
		if (gain_type > 0) return {
			type: getBitAllignedNumber$1(buf, off, 0, 3),
			origin: getBitAllignedNumber$1(buf, off, 3, 3),
			adjustment: sign ? -gain_adj : gain_adj
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mpeg/ExtendedLameHeader.js
/**
* Extended Lame Header
*/
/**
* Info Tag
* @link http://gabriel.mp3-tech.org/mp3infotag.html
* @link https://github.com/quodlibet/mutagen/blob/abd58ee58772224334a18817c3fb31103572f70e/mutagen/mp3/_util.py#L112
*/
var ExtendedLameHeader = {
	len: 27,
	get: (buf, off) => {
		const track_peak = UINT32_BE.get(buf, off + 2);
		return {
			revision: getBitAllignedNumber$1(buf, off, 0, 4),
			vbr_method: getBitAllignedNumber$1(buf, off, 4, 4),
			lowpass_filter: 100 * UINT8.get(buf, off + 1),
			track_peak: track_peak === 0 ? null : track_peak / 2 ** 23,
			track_gain: ReplayGain.get(buf, 6),
			album_gain: ReplayGain.get(buf, 8),
			music_length: UINT32_BE.get(buf, off + 20),
			music_crc: UINT8.get(buf, off + 24),
			header_crc: UINT16_BE.get(buf, off + 24)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mpeg/XingTag.js
/**
* Info Tag: Xing, LAME
*/
var InfoTagHeaderTag = new StringType(4, "ascii");
/**
* LAME TAG value
* Did not find any official documentation for this
* Value e.g.: "3.98.4"
*/
var LameEncoderVersion = new StringType(6, "ascii");
/**
* Info Tag
* Ref: http://gabriel.mp3-tech.org/mp3infotag.html
*/
var XingHeaderFlags = {
	len: 4,
	get: (buf, off) => {
		return {
			frames: isBitSet$2(buf, off, 31),
			bytes: isBitSet$2(buf, off, 30),
			toc: isBitSet$2(buf, off, 29),
			vbrScale: isBitSet$2(buf, off, 28)
		};
	}
};
async function readXingHeader(tokenizer) {
	const flags = await tokenizer.readToken(XingHeaderFlags);
	const xingInfoTag = {
		numFrames: null,
		streamSize: null,
		vbrScale: null
	};
	if (flags.frames) xingInfoTag.numFrames = await tokenizer.readToken(UINT32_BE);
	if (flags.bytes) xingInfoTag.streamSize = await tokenizer.readToken(UINT32_BE);
	if (flags.toc) {
		xingInfoTag.toc = /* @__PURE__ */ new Uint8Array(100);
		await tokenizer.readBuffer(xingInfoTag.toc);
	}
	if (flags.vbrScale) xingInfoTag.vbrScale = await tokenizer.readToken(UINT32_BE);
	if (await tokenizer.peekToken(new StringType(4, "ascii")) === "LAME") {
		await tokenizer.ignore(4);
		xingInfoTag.lame = { version: await tokenizer.readToken(new StringType(5, "ascii")) };
		const match = xingInfoTag.lame.version.match(/\d+.\d+/g);
		if (match !== null) {
			const version = match[0].split(".").map((n) => Number.parseInt(n, 10));
			if (version[0] >= 3 && version[1] >= 90) xingInfoTag.lame.extended = await tokenizer.readToken(ExtendedLameHeader);
		}
	}
	return xingInfoTag;
}
//#endregion
//#region node_modules/music-metadata/lib/mpeg/MpegParser.js
var MpegParser_exports = /* @__PURE__ */ __exportAll({ MpegParser: () => MpegParser });
var debug$10 = (0, import_src.default)("music-metadata:parser:mpeg");
/**
* Cache buffer size used for searching synchronization preamble
*/
var maxPeekLen = 1024;
function getVbrCodecProfile(vbrScale) {
	return `V${Math.floor((100 - vbrScale) / 10)}`;
}
var MpegParser = class extends AbstractID3Parser {
	frameCount = 0;
	syncFrameCount = -1;
	totalDataLength = 0;
	audioFrameHeader;
	firstBitrate;
	constantBitrate = true;
	offset = 0;
	frameSize = 0;
	audioEnd;
	calculateEofDuration = false;
	samplesPerFrame = null;
	frameHeaderBuffer = new Uint8Array(MpegFrameHeader.len);
	frameHeaderTail = this.frameHeaderBuffer.subarray(1);
	adtsHeaderBuffer = /* @__PURE__ */ new Uint8Array(3);
	sideInfoBuffer = /* @__PURE__ */ new Uint8Array(32);
	/**
	* Number of bytes already parsed since beginning of stream / file
	*/
	mpegOffset = null;
	syncPeek = {
		buf: new Uint8Array(maxPeekLen),
		len: 0
	};
	/**
	* Called after ID3 headers have been parsed
	*/
	async postId3v2Parse() {
		this.metadata.setFormat("lossless", false);
		this.metadata.setAudioOnly();
		if (this.options.duration && isRandomAccessTokenizer(this.tokenizer)) this.audioEnd = this.tokenizer.fileInfo.size - (await hasID3v1Header(this.tokenizer) ? 128 : 0);
		try {
			let quit = false;
			while (!quit) {
				await this.sync();
				quit = await this.parseFrameHeader();
			}
		} catch (err) {
			if (err instanceof EndOfStreamError) {
				debug$10("End-of-stream");
				if (this.calculateEofDuration) {
					if (this.samplesPerFrame !== null) {
						const numberOfSamples = this.frameCount * this.samplesPerFrame;
						this.metadata.setFormat("numberOfSamples", numberOfSamples);
						if (this.metadata.format.sampleRate) {
							const duration = numberOfSamples / this.metadata.format.sampleRate;
							debug$10(`Calculate duration at EOF: ${duration} sec.`, duration);
							this.metadata.setFormat("duration", duration);
						}
					}
				}
			} else throw err;
		}
	}
	/**
	* Called after file has been fully parsed, this allows, if present, to exclude the ID3v1.1 header length
	*/
	finalize() {
		const format = this.metadata.format;
		const hasID3v1 = !!this.metadata.native.ID3v1;
		if (this.mpegOffset !== null) {
			if (format.duration && this.tokenizer.fileInfo.size) {
				const mpegSize = this.tokenizer.fileInfo.size - this.mpegOffset - (hasID3v1 ? 128 : 0);
				if (format.codecProfile && format.codecProfile[0] === "V") this.metadata.setFormat("bitrate", mpegSize * 8 / format.duration);
			}
			if (this.tokenizer.fileInfo.size && format.codecProfile === "CBR" && !this.calculateEofDuration) {
				const mpegSize = this.tokenizer.fileInfo.size - this.mpegOffset - (hasID3v1 ? 128 : 0);
				if (this.samplesPerFrame !== null) {
					const numberOfSamples = Math.round(mpegSize / this.frameSize) * this.samplesPerFrame;
					this.metadata.setFormat("numberOfSamples", numberOfSamples);
					if (format.sampleRate && !format.duration) {
						const duration = numberOfSamples / format.sampleRate;
						debug$10("Calculate CBR duration based on file size: %s", duration);
						this.metadata.setFormat("duration", duration);
					}
				}
			}
		}
	}
	async sync() {
		let gotFirstSync = false;
		while (true) {
			let bo = 0;
			this.syncPeek.len = await this.tokenizer.peekBuffer(this.syncPeek.buf, {
				length: maxPeekLen,
				mayBeLess: true
			});
			if (this.syncPeek.len >= 128 && this.syncPeek.len < maxPeekLen) {
				const footer = this.syncPeek.len - 128;
				const end = this.tokenizer.position + this.syncPeek.len;
				if ((this.tokenizer.fileInfo.size === void 0 || this.tokenizer.fileInfo.size === end) && this.syncPeek.buf[footer] === 84 && this.syncPeek.buf[footer + 1] === 65 && this.syncPeek.buf[footer + 2] === 71) this.audioEnd = end - 128;
			}
			const audioEndReached = this.audioEnd !== void 0 && this.tokenizer.position >= this.audioEnd;
			const fullMpegScan = this.calculateEofDuration && this.audioFrameHeader !== void 0;
			const id3v1Tail = this.syncPeek.len >= 3 && this.syncPeek.buf[0] === 84 && this.syncPeek.buf[1] === 65 && this.syncPeek.buf[2] === 71;
			if (this.syncPeek.len < 2 || audioEndReached || this.syncPeek.len <= 163 && this.audioFrameHeader !== void 0 && (!fullMpegScan || id3v1Tail)) throw new EndOfStreamError();
			while (true) {
				if (gotFirstSync && bo === this.syncPeek.len) {
					await this.tokenizer.ignore(bo - 1);
					gotFirstSync = false;
					break;
				}
				if (gotFirstSync && (this.syncPeek.buf[bo] & 224) === 224) {
					this.frameHeaderBuffer[0] = 255;
					this.frameHeaderBuffer[1] = this.syncPeek.buf[bo];
					if (this.syncPeek.len <= 163 && !AdtsFrameHeader.matches(this.frameHeaderBuffer) && (!fullMpegScan || id3v1Tail)) throw new EndOfStreamError();
					await this.tokenizer.ignore(bo);
					debug$10(`Sync at offset=${this.tokenizer.position - 1}, frameCount=${this.frameCount}`);
					if (this.syncFrameCount === this.frameCount) {
						debug$10(`Re-synced MPEG stream, frameCount=${this.frameCount}`);
						this.frameCount = 0;
						this.frameSize = 0;
					}
					this.syncFrameCount = this.frameCount;
					return;
				}
				gotFirstSync = false;
				bo = this.syncPeek.buf.indexOf(255, bo);
				if (bo === -1) {
					if (this.syncPeek.len < this.syncPeek.buf.length) throw new EndOfStreamError();
					await this.tokenizer.ignore(this.syncPeek.len);
					break;
				}
				++bo;
				gotFirstSync = true;
			}
		}
	}
	/**
	* Read the shared four-byte prefix, then dispatch to ADTS or MPEG audio.
	* @return {Promise<boolean>} true if parser should quit
	*/
	async parseFrameHeader() {
		if (this.frameCount === 0) this.mpegOffset = this.tokenizer.position - 1;
		await this.tokenizer.peekBuffer(this.frameHeaderTail, { length: 3 });
		let header;
		try {
			header = AdtsFrameHeader.matches(this.frameHeaderBuffer) ? new AdtsFrameHeader(this.frameHeaderBuffer) : new MpegFrameHeader(this.frameHeaderBuffer);
		} catch (err) {
			await this.tokenizer.ignore(1);
			if (err instanceof Error) {
				this.metadata.addWarning(`Parse error: ${err.message}`);
				return false;
			}
			throw err;
		}
		if (header instanceof MpegFrameHeader && this.options.duration && this.audioEnd !== void 0 && this.tokenizer.position - 1 + header.frameSize > this.audioEnd) throw new EndOfStreamError();
		await this.tokenizer.ignore(3);
		if (header instanceof AdtsFrameHeader) {
			this.metadata.setFormat("container", header.container);
			this.metadata.setFormat("codec", header.codec);
			this.metadata.setFormat("lossless", false);
			return this.parseAdts(header);
		}
		this.metadata.setFormat("container", header.container);
		this.metadata.setFormat("codec", header.codec);
		this.metadata.setFormat("lossless", false);
		this.frameCount++;
		try {
			return await this.parseMpegFrame(header);
		} catch (error) {
			if (error instanceof EndOfStreamError) --this.frameCount;
			throw error;
		}
	}
	/**
	* @return {Promise<boolean>} true if parser should quit
	*/
	async parseMpegFrame(header) {
		if (this.frameCount < 2e5) debug$10("offset=%s MP%s bitrate=%s sample-rate=%s", this.tokenizer.position - 4, header.layer, header.bitrate, header.samplingRate);
		this.frameSize = header.frameSize;
		this.audioFrameHeader = header;
		if (this.frameCount === 1) {
			this.offset = MpegFrameHeader.len;
			await this.skipSideInformation();
			this.applyMpegFormat(header);
			return false;
		}
		if (this.frameCount === 4) {
			this.samplesPerFrame = header.samplesPerFrame;
			if (this.metadata.format.duration) {
				this.applyMpegFormat(header);
				return true;
			}
			if (!this.options.duration) this.applyMpegFormat(header);
			if (this.constantBitrate) {
				this.samplesPerFrame = header.samplesPerFrame;
				this.metadata.setFormat("codecProfile", "CBR");
			}
			if (!this.options.duration) return true;
		}
		if (this.options.duration && this.frameCount === 4) {
			this.samplesPerFrame = header.samplesPerFrame;
			this.calculateEofDuration = true;
		}
		this.offset = MpegFrameHeader.len;
		if (header.isProtectedByCRC) {
			await this.tokenizer.ignore(2);
			this.offset += 2;
		}
		await this.skipSideInformation();
		this.applyMpegFormat(header);
		if (this.calculateEofDuration && !this.constantBitrate && this.metadata.format.codecProfile === "CBR") this.metadata.setFormat("codecProfile", "VBR");
		return false;
	}
	applyMpegFormat(header) {
		this.metadata.setFormat("container", header.container);
		this.metadata.setFormat("codec", header.codec);
		this.metadata.setFormat("lossless", false);
		this.metadata.setFormat("sampleRate", header.samplingRate);
		this.metadata.setFormat("numberOfChannels", header.numberOfChannels);
		this.metadata.setFormat("bitrate", header.bitrate);
		this.firstBitrate ??= header.bitrate;
		this.constantBitrate &&= header.bitrate === this.firstBitrate;
	}
	async parseAdts(header) {
		await this.tokenizer.readBuffer(this.adtsHeaderBuffer);
		const frameLength = header.frameLength + getBitAllignedNumber$1(this.adtsHeaderBuffer, 0, 0, 11);
		if (frameLength <= header.headerLength) throw new MpegContentError(`Invalid ADTS frame length: ${frameLength}`);
		const remaining = frameLength - 7;
		if (isRandomAccessTokenizer(this.tokenizer)) {
			if (await this.tokenizer.readBuffer(this.adtsHeaderBuffer, {
				position: this.tokenizer.position + remaining - 1,
				length: 1
			}) !== 1) throw new EndOfStreamError();
		} else if (await this.tokenizer.ignore(remaining) !== remaining) throw new EndOfStreamError();
		this.metadata.setFormat("sampleRate", header.samplingRate ?? void 0);
		this.frameCount++;
		this.totalDataLength += frameLength;
		this.samplesPerFrame = 1024;
		this.calculateEofDuration = this.options.duration ?? false;
		if (header.samplingRate !== null) {
			const framesPerSec = header.samplingRate / this.samplesPerFrame;
			const bitrate = 8 * (this.totalDataLength / this.frameCount) * framesPerSec + .5;
			this.metadata.setFormat("bitrate", bitrate);
			debug$10(`frame-count=${this.frameCount}, size=${frameLength} bytes, bit-rate=${bitrate}`);
		}
		if (this.frameCount === 1) {
			this.metadata.setFormat("codecProfile", header.codecProfile);
			if (header.numberOfChannels) this.metadata.setFormat("numberOfChannels", header.numberOfChannels);
		}
		return this.frameCount === 3 && !this.options.duration;
	}
	async skipSideInformation() {
		if (this.audioFrameHeader) {
			const sideInfoLength = this.audioFrameHeader.sideInfoLength;
			await this.tokenizer.readBuffer(this.sideInfoBuffer, { length: sideInfoLength });
			this.offset += sideInfoLength;
			await this.readXtraInfoHeader();
		}
	}
	async readXtraInfoHeader() {
		const headerTag = await this.tokenizer.readToken(InfoTagHeaderTag);
		this.offset += InfoTagHeaderTag.len;
		switch (headerTag) {
			case "Info":
				this.metadata.setFormat("codecProfile", "CBR");
				return this.readXingInfoHeader();
			case "Xing": {
				const infoTag = await this.readXingInfoHeader();
				if (infoTag.vbrScale !== null) {
					const codecProfile = getVbrCodecProfile(infoTag.vbrScale);
					this.metadata.setFormat("codecProfile", codecProfile);
				}
				return null;
			}
			case "Xtra": break;
			case "LAME": {
				const version = await this.tokenizer.readToken(LameEncoderVersion);
				if (this.frameSize >= this.offset + LameEncoderVersion.len) {
					this.offset += LameEncoderVersion.len;
					this.metadata.setFormat("tool", `LAME ${version}`);
					await this.skipFrameData(this.frameSize - this.offset);
					return null;
				}
				this.metadata.addWarning("Corrupt LAME header");
				break;
			}
		}
		const frameDataLeft = this.frameSize - this.offset;
		if (frameDataLeft < 0) this.metadata.addWarning(`Frame ${this.frameCount}corrupt: negative frameDataLeft`);
		else await this.skipFrameData(frameDataLeft);
		return null;
	}
	/**
	* Ref: http://gabriel.mp3-tech.org/mp3infotag.html
	*/
	async readXingInfoHeader() {
		const offset = this.tokenizer.position;
		const infoTag = await readXingHeader(this.tokenizer);
		this.offset += this.tokenizer.position - offset;
		if (infoTag.lame) {
			this.metadata.setFormat("tool", `LAME ${stripNulls(infoTag.lame.version)}`);
			if (infoTag.lame.extended) {
				this.metadata.setFormat("trackPeakLevel", infoTag.lame.extended.track_peak ?? void 0);
				if (infoTag.lame.extended.track_gain) this.metadata.setFormat("trackGain", infoTag.lame.extended.track_gain.adjustment);
				if (infoTag.lame.extended.album_gain) this.metadata.setFormat("albumGain", infoTag.lame.extended.album_gain.adjustment);
				this.metadata.setFormat("duration", infoTag.lame.extended.music_length / 1e3);
			}
		}
		if (infoTag.streamSize && this.audioFrameHeader && infoTag.numFrames !== null) {
			const duration = infoTag.numFrames * this.audioFrameHeader.samplesPerFrame / this.audioFrameHeader.samplingRate;
			this.metadata.setFormat("duration", duration);
			debug$10("Get duration from Xing header: %s", this.metadata.format.duration);
			return infoTag;
		}
		const frameDataLeft = this.frameSize - this.offset;
		await this.skipFrameData(frameDataLeft);
		return infoTag;
	}
	async skipFrameData(frameDataLeft) {
		if (frameDataLeft < 0) throw new MpegContentError("frame-data-left cannot be negative");
		if (frameDataLeft > 0 && this.calculateEofDuration && isRandomAccessTokenizer(this.tokenizer)) {
			if (await this.tokenizer.readBuffer(this.sideInfoBuffer, {
				position: this.tokenizer.position + frameDataLeft - 1,
				length: 1
			}) !== 1) throw new EndOfStreamError();
		} else if (await this.tokenizer.ignore(frameDataLeft) !== frameDataLeft) throw new EndOfStreamError();
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/MusepackConentError.js
var MusepackContentError = class extends makeUnexpectedFileContentError("Musepack") {};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv7/BitReader.js
var BitReader = class {
	pos = 0;
	dword = null;
	tokenizer;
	constructor(tokenizer) {
		this.tokenizer = tokenizer;
	}
	/**
	*
	* @param bits 1..30 bits
	*/
	async read(bits) {
		while (this.dword === null) this.dword = await this.tokenizer.readToken(UINT32_LE);
		let out = this.dword;
		this.pos += bits;
		if (this.pos < 32) {
			out >>>= 32 - this.pos;
			return out & (1 << bits) - 1;
		}
		this.pos -= 32;
		if (this.pos === 0) {
			this.dword = null;
			return out & (1 << bits) - 1;
		}
		this.dword = await this.tokenizer.readToken(UINT32_LE);
		if (this.pos) {
			out <<= this.pos;
			out |= this.dword >>> 32 - this.pos;
		}
		return out & (1 << bits) - 1;
	}
	async ignore(bits) {
		if (this.pos > 0) {
			const remaining = 32 - this.pos;
			this.dword = null;
			bits -= remaining;
			this.pos = 0;
		}
		const remainder = bits % 32;
		const numOfWords = (bits - remainder) / 32;
		await this.tokenizer.ignore(numOfWords * 4);
		return this.read(remainder);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv7/StreamVersion7.js
/**
* BASIC STRUCTURE
*/
var Header$2 = {
	len: 24,
	get: (buf, off) => {
		const header = {
			signature: textDecode(buf.subarray(off, off + 3), "latin1"),
			streamMinorVersion: getBitAllignedNumber$1(buf, off + 3, 0, 4),
			streamMajorVersion: getBitAllignedNumber$1(buf, off + 3, 4, 4),
			frameCount: UINT32_LE.get(buf, off + 4),
			maxLevel: UINT16_LE.get(buf, off + 8),
			sampleFrequency: [
				44100,
				48e3,
				37800,
				32e3
			][getBitAllignedNumber$1(buf, off + 10, 0, 2)],
			link: getBitAllignedNumber$1(buf, off + 10, 2, 2),
			profile: getBitAllignedNumber$1(buf, off + 10, 4, 4),
			maxBand: getBitAllignedNumber$1(buf, off + 11, 0, 6),
			intensityStereo: isBitSet$2(buf, off + 11, 6),
			midSideStereo: isBitSet$2(buf, off + 11, 7),
			titlePeak: UINT16_LE.get(buf, off + 12),
			titleGain: UINT16_LE.get(buf, off + 14),
			albumPeak: UINT16_LE.get(buf, off + 16),
			albumGain: UINT16_LE.get(buf, off + 18),
			lastFrameLength: UINT32_LE.get(buf, off + 20) >>> 20 & 2047,
			trueGapless: isBitSet$2(buf, off + 23, 0)
		};
		header.lastFrameLength = header.trueGapless ? UINT32_LE.get(buf, 20) >>> 20 & 2047 : 0;
		return header;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv7/MpcSv7Parser.js
var debug$9 = (0, import_src.default)("music-metadata:parser:musepack");
var MpcSv7Parser = class extends BasicParser {
	bitreader = null;
	audioLength = 0;
	duration = null;
	async parse() {
		const header = await this.tokenizer.readToken(Header$2);
		if (header.signature !== "MP+") throw new MusepackContentError("Unexpected magic number");
		debug$9(`stream-version=${header.streamMajorVersion}.${header.streamMinorVersion}`);
		this.metadata.setFormat("container", "Musepack, SV7");
		this.metadata.setFormat("sampleRate", header.sampleFrequency);
		const numberOfSamples = 1152 * (header.frameCount - 1) + header.lastFrameLength;
		this.metadata.setFormat("numberOfSamples", numberOfSamples);
		this.duration = numberOfSamples / header.sampleFrequency;
		this.metadata.setFormat("duration", this.duration);
		this.bitreader = new BitReader(this.tokenizer);
		this.metadata.setFormat("numberOfChannels", header.midSideStereo || header.intensityStereo ? 2 : 1);
		const version = await this.bitreader.read(8);
		this.metadata.setFormat("codec", (version / 100).toFixed(2));
		await this.skipAudioData(header.frameCount);
		debug$9(`End of audio stream, switching to APEv2, offset=${this.tokenizer.position}`);
		return tryParseApeHeader(this.metadata, this.tokenizer, this.options);
	}
	async skipAudioData(frameCount) {
		while (frameCount-- > 0) {
			const frameLength = await this.bitreader.read(20);
			this.audioLength += 20 + frameLength;
			await this.bitreader.ignore(frameLength);
		}
		const lastFrameLength = await this.bitreader.read(11);
		this.audioLength += lastFrameLength;
		if (this.duration !== null) this.metadata.setFormat("bitrate", this.audioLength / this.duration);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv8/StreamVersion8.js
var debug$8 = (0, import_src.default)("music-metadata:parser:musepack:sv8");
var PacketKey = new StringType(2, "latin1");
/**
* Stream Header Packet part 1
* Ref: http://trac.musepack.net/musepack/wiki/SV8Specification#StreamHeaderPacket
*/
var SH_part1 = {
	len: 5,
	get: (buf, off) => {
		return {
			crc: UINT32_LE.get(buf, off),
			streamVersion: UINT8.get(buf, off + 4)
		};
	}
};
/**
* Stream Header Packet part 3
* Ref: http://trac.musepack.net/musepack/wiki/SV8Specification#StreamHeaderPacket
*/
var SH_part3 = {
	len: 2,
	get: (buf, off) => {
		return {
			sampleFrequency: [
				44100,
				48e3,
				37800,
				32e3
			][getBitAllignedNumber$1(buf, off, 0, 3)],
			maxUsedBands: getBitAllignedNumber$1(buf, off, 3, 5),
			channelCount: getBitAllignedNumber$1(buf, off + 1, 0, 4) + 1,
			msUsed: isBitSet$2(buf, off + 1, 4),
			audioBlockFrames: getBitAllignedNumber$1(buf, off + 1, 5, 3)
		};
	}
};
var StreamReader = class {
	_tokenizer;
	get tokenizer() {
		return this._tokenizer;
	}
	set tokenizer(value) {
		this._tokenizer = value;
	}
	constructor(_tokenizer) {
		this._tokenizer = _tokenizer;
	}
	async readPacketHeader() {
		const key = await this.tokenizer.readToken(PacketKey);
		const size = await this.readVariableSizeField();
		const headerLength = PacketKey.len + size.len;
		if (size.value < headerLength) throw new MusepackContentError(`Invalid packet size: ${size.value}`);
		return {
			key,
			payloadLength: size.value - headerLength
		};
	}
	async readStreamHeader(size) {
		const streamHeader = {};
		debug$8(`Reading SH at offset=${this.tokenizer.position}`);
		const part1 = await this.tokenizer.readToken(SH_part1);
		size -= SH_part1.len;
		Object.assign(streamHeader, part1);
		debug$8(`SH.streamVersion = ${part1.streamVersion}`);
		const sampleCount = await this.readVariableSizeField();
		size -= sampleCount.len;
		streamHeader.sampleCount = sampleCount.value;
		const bs = await this.readVariableSizeField();
		size -= bs.len;
		streamHeader.beginningOfSilence = bs.value;
		const part3 = await this.tokenizer.readToken(SH_part3);
		size -= SH_part3.len;
		Object.assign(streamHeader, part3);
		await this.tokenizer.ignore(size);
		return streamHeader;
	}
	async readVariableSizeField() {
		let value = 0;
		for (let len = 1; len <= 9; ++len) {
			const byte = await this.tokenizer.readNumber(UINT8);
			const digit = byte & 127;
			if (value > (Number.MAX_SAFE_INTEGER - digit) / 128) throw new MusepackContentError("Variable-size integer exceeds JavaScript safe integer range");
			value = value * 128 + digit;
			if ((byte & 128) === 0) return {
				len,
				value
			};
		}
		throw new MusepackContentError("Variable-size integer exceeds 9 bytes");
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv8/MpcSv8Parser.js
var debug$7 = (0, import_src.default)("music-metadata:parser:musepack");
var MpcSv8Parser = class extends BasicParser {
	audioLength = 0;
	async parse() {
		if (await this.tokenizer.readToken(FourCcToken) !== "MPCK") throw new MusepackContentError("Invalid Magic number");
		this.metadata.setFormat("container", "Musepack, SV8");
		return this.parsePacket();
	}
	async parsePacket() {
		const sv8reader = new StreamReader(this.tokenizer);
		do {
			const header = await sv8reader.readPacketHeader();
			debug$7(`packet-header key=${header.key}, payloadLength=${header.payloadLength}`);
			switch (header.key) {
				case "SH": {
					const sh = await sv8reader.readStreamHeader(header.payloadLength);
					this.metadata.setFormat("numberOfSamples", sh.sampleCount);
					this.metadata.setFormat("sampleRate", sh.sampleFrequency);
					this.metadata.setFormat("duration", sh.sampleCount / sh.sampleFrequency);
					this.metadata.setFormat("numberOfChannels", sh.channelCount);
					break;
				}
				case "AP":
					this.audioLength += header.payloadLength;
					await this.tokenizer.ignore(header.payloadLength);
					break;
				case "RG":
				case "EI":
				case "SO":
				case "ST":
				case "CT":
					await this.tokenizer.ignore(header.payloadLength);
					break;
				case "SE":
					if (this.metadata.format.duration) this.metadata.setFormat("bitrate", this.audioLength * 8 / this.metadata.format.duration);
					return tryParseApeHeader(this.metadata, this.tokenizer, this.options);
				default: throw new MusepackContentError(`Unexpected header: ${header.key}`);
			}
		} while (true);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/MusepackParser.js
var MusepackParser_exports = /* @__PURE__ */ __exportAll({ MusepackParser: () => MusepackParser });
var debug$6 = (0, import_src.default)("music-metadata:parser:musepack");
var MusepackParser = class extends AbstractID3Parser {
	async postId3v2Parse() {
		const signature = await this.tokenizer.peekToken(new StringType(3, "latin1"));
		let mpcParser;
		switch (signature) {
			case "MP+":
				debug$6("Stream-version 7");
				mpcParser = new MpcSv7Parser(this.metadata, this.tokenizer, this.options);
				break;
			case "MPC":
				debug$6("Stream-version 8");
				mpcParser = new MpcSv8Parser(this.metadata, this.tokenizer, this.options);
				break;
			default: throw new MusepackContentError("Invalid signature prefix");
		}
		this.metadata.setAudioOnly();
		return mpcParser.parse();
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/flac/FlacStream.js
var FlacContentError = class extends makeUnexpectedFileContentError("FLAC") {};
var debug$5 = (0, import_src.default)("music-metadata:parser:ogg:flac");
/**
* Ref:
* - https://xiph.org/flac/ogg_mapping.html
*/
var FlacStream = class {
	metadata;
	options;
	flacParser;
	lastPageHeader;
	lastGranulePosition;
	durationOnLastPage = true;
	isMetadataComplete = false;
	identified = false;
	packetParts = [];
	packetLength = 0;
	constructor(metadata, options, tokenizer) {
		this.metadata = metadata;
		this.options = options;
		this.flacParser = new FlacParser(this.metadata, tokenizer, options);
	}
	/** Assemble metadata packets using the page lacing table. */
	async parsePage(header, pageData, lacingValues = /* @__PURE__ */ new Uint8Array()) {
		this.lastPageHeader = header;
		if (header.absoluteGranulePosition >= 0) this.lastGranulePosition = header.absoluteGranulePosition;
		if (this.isMetadataComplete) return;
		if (header.headerType.continued !== this.packetLength > 0) throw new FlacContentError("Invalid Ogg/FLAC packet continuation");
		if (lacingValues.reduce((sum, length) => sum + length, 0) !== pageData.length) throw new FlacContentError("Ogg/FLAC lacing does not match page data");
		let offset = 0;
		for (const length of lacingValues) {
			validateAllocation(this.packetLength + length, this.options);
			if (length > 0) {
				if (this.packetParts.length >= getMaxMetadataEntries(this.options)) throw new FlacContentError("Buffered Ogg/FLAC segment count exceeds entry limit");
				this.packetParts.push(pageData.subarray(offset, offset + length));
				this.packetLength += length;
			}
			offset += length;
			if (length < 255) {
				const packet = new Uint8Array(this.packetLength);
				let position = 0;
				for (const part of this.packetParts) {
					packet.set(part, position);
					position += part.length;
				}
				this.packetParts = [];
				this.packetLength = 0;
				await this.parsePacket(packet);
				if (this.isMetadataComplete) break;
			}
		}
		if (header.headerType.lastPage) await this.flush();
	}
	async parsePacket(packet) {
		if (!this.identified) {
			await this.parseFirstPage(packet);
			this.identified = true;
			return;
		}
		if (packet.length < BlockHeader.len) throw new FlacContentError("Truncated Ogg/FLAC metadata header");
		const header = BlockHeader.get(packet, 0);
		if (header.type === BlockType.STREAMINFO) throw new FlacContentError("Unexpected repeated Ogg/FLAC STREAMINFO");
		if (header.length !== packet.length - BlockHeader.len) throw new FlacContentError("Ogg/FLAC metadata block length does not match packet");
		await this.parseDataBlock(header, packet.subarray(BlockHeader.len));
		this.isMetadataComplete = header.lastBlock;
	}
	calculateDuration(enfOfStream) {
		if (this.lastPageHeader && (enfOfStream || this.lastPageHeader.headerType.lastPage) && this.metadata.format.sampleRate && this.lastGranulePosition !== void 0) {
			this.metadata.setFormat("numberOfSamples", this.lastGranulePosition);
			this.metadata.setFormat("duration", this.lastGranulePosition / this.metadata.format.sampleRate);
		}
	}
	async parseFirstPage(packet) {
		debug$5("First Ogg/FLAC packet");
		if (packet.length !== 13 + BlockHeader.len + BlockStreamInfo.len) throw new FlacContentError("Invalid Ogg/FLAC identification packet length");
		if (packet[0] !== 127 || FourCcToken.get(packet, 1) !== "FLAC" || packet[5] !== 1 || FourCcToken.get(packet, 9) !== "fLaC") throw new FlacContentError("Invalid Ogg/FLAC preamble or mapping version");
		const header = BlockHeader.get(packet, 13);
		if (header.type !== BlockType.STREAMINFO || header.length !== BlockStreamInfo.len) throw new FlacContentError("Invalid Ogg/FLAC STREAMINFO header");
		await this.parseDataBlock(header, packet.subarray(17));
		this.isMetadataComplete = header.lastBlock;
	}
	async parseDataBlock(blockHeader, pageData) {
		debug$5(`blockHeader type=${blockHeader.type}, length=${blockHeader.length}`);
		switch (blockHeader.type) {
			case BlockType.STREAMINFO: {
				const streamInfo = BlockStreamInfo.get(pageData, 0);
				return this.flacParser.processsStreamInfo(streamInfo);
			}
			case BlockType.PADDING: break;
			case BlockType.APPLICATION: break;
			case BlockType.SEEKTABLE:
			case BlockType.CUESHEET: break;
			case BlockType.VORBIS_COMMENT: return this.flacParser.parseComment(pageData);
			case BlockType.PICTURE:
				if (!this.options.skipCovers) {
					this.validatePicture(pageData);
					const picture = new VorbisPictureToken(pageData.length).get(pageData, 0);
					return this.flacParser.addPictureTag(picture);
				}
				break;
			default: this.metadata.addWarning(`Unknown block type: ${blockHeader.type}`);
		}
	}
	validatePicture(data) {
		if (data.length < 32) throw new FlacContentError("Truncated Ogg/FLAC picture");
		const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		const mimeLength = view.getUint32(4);
		if (mimeLength > data.length - 32) throw new FlacContentError("Ogg/FLAC picture MIME length exceeds block");
		const descriptionLength = view.getUint32(8 + mimeLength);
		if (descriptionLength > data.length - 32 - mimeLength) throw new FlacContentError("Ogg/FLAC picture description length exceeds block");
		const headerLength = 32 + mimeLength + descriptionLength;
		if (view.getUint32(headerLength - 4) !== data.length - headerLength) throw new FlacContentError("Ogg/FLAC picture data length does not match block");
	}
	async flush() {
		if (this.packetLength > 0 || this.identified && !this.isMetadataComplete) throw new FlacContentError("Truncated Ogg/FLAC metadata packet");
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/OggStreamMetadata.js
/** Keep format values local to a logical stream while sharing tags and warnings. */
var OggStreamMetadata = class extends MetadataCollector {
	parent;
	constructor(parent) {
		super();
		this.parent = parent;
		this.native = parent.native;
		this.quality = parent.quality;
	}
	setFormat(key, value) {
		super.setFormat(key, value);
		if (key !== "hasAudio" && key !== "hasVideo" || value === true) this.parent.setFormat(key, value);
	}
	registerTagType(tagType) {
		this.parent.registerTagType(tagType);
	}
	addTag(tagType, tagId, value) {
		return this.parent.addTag(tagType, tagId, value);
	}
	addWarning(warning) {
		this.parent.addWarning(warning);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/OggToken.js
var PageHeader = {
	len: 27,
	get: (buf, off) => {
		const granulePosition = UINT64_LE.get(buf, off + 6);
		return {
			capturePattern: new StringType(4, "latin1").get(buf, off),
			version: UINT8.get(buf, off + 4),
			headerType: {
				continued: getBit(buf, off + 5, 0),
				firstPage: getBit(buf, off + 5, 1),
				lastPage: getBit(buf, off + 5, 2)
			},
			absoluteGranulePosition: granulePosition === 18446744073709551615n ? -1 : Number(granulePosition),
			streamSerialNumber: UINT32_LE.get(buf, off + 14),
			pageSequenceNo: UINT32_LE.get(buf, off + 18),
			pageChecksum: UINT32_LE.get(buf, off + 22),
			page_segments: UINT8.get(buf, off + 26)
		};
	}
};
var SegmentTable = class {
	len;
	constructor(header) {
		this.len = header.page_segments;
	}
	get(buf, off) {
		const lacingValues = Uint8Array.from(buf.subarray(off, off + this.len));
		return {
			totalPageSize: lacingValues.reduce((sum, length) => sum + length, 0),
			lacingValues
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/opus/Opus.js
var OpusContentError = class extends makeUnexpectedFileContentError("Opus") {};
/**
* Opus ID Header parser
* Ref: https://wiki.xiph.org/OggOpus#ID_Header
*/
var IdHeader = class {
	len;
	constructor(len) {
		if (len < 19) throw new OpusContentError("ID-header-page 0 should be at least 19 bytes long");
		this.len = len;
	}
	get(buf, off) {
		return {
			magicSignature: new StringType(8, "ascii").get(buf, off + 0),
			version: UINT8.get(buf, off + 8),
			channelCount: UINT8.get(buf, off + 9),
			preSkip: UINT16_LE.get(buf, off + 10),
			inputSampleRate: UINT32_LE.get(buf, off + 12),
			outputGain: UINT16_LE.get(buf, off + 16),
			channelMapping: UINT8.get(buf, off + 18)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/opus/OpusStream.js
/**
* Opus parser
* Internet Engineering Task Force (IETF) - RFC 6716
* Used by OggStream
*/
var OpusStream = class extends VorbisStream {
	idHeader = null;
	lastPos = -1;
	tokenizer;
	constructor(metadata, options, tokenizer) {
		super(metadata, options);
		this.tokenizer = tokenizer;
		this.durationOnLastPage = true;
	}
	/**
	* Parse first Opus Ogg page
	* @param {IPageHeader} header
	* @param {Uint8Array} pageData
	*/
	parseFirstPage(_header, pageData) {
		this.metadata.setFormat("codec", "Opus");
		this.metadata.setFormat("lossless", false);
		this.idHeader = new IdHeader(pageData.length).get(pageData, 0);
		if (this.idHeader.magicSignature !== "OpusHead") throw new OpusContentError("Illegal ogg/Opus magic-signature");
		this.metadata.setFormat("sampleRate", this.idHeader.inputSampleRate);
		this.metadata.setFormat("numberOfChannels", this.idHeader.channelCount);
		this.metadata.setAudioOnly();
	}
	async parseFullPage(pageData) {
		switch (new StringType(8, "ascii").get(pageData, 0)) {
			case "OpusTags":
				await this.parseUserCommentList(pageData, 8);
				this.lastPos = this.tokenizer.position - pageData.length;
		}
	}
	calculateDuration(enfOfStream) {
		if (this.lastPageHeader && (enfOfStream || this.lastPageHeader.headerType.lastPage) && this.metadata.format.sampleRate && this.lastPageHeader.absoluteGranulePosition >= 0) {
			const pos_48bit = this.lastPageHeader.absoluteGranulePosition - this.idHeader.preSkip;
			this.metadata.setFormat("numberOfSamples", pos_48bit);
			this.metadata.setFormat("duration", pos_48bit / 48e3);
			if (this.lastPos !== -1 && this.tokenizer.fileInfo.size && this.metadata.format.duration) {
				const dataSize = this.tokenizer.fileInfo.size - this.lastPos;
				this.metadata.setFormat("bitrate", 8 * dataSize / this.metadata.format.duration);
			}
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/speex/Speex.js
/**
* Speex Header Packet
* Ref: https://www.speex.org/docs/manual/speex-manual/node8.html#SECTION00830000000000000000
*/
var Header$1 = {
	len: 80,
	get: (buf, off) => {
		return {
			speex: new StringType(8, "ascii").get(buf, off + 0),
			version: trimRightNull(new StringType(20, "ascii").get(buf, off + 8)),
			version_id: INT32_LE.get(buf, off + 28),
			header_size: INT32_LE.get(buf, off + 32),
			rate: INT32_LE.get(buf, off + 36),
			mode: INT32_LE.get(buf, off + 40),
			mode_bitstream_version: INT32_LE.get(buf, off + 44),
			nb_channels: INT32_LE.get(buf, off + 48),
			bitrate: INT32_LE.get(buf, off + 52),
			frame_size: INT32_LE.get(buf, off + 56),
			vbr: INT32_LE.get(buf, off + 60),
			frames_per_packet: INT32_LE.get(buf, off + 64),
			extra_headers: INT32_LE.get(buf, off + 68),
			reserved1: INT32_LE.get(buf, off + 72),
			reserved2: INT32_LE.get(buf, off + 76)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/speex/SpeexStream.js
var SpeexContentError = class extends makeUnexpectedFileContentError("Speex") {};
var debug$4 = (0, import_src.default)("music-metadata:parser:ogg:speex");
/**
* Speex, RFC 5574
* Ref:
* - https://www.speex.org/docs/manual/speex-manual/
* - https://tools.ietf.org/html/rfc5574
*/
var SpeexStream = class extends VorbisStream {
	commentHeaderParsed = false;
	constructor(metadata, options, _tokenizer) {
		super(metadata, options);
	}
	/**
	* Parse first Speex Ogg page
	* @param {IPageHeader} header
	* @param {Uint8Array} pageData
	*/
	parseFirstPage(_header, pageData) {
		debug$4("First Ogg/Speex page");
		if (pageData.length < Header$1.len) throw new SpeexContentError("Truncated Speex identification header");
		const speexHeader = Header$1.get(pageData, 0);
		this.metadata.setFormat("codec", `Speex ${speexHeader.version}`);
		this.metadata.setFormat("lossless", false);
		this.metadata.setFormat("numberOfChannels", speexHeader.nb_channels);
		this.metadata.setFormat("sampleRate", speexHeader.rate);
		if (speexHeader.bitrate !== -1) this.metadata.setFormat("bitrate", speexHeader.bitrate);
		this.metadata.setAudioOnly();
	}
	/**
	* The packet following the identification header is the comment header, in
	* Vorbis comment format but without a packet type or magic signature.
	* Ref: https://tools.ietf.org/html/rfc5574#section-3
	*/
	async parseFullPage(pageData) {
		if (this.commentHeaderParsed) return;
		this.commentHeaderParsed = true;
		debug$4("Parse Ogg/Speex comment header");
		await this.parseUserCommentList(pageData, 0);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/theora/Theora.js
/**
* 6.2 Identification Header
* Ref: https://theora.org/doc/Theora.pdf: 6.2 Identification Header Decode
*/
var IdentificationHeader = {
	len: 42,
	get: (buf, off) => {
		return {
			id: new StringType(7, "ascii").get(buf, off),
			vmaj: UINT8.get(buf, off + 7),
			vmin: UINT8.get(buf, off + 8),
			vrev: UINT8.get(buf, off + 9),
			vmbw: UINT16_BE.get(buf, off + 10),
			vmbh: UINT16_BE.get(buf, off + 12),
			picw: UINT24_BE.get(buf, off + 14),
			pich: UINT24_BE.get(buf, off + 17),
			frn: UINT32_BE.get(buf, off + 22),
			frd: UINT32_BE.get(buf, off + 26),
			nombr: UINT24_BE.get(buf, off + 37),
			nqual: UINT16_BE.get(buf, off + 40) >> 10,
			keyframeGranuleShift: UINT16_BE.get(buf, off + 40) >> 5 & 31
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/theora/TheoraStream.js
var TheoraContentError = class extends makeUnexpectedFileContentError("Theora") {};
var debug$3 = (0, import_src.default)("music-metadata:parser:ogg:theora");
/**
* Ref:
* - https://theora.org/doc/Theora.pdf
*/
var TheoraStream = class {
	metadata;
	durationOnLastPage = true;
	identification;
	lastPageHeader;
	lastGranulePosition;
	constructor(metadata, _options, _tokenizer) {
		this.metadata = metadata;
	}
	/**
	* Vorbis 1 parser
	* @param header Ogg Page Header
	* @param pageData Page data
	*/
	async parsePage(header, pageData) {
		this.lastPageHeader = header;
		if (Number.isSafeInteger(header.absoluteGranulePosition) && header.absoluteGranulePosition >= 0) this.lastGranulePosition = header.absoluteGranulePosition;
		if (header.headerType.firstPage) await this.parseFirstPage(header, pageData);
	}
	calculateDuration(endOfStream) {
		const info = this.identification;
		const granule = this.lastGranulePosition;
		if (!info || !this.lastPageHeader || !(endOfStream || this.lastPageHeader.headerType.lastPage) || granule === void 0 || info.frn <= 0 || info.frd <= 0) return;
		const scale = 2 ** info.keyframeGranuleShift;
		const legacy = info.vmaj * 65536 + info.vmin * 256 + info.vrev < 197121;
		const frames = Math.floor(granule / scale) + granule % scale + Number(legacy);
		if (frames > 0) {
			const duration = frames * info.frd / info.frn;
			this.metadata.format.trackInfo[0].duration = duration;
		}
	}
	/**
	* Parse first Theora Ogg page. the initial identification header packet
	*/
	async parseFirstPage(_header, pageData) {
		debug$3("First Ogg/Theora page");
		this.metadata.setFormat("codec", "Theora");
		if (pageData.length < IdentificationHeader.len) throw new TheoraContentError("Truncated Theora identification header");
		const idHeader = IdentificationHeader.get(pageData, 0);
		this.identification = idHeader;
		this.metadata.setFormat("bitrate", idHeader.nombr);
		this.metadata.setFormat("hasVideo", true);
		this.metadata.addStreamInfo({
			type: TrackType.video,
			codecName: "Theora",
			...idHeader.nombr > 0 ? { bitrate: idHeader.nombr } : {},
			video: {
				pixelWidth: idHeader.vmbw * 16,
				pixelHeight: idHeader.vmbh * 16,
				displayWidth: idHeader.picw,
				displayHeight: idHeader.pich,
				...idHeader.frd > 0 && idHeader.frn > 0 ? { frameRate: idHeader.frn / idHeader.frd } : {}
			}
		});
	}
	flush() {
		return Promise.resolve();
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/OggParser.js
var OggParser_exports = /* @__PURE__ */ __exportAll({
	OggContentError: () => OggContentError,
	OggParser: () => OggParser
});
var OggContentError = class extends makeUnexpectedFileContentError("Ogg") {};
var debug$2 = (0, import_src.default)("music-metadata:parser:ogg");
var OggStream = class {
	metadata;
	streamSerial;
	pageNumber = 0;
	payloadBytes = 0;
	closed = false;
	options;
	pageConsumer;
	isSkeleton = false;
	constructor(metadata, streamSerial, options) {
		this.metadata = new OggStreamMetadata(metadata);
		this.streamSerial = streamSerial;
		this.options = options;
	}
	async parsePage(tokenizer, header) {
		this.pageNumber = header.pageSequenceNo;
		debug$2("serial=%s page#=%s, Ogg.id=%s", header.streamSerialNumber, header.pageSequenceNo, header.capturePattern);
		const segmentTable = await tokenizer.readToken(new SegmentTable(header));
		debug$2("totalPageSize=%s", segmentTable.totalPageSize);
		const pageData = await readToken(tokenizer, new Uint8ArrayType(segmentTable.totalPageSize), this.options);
		this.payloadBytes += pageData.length;
		debug$2("firstPage=%s, lastPage=%s, continued=%s", header.headerType.firstPage, header.headerType.lastPage, header.headerType.continued);
		if (header.headerType.firstPage) {
			this.metadata.setFormat("container", "Ogg");
			const idData = pageData.subarray(0, 7);
			const asciiId = Array.from(idData).filter((b) => b >= 32 && b <= 126).map((b) => String.fromCharCode(b)).join("");
			switch (asciiId) {
				case "vorbis":
					debug$2(`Set Ogg stream serial ${header.streamSerialNumber}, codec=Vorbis`);
					this.pageConsumer = new VorbisStream(this.metadata, this.options);
					break;
				case "OpusHea":
					debug$2("Set page consumer to Ogg/Opus");
					this.pageConsumer = new OpusStream(this.metadata, this.options, tokenizer);
					break;
				case "Speex  ":
					debug$2("Set page consumer to Ogg/Speex");
					this.pageConsumer = new SpeexStream(this.metadata, this.options, tokenizer);
					break;
				case "fishead":
					this.isSkeleton = true;
					break;
				case "theora":
					debug$2("Set page consumer to Ogg/Theora");
					this.pageConsumer = new TheoraStream(this.metadata, this.options, tokenizer);
					break;
				case "FLAC":
					debug$2("Set page consumer to Vorbis");
					this.pageConsumer = new FlacStream(this.metadata, this.options, tokenizer);
					break;
				default: throw new OggContentError(`Ogg codec not recognized (id=${asciiId}`);
			}
		}
		if (header.headerType.lastPage) this.closed = true;
		if (this.isSkeleton) return;
		if (this.pageConsumer) await this.pageConsumer.parsePage(header, pageData, segmentTable.lacingValues);
		else throw new Error("pageConsumer should be initialized");
	}
};
/**
* Parser for Ogg logical bitstream framing
*/
var OggParser = class extends BasicParser {
	streams = /* @__PURE__ */ new Map();
	/**
	* Parse page
	* @returns {Promise<void>}
	*/
	async parse() {
		this.streams = /* @__PURE__ */ new Map();
		const maxLogicalStreams = getMaxMetadataEntries(this.options);
		let enfOfStream = false;
		let stoppedEarly = false;
		let header;
		try {
			do {
				header = await this.tokenizer.readToken(PageHeader);
				if (header.capturePattern !== "OggS") throw new OggContentError("Invalid Ogg capture pattern");
				let stream = this.streams.get(header.streamSerialNumber);
				if (!stream) {
					if (this.streams.size >= maxLogicalStreams) throw new OggContentError("Logical stream count exceeds entry limit");
					stream = new OggStream(this.metadata, header.streamSerialNumber, this.options);
					this.streams.set(header.streamSerialNumber, stream);
				}
				await stream.parsePage(this.tokenizer, header);
				if (stream.pageNumber > 12 && [...this.streams.values()].every((stream) => stream.pageConsumer?.isMetadataComplete !== false) && !(this.options.duration && [...this.streams.values()].find((stream) => stream.pageConsumer?.durationOnLastPage))) {
					stoppedEarly = true;
					debug$2("Stop processing Ogg stream");
					break;
				}
			} while (![...this.streams.values()].every((item) => item.closed));
		} catch (err) {
			if (err instanceof EndOfStreamError) {
				debug$2("Reached end-of-stream");
				enfOfStream = true;
			} else if (err instanceof OggContentError) this.metadata.addWarning(`Corrupt Ogg content at ${this.tokenizer.position}`);
			else throw err;
		}
		for (const stream of this.streams.values()) {
			if (!stream.closed) {
				if (!stoppedEarly) this.metadata.addWarning(`End-of-stream reached before reaching last page in Ogg stream serial=${stream.streamSerial}`);
				await stream.pageConsumer?.flush();
			}
			stream.pageConsumer?.calculateDuration(enfOfStream);
			const format = stream.metadata.format;
			if (format.hasAudio) {
				const track = createAudioTrackInfo(format);
				track.id = stream.streamSerial;
				if (format.codec === "Opus") {
					delete track.bitrate;
					if (track.duration && track.duration > 0 && stream.closed) track.bitrate = stream.payloadBytes * 8 / track.duration;
				}
				if (format.codec === "Opus" && track.audio) track.audio.outputSamplingFrequency = 48e3;
				this.metadata.addStreamInfo(track);
			} else if (format.hasVideo) {
				const track = format.trackInfo[0] ?? {
					type: TrackType.video,
					codecName: format.codec
				};
				track.id = stream.streamSerial;
				if (track.duration && track.duration > 0 && (stream.closed || enfOfStream)) track.bitrate = stream.payloadBytes * 8 / track.duration;
				this.metadata.addStreamInfo(track);
			}
		}
		for (const flag of ["hasAudio", "hasVideo"]) {
			const present = [...this.streams.values()].some((stream) => stream.metadata.format[flag] === true);
			if (this.metadata.format[flag] !== present) this.metadata.setFormat(flag, present);
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/riff/RiffChunk.js
/**
* Common RIFF chunk header
*/
var Header = {
	len: 8,
	get: (buf, off) => {
		return {
			chunkID: new StringType(4, "latin1").get(buf, off),
			chunkSize: UINT32_LE.get(buf, off + 4)
		};
	}
};
/**
* Token to parse RIFF-INFO tag value
*/
var ListInfoTagValue = class {
	encoding;
	len;
	tagHeader;
	constructor(tagHeader, encoding = "latin1") {
		this.encoding = encoding;
		this.tagHeader = tagHeader;
		this.len = tagHeader.chunkSize;
		this.len += this.len & 1;
	}
	get(buf, off) {
		return new StringType(this.tagHeader.chunkSize, this.encoding).get(buf, off).split("\0", 1)[0];
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wav/WaveChunk.js
var WaveContentError = class extends makeUnexpectedFileContentError("Wave") {};
/**
* Ref: https://msdn.microsoft.com/en-us/library/windows/desktop/dd317599(v=vs.85).aspx
*/
var WaveFormat = {
	PCM: 1,
	ADPCM: 2,
	IEEE_FLOAT: 3,
	ALAW: 6,
	MULAW: 7,
	DVI_ADPCM: 17,
	GSM610: 49,
	MPEG_ADTS_AAC: 5632,
	MPEG_LOAS: 5634,
	RAW_AAC1: 255,
	DOLBY_AC3_SPDIF: 146,
	DVM: 8192,
	RAW_SPORT: 576,
	ESST_AC3: 577,
	DRM: 9,
	DTS2: 8193,
	MPEG: 80,
	MPEGLAYER3: 85,
	FLAC: 61868,
	EXTENSIBLE: 65534
};
var WaveFormatNameMap = {
	[WaveFormat.PCM]: "PCM",
	[WaveFormat.ADPCM]: "ADPCM",
	[WaveFormat.IEEE_FLOAT]: "IEEE_FLOAT",
	[WaveFormat.ALAW]: "ALAW",
	[WaveFormat.MULAW]: "MULAW",
	[WaveFormat.DVI_ADPCM]: "DVI_ADPCM",
	[WaveFormat.GSM610]: "GSM610",
	[WaveFormat.MPEG_ADTS_AAC]: "MPEG_ADTS_AAC",
	[WaveFormat.MPEG_LOAS]: "MPEG_LOAS",
	[WaveFormat.RAW_AAC1]: "RAW_AAC1",
	[WaveFormat.DOLBY_AC3_SPDIF]: "DOLBY_AC3_SPDIF",
	[WaveFormat.DVM]: "DVM",
	[WaveFormat.RAW_SPORT]: "RAW_SPORT",
	[WaveFormat.ESST_AC3]: "ESST_AC3",
	[WaveFormat.DRM]: "DRM",
	[WaveFormat.DTS2]: "DTS2",
	[WaveFormat.MPEG]: "MPEG",
	[WaveFormat.MPEGLAYER3]: "MPEGLAYER3",
	[WaveFormat.FLAC]: "FLAC"
};
/**
* Common suffix of the KSDATAFORMAT_SUBTYPE_* GUIDs used by WAVE_FORMAT_EXTENSIBLE.
* The first four bytes contain the WAVE format tag.
*/
var WaveFormatExtensibleSubFormatSuffix = new Uint8Array([
	0,
	0,
	0,
	0,
	16,
	0,
	128,
	0,
	0,
	170,
	0,
	56,
	155,
	113
]);
function hasStandardSubFormatGuid(buf, off) {
	for (let i = 0; i < WaveFormatExtensibleSubFormatSuffix.length; i++) if (buf[off + i] !== WaveFormatExtensibleSubFormatSuffix[i]) return false;
	return true;
}
/**
* Uncompressed or lossless WAVE formats.
*/
function isLosslessWaveFormat(wFormatTag) {
	return wFormatTag === WaveFormat.PCM || wFormatTag === WaveFormat.IEEE_FLOAT || wFormatTag === WaveFormat.FLAC;
}
/**
* PCM in a WAVEFORMATEXTENSIBLE container may use fewer valid bits than the
* container size, for example 20-bit samples stored in 24-bit words.
*/
function getBitsPerSample(format) {
	if (format.wFormatTag === WaveFormat.PCM && format.wValidBitsPerSample !== void 0 && format.wValidBitsPerSample > 0 && format.wValidBitsPerSample <= format.wBitsPerSample) return format.wValidBitsPerSample;
	return format.wBitsPerSample;
}
/**
* format chunk; chunk-id is "fmt "
* http://soundfile.sapp.org/doc/WaveFormat/
*/
var Format = class {
	len;
	constructor(header) {
		if (header.chunkSize < 16) throw new WaveContentError("Invalid chunk size");
		this.len = header.chunkSize;
	}
	get(buf, off) {
		let wFormatTag = UINT16_LE.get(buf, off);
		let wValidBitsPerSample;
		if (wFormatTag === WaveFormat.EXTENSIBLE && this.len >= 40 && off + 40 <= buf.length) {
			if (UINT16_LE.get(buf, off + 16) >= 22) {
				wValidBitsPerSample = UINT16_LE.get(buf, off + 18);
				if (hasStandardSubFormatGuid(buf, off + 26)) wFormatTag = UINT16_LE.get(buf, off + 24);
			}
		}
		return {
			wFormatTag,
			nChannels: UINT16_LE.get(buf, off + 2),
			nSamplesPerSec: UINT32_LE.get(buf, off + 4),
			nAvgBytesPerSec: UINT32_LE.get(buf, off + 8),
			nBlockAlign: UINT16_LE.get(buf, off + 12),
			wBitsPerSample: UINT16_LE.get(buf, off + 14),
			wValidBitsPerSample
		};
	}
};
/**
* Fact chunk; chunk-id is "fact"
* http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
* http://www.recordingblogs.com/wiki/fact-chunk-of-a-wave-file
*/
var FactChunk = class {
	len;
	constructor(header) {
		if (header.chunkSize < 4) throw new WaveContentError("Invalid fact chunk size.");
		this.len = header.chunkSize;
	}
	get(buf, off) {
		return { dwSampleLength: UINT32_LE.get(buf, off) };
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wav/BwfChunk.js
/**
* Broadcast Audio Extension Chunk
* Ref: https://tech.ebu.ch/docs/tech/tech3285.pdf
*/
var BroadcastAudioExtensionChunk = class {
	len;
	constructor(length) {
		if (length < 348) throw new WaveContentError("BWF extension is shorter than its 348-byte base header");
		this.len = Math.min(length, 422);
	}
	get(uint8array, off) {
		const version = UINT16_LE.get(uint8array, off + 346);
		if (version >= 2 && this.len < 422) throw new WaveContentError("BWF v2 extension is missing loudness fields");
		const result = {
			description: stripNulls(new StringType(256, "ascii").get(uint8array, off)).trim(),
			originator: stripNulls(new StringType(32, "ascii").get(uint8array, off + 256)).trim(),
			originatorReference: stripNulls(new StringType(32, "ascii").get(uint8array, off + 288)).trim(),
			originationDate: stripNulls(new StringType(10, "ascii").get(uint8array, off + 320)).trim(),
			originationTime: stripNulls(new StringType(8, "ascii").get(uint8array, off + 330)).trim(),
			timeReferenceLow: UINT32_LE.get(uint8array, off + 338),
			timeReferenceHigh: UINT32_LE.get(uint8array, off + 342),
			version
		};
		if (version >= 1 && this.len >= 412) result.umid = new Uint8ArrayType(64).get(uint8array, off + 348);
		if (version >= 2) for (const [index, field] of [
			"loudnessValue",
			"loudnessRange",
			"maxTruePeakLevel",
			"maxMomentaryLoudness",
			"maxShortTermLoudness"
		].entries()) {
			const value = INT16_LE.get(uint8array, off + 412 + index * 2);
			if (value >= (field === "loudnessRange" ? 0 : -9999) && value <= 9999) result[field] = value;
		}
		return result;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wav/WaveParser.js
var WaveParser_exports = /* @__PURE__ */ __exportAll({ WaveParser: () => WaveParser });
var debug$1 = (0, import_src.default)("music-metadata:parser:RIFF");
/**
* Resource Interchange File Format (RIFF) Parser
*
* WAVE PCM soundfile format
*
* Ref:
* - http://www.johnloomis.org/cpe102/asgn/asgn1/riff.html
* - http://soundfile.sapp.org/doc/WaveFormat
*
* ToDo: Split WAVE part from RIFF parser
*/
var WaveParser = class extends BasicParser {
	codePage;
	pendingInfoTags = [];
	fact;
	blockAlign = 0;
	avgBytesPerSec = 0;
	async parse() {
		const riffHeader = await this.readToken(Header);
		debug$1(`pos=${this.tokenizer.position}, parse: chunkID=${riffHeader.chunkID}`);
		if (riffHeader.chunkID !== "RIFF") return;
		this.metadata.setAudioOnly();
		await this.parseRiffChunk(riffHeader.chunkSize).catch((err) => {
			if (!(err instanceof EndOfStreamError)) throw err;
		});
		await this.flushInfoTags();
	}
	async parseRiffChunk(chunkSize) {
		const type = await this.readToken(FourCcToken);
		this.metadata.setFormat("container", type);
		switch (type) {
			case "WAVE": return this.readWaveChunk(chunkSize - FourCcToken.len);
			default: throw new WaveContentError(`Unsupported RIFF format: RIFF/${type}`);
		}
	}
	async readWaveChunk(remaining) {
		while (remaining >= Header.len) {
			const header = await this.readToken(Header);
			remaining -= Header.len;
			if (header.chunkSize > remaining) {
				this.metadata.addWarning("Data chunk size exceeds file size");
				if ([
					"CSET",
					"LIST",
					"fact",
					"fmt ",
					"id3 ",
					"ID3 ",
					"bext"
				].includes(header.chunkID)) throw new WaveContentError(`Chunk ${header.chunkID} size ${header.chunkSize} exceeds remaining RIFF data ${remaining}`);
			}
			remaining -= header.chunkSize + (header.chunkSize & 1);
			debug$1(`pos=${this.tokenizer.position}, readChunk: chunkID=RIFF/WAVE/${header.chunkID}`);
			switch (header.chunkID) {
				case "CSET": {
					if (header.chunkSize < 8) throw new WaveContentError("CSET chunk must contain at least 8 bytes");
					const cset = await this.readToken(new Uint8ArrayType(header.chunkSize));
					this.codePage = UINT16_LE.get(cset, 0);
					if (!this.getInfoEncoding()) this.metadata.addWarning(`Unsupported RIFF CSET code page: ${this.codePage}; LIST/INFO tags will be omitted`);
					await this.flushInfoTags();
					break;
				}
				case "LIST":
					await this.parseListTag(header);
					break;
				case "fact":
					this.fact = await this.readToken(new FactChunk(header));
					break;
				case "fmt ": {
					const fmt = await this.readToken(new Format(header));
					let subFormat = WaveFormatNameMap[fmt.wFormatTag];
					if (!subFormat) {
						debug$1(`WAVE/non-PCM format=${fmt.wFormatTag}`);
						subFormat = `non-PCM (${fmt.wFormatTag})`;
					}
					this.metadata.setFormat("codec", subFormat);
					this.metadata.setFormat("lossless", isLosslessWaveFormat(fmt.wFormatTag));
					this.metadata.setFormat("bitsPerSample", getBitsPerSample(fmt));
					this.metadata.setFormat("sampleRate", fmt.nSamplesPerSec);
					this.metadata.setFormat("numberOfChannels", fmt.nChannels);
					this.blockAlign = fmt.nBlockAlign;
					this.avgBytesPerSec = fmt.nAvgBytesPerSec;
					break;
				}
				case "id3 ":
				case "ID3 ":
					await parseEmbeddedID3v2(this.metadata, this.tokenizer, this.options, header.chunkSize);
					break;
				case "data": {
					let chunkSize = header.chunkSize;
					if (this.tokenizer.fileInfo.size) {
						const calcRemaining = this.tokenizer.fileInfo.size - this.tokenizer.position;
						if (calcRemaining < chunkSize) {
							this.metadata.addWarning("data chunk length exceeding file length");
							chunkSize = calcRemaining;
						}
					}
					const numberOfSamples = this.fact ? this.fact.dwSampleLength : chunkSize === 4294967295 ? void 0 : chunkSize / this.blockAlign;
					if (numberOfSamples) {
						this.metadata.setFormat("numberOfSamples", numberOfSamples);
						if (this.metadata.format.sampleRate) this.metadata.setFormat("duration", numberOfSamples / this.metadata.format.sampleRate);
					}
					if (this.avgBytesPerSec > 0) this.metadata.setFormat("bitrate", this.avgBytesPerSec * 8);
					else if (this.metadata.format.duration) this.metadata.setFormat("bitrate", chunkSize * 8 / this.metadata.format.duration);
					await this.tokenizer.ignore(header.chunkSize);
					break;
				}
				case "bext": {
					const token = new BroadcastAudioExtensionChunk(header.chunkSize);
					const bext = await this.readToken(token);
					for (const key of Object.keys(bext)) await this.metadata.addTag("exif", `bext.${key}`, bext[key]);
					const bextRemaining = header.chunkSize - token.len;
					await this.tokenizer.ignore(bextRemaining);
					break;
				}
				case "\0\0\0\0":
					debug$1(`Ignore padding chunk: RIFF/${header.chunkID} of ${header.chunkSize} bytes`);
					this.metadata.addWarning(`Ignore chunk: RIFF/${header.chunkID}`);
					await this.tokenizer.ignore(header.chunkSize);
					break;
				default:
					debug$1(`Ignore chunk: RIFF/${header.chunkID} of ${header.chunkSize} bytes`);
					this.metadata.addWarning(`Ignore chunk: RIFF/${header.chunkID}`);
					await this.tokenizer.ignore(header.chunkSize);
			}
			if (header.chunkSize % 2 === 1) {
				debug$1("Read odd padding byte");
				await this.tokenizer.ignore(1);
			}
		}
	}
	async parseListTag(listHeader) {
		const listType = await this.readToken(new StringType(4, "latin1"));
		debug$1("pos=%s, parseListTag: chunkID=RIFF/WAVE/LIST/%s", this.tokenizer.position, listType);
		switch (listType) {
			case "INFO": return this.parseRiffInfoTags(listHeader.chunkSize - 4);
			default:
				this.metadata.addWarning(`Ignore chunk: RIFF/WAVE/LIST/${listType}`);
				debug$1(`Ignoring chunkID=RIFF/WAVE/LIST/${listType}`);
				return this.tokenizer.ignore(listHeader.chunkSize - 4).then();
		}
	}
	async parseRiffInfoTags(chunkSize) {
		while (chunkSize >= 8) {
			const header = await this.readToken(Header);
			const valueToken = new ListInfoTagValue(header);
			if (this.codePage === void 0 && this.pendingInfoTags.length >= getMaxMetadataEntries(this.options)) throw new WaveContentError("Pending RIFF INFO tag count exceeds entry limit");
			if (valueToken.len > chunkSize - 8) throw new WaveContentError("RIFF INFO tag size exceeds remaining LIST data");
			const bytes = await this.readToken(new Uint8ArrayType(valueToken.len));
			if (this.codePage === void 0) {
				this.metadata.registerTagType("exif");
				this.pendingInfoTags.push({
					header,
					bytes
				});
			} else await this.addInfoTag(header, bytes);
			chunkSize -= 8 + valueToken.len;
		}
		if (chunkSize !== 0) throw new WaveContentError(`Illegal remaining size: ${chunkSize}`);
	}
	async addInfoTag(header, bytes) {
		const encoding = this.getInfoEncoding();
		if (encoding) {
			const value = new ListInfoTagValue(header, encoding).get(bytes, 0);
			await this.metadata.addTag("exif", header.chunkID, value);
		}
	}
	async flushInfoTags() {
		for (const { header, bytes } of this.pendingInfoTags.splice(0)) await this.addInfoTag(header, bytes);
	}
	getInfoEncoding() {
		switch (this.codePage) {
			case void 0:
			case 0:
			case 28591: return "latin1";
			case 1252: return "windows-1252";
			case 65001: return "utf-8";
			default: return;
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wavpack/WavPackToken.js
var SampleRates = [
	6e3,
	8e3,
	9600,
	11025,
	12e3,
	16e3,
	22050,
	24e3,
	32e3,
	44100,
	48e3,
	64e3,
	88200,
	96e3,
	192e3,
	-1
];
/**
* WavPack Block Header
*
* 32-byte little-endian header at the front of every WavPack block
*
* Ref: http://www.wavpack.com/WavPack5FileFormat.pdf (page 2/6: 2.0 "Block Header")
*/
var BlockHeaderToken = {
	len: 32,
	get: (buf, off) => {
		const flags = UINT32_LE.get(buf, off + 24);
		const totalSamples = UINT32_LE.get(buf, off + 12);
		const res = {
			BlockID: FourCcToken.get(buf, off),
			blockSize: UINT32_LE.get(buf, off + 4),
			version: UINT16_LE.get(buf, off + 8),
			totalSamples: totalSamples === 4294967295 ? -1 : totalSamples + buf[off + 11] * 4294967295,
			blockIndex: UINT32_LE.get(buf, off + 16) + buf[off + 10] * 4294967296,
			blockSamples: UINT32_LE.get(buf, off + 20),
			flags: {
				bitsPerSample: (1 + getBitAllignedNumber(flags, 0, 2)) * 8,
				isMono: isBitSet(flags, 2),
				isHybrid: isBitSet(flags, 3),
				isJointStereo: isBitSet(flags, 4),
				crossChannel: isBitSet(flags, 5),
				hybridNoiseShaping: isBitSet(flags, 6),
				floatingPoint: isBitSet(flags, 7),
				samplingRate: SampleRates[getBitAllignedNumber(flags, 23, 4)],
				isDSD: isBitSet(flags, 31),
				isInitialBlock: isBitSet(flags, 11),
				isFinalBlock: isBitSet(flags, 12)
			},
			crc: new Uint8ArrayType(4).get(buf, off + 28)
		};
		if (res.flags.isDSD && res.totalSamples >= 0) res.totalSamples *= 8;
		return res;
	}
};
/**
* 3.0 Metadata Sub-Blocks
* Ref: http://www.wavpack.com/WavPack5FileFormat.pdf (page 4/6: 3.0 "Metadata Sub-Block")
*/
var MetadataIdToken = {
	len: 1,
	get: (buf, off) => {
		return {
			functionId: getBitAllignedNumber(buf[off], 0, 6),
			isOptional: isBitSet(buf[off], 5),
			isOddSize: isBitSet(buf[off], 6),
			largeBlock: isBitSet(buf[off], 7)
		};
	}
};
function isBitSet(flags, bitOffset) {
	return getBitAllignedNumber(flags, bitOffset, 1) === 1;
}
function getBitAllignedNumber(flags, bitOffset, len) {
	return flags >>> bitOffset & 4294967295 >>> 32 - len;
}
//#endregion
//#region node_modules/music-metadata/lib/wavpack/WavPackParser.js
var WavPackParser_exports = /* @__PURE__ */ __exportAll({
	WavPackContentError: () => WavPackContentError,
	WavPackParser: () => WavPackParser
});
var debug = (0, import_src.default)("music-metadata:parser:WavPack");
var WavPackContentError = class extends makeUnexpectedFileContentError("WavPack") {};
/**
* WavPack Parser
*/
var WavPackParser = class extends BasicParser {
	audioDataSize = 0;
	sampleRate = 0;
	dsdMultiplier = 1;
	physicalEof = false;
	async parse() {
		this.metadata.setAudioOnly();
		this.audioDataSize = 0;
		await this.parseWavPackBlocks();
		if (this.physicalEof) return;
		return tryParseApeHeader(this.metadata, this.tokenizer, this.options);
	}
	async parseWavPackBlocks() {
		let totalSamples;
		let sampleExtent = 0;
		let groupIndex;
		let groupSamples = 0;
		let complete = true;
		let isDsd = false;
		const preamble = /* @__PURE__ */ new Uint8Array(4);
		while (true) {
			if (await this.tokenizer.peekBuffer(preamble, { mayBeLess: true }) < 4) {
				this.physicalEof = true;
				break;
			}
			if (FourCcToken.get(preamble, 0) !== "wvpk") break;
			const header = await this.tokenizer.readToken(BlockHeaderToken);
			if (header.BlockID !== "wvpk") throw new WavPackContentError("Invalid WavPack Block-ID");
			debug(`WavPack header blockIndex=${header.blockIndex}, len=${BlockHeaderToken.len}`);
			if (header.blockIndex === 0 && !this.metadata.format.container) {
				this.metadata.setFormat("container", "WavPack");
				this.metadata.setFormat("lossless", !header.flags.isHybrid);
				this.metadata.setFormat("bitsPerSample", header.flags.bitsPerSample);
				this.sampleRate = header.flags.samplingRate;
				isDsd = header.flags.isDSD;
				totalSamples = header.totalSamples > 0 ? header.totalSamples : void 0;
				this.metadata.setFormat("numberOfChannels", header.flags.isMono ? 1 : 2);
				this.metadata.setFormat("codec", header.flags.isDSD ? "DSD" : "PCM");
			}
			const ignoreBytes = header.blockSize - (BlockHeaderToken.len - 8);
			if (ignoreBytes < 0 || this.tokenizer.fileInfo.size !== void 0 && ignoreBytes > this.tokenizer.fileInfo.size - this.tokenizer.position) throw new WavPackContentError("WavPack block exceeds available input");
			if (header.blockIndex === 0) await this.parseMetadataSubBlock(header, ignoreBytes);
			else if (await this.tokenizer.ignore(ignoreBytes) !== ignoreBytes) throw new EndOfStreamError();
			if (header.blockSamples > 0) {
				if (header.flags.isInitialBlock) {
					complete &&= groupIndex === void 0 && header.blockIndex === sampleExtent;
					groupIndex = header.blockIndex;
					groupSamples = header.blockSamples;
				}
				complete &&= groupIndex === header.blockIndex && groupSamples === header.blockSamples && isDsd === header.flags.isDSD;
				if (header.flags.isFinalBlock) {
					sampleExtent = header.blockIndex + header.blockSamples;
					groupIndex = void 0;
				}
				this.audioDataSize += header.blockSize;
			}
		}
		if (totalSamples === void 0 && complete && groupIndex === void 0 && sampleExtent > 0) totalSamples = sampleExtent * (isDsd ? 8 : 1);
		else if (totalSamples === void 0 && (!complete || groupIndex !== void 0)) this.metadata.addWarning("Cannot determine WavPack duration from incomplete or non-contiguous blocks");
		const samplingRate = this.sampleRate * this.dsdMultiplier;
		if (samplingRate > 0 && Number.isSafeInteger(samplingRate)) this.metadata.setFormat("sampleRate", samplingRate);
		if (totalSamples !== void 0) {
			this.metadata.setFormat("numberOfSamples", totalSamples);
			const rate = this.metadata.format.sampleRate;
			if (rate && rate > 0) this.metadata.setFormat("duration", totalSamples / rate);
		}
		if (this.metadata.format.duration) this.metadata.setFormat("bitrate", this.audioDataSize * 8 / this.metadata.format.duration);
	}
	/**
	* Ref: http://www.wavpack.com/WavPack5FileFormat.pdf, 3.0 Metadata Sub-blocks
	* @param header Header
	* @param remainingLength Remaining length
	*/
	async parseMetadataSubBlock(header, remainingLength) {
		let remaining = remainingLength;
		while (remaining > MetadataIdToken.len) {
			const id = await this.tokenizer.readToken(MetadataIdToken);
			const dataSizeInWords = await this.tokenizer.readNumber(id.largeBlock ? UINT24_LE : UINT8);
			const headerSize = MetadataIdToken.len + (id.largeBlock ? UINT24_LE.len : UINT8.len);
			if (dataSizeInWords * 2 > remaining - headerSize) throw new WavPackContentError("Metadata sub-block exceeds its enclosing block");
			const data = await this.readToken(new Uint8ArrayType(dataSizeInWords * 2 - (id.isOddSize ? 1 : 0)));
			debug(`Metadata Sub-Blocks functionId=0x${id.functionId.toString(16)}, id.largeBlock=${id.largeBlock},data-size=${data.length}`);
			switch (id.functionId) {
				case 0: break;
				case 14: {
					debug("ID_DSD_BLOCK");
					if (data.length < 1) throw new WavPackContentError("Truncated WavPack DSD metadata");
					const mp = 2 ** UINT8.get(data, 0);
					this.dsdMultiplier = mp * 8;
					if (!header.flags.isDSD) throw new WavPackContentError("Only expect DSD block if DSD-flag is set");
					break;
				}
				case 39:
					if (data.length < 3) throw new WavPackContentError("Truncated WavPack sample rate");
					this.sampleRate = UINT24_LE.get(data, 0);
					break;
				case 36:
					debug("ID_ALT_TRAILER: trailer for non-wav files");
					break;
				case 38:
					this.metadata.setFormat("audioMD5", data);
					break;
				case 47:
					debug(`ID_BLOCK_CHECKSUM: checksum=${uint8ArrayToHex(data)}`);
					break;
				default: debug(`Ignore unsupported meta-sub-block-id functionId=0x${id.functionId.toString(16)}`);
			}
			remaining -= MetadataIdToken.len + (id.largeBlock ? UINT24_LE.len : UINT8.len) + dataSizeInWords * 2;
			debug(`remainingLength=${remaining}`);
			if (id.isOddSize) await this.tokenizer.ignore(1);
		}
		if (remaining !== 0) throw new WavPackContentError("metadata-sub-block should fit it remaining length");
	}
};
//#endregion
export { lib_exports as t };
