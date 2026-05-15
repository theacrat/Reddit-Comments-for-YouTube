import Token from "markdown-it/lib/token.mjs";

import { parseTimestamp } from "@/utils/tools/time-tools";

import {
	escapeHtml,
	getEnvValue,
	hasTextBoundaryAfter,
	hasTextBoundaryBefore,
	readWhile,
} from "./common";

interface TimestampData {
	seconds: number;
	text: string;
}

function getTokenSeconds(token: Token | undefined) {
	const meta: unknown = token?.meta;

	if (!meta || typeof meta !== "object") {
		return 0;
	}

	const seconds = getEnvValue(meta, "seconds");
	return typeof seconds === "number" ? seconds : 0;
}

function makeTimestampToken(
	{ seconds, text }: TimestampData,
	referenceToken: Token,
) {
	const token = new Token("comment_timestamp", "button", 0);

	token.content = text;
	token.level = referenceToken.level;
	token.meta = { seconds };

	return token;
}

function readColonTimestamp(src: string, pos: number) {
	const first = readWhile(src, pos, (char) => /\d/.test(char));

	if (!first || src[pos + first.length] !== ":") {
		return;
	}

	let end = pos + first.length;
	let sectionCount = 1;

	while (src[end] === ":" && sectionCount < 3) {
		const section = readWhile(src, end + 1, (char) => /\d/.test(char));

		if (section.length !== 2 || Number(section) > 59) {
			return;
		}

		end += 1 + section.length;
		sectionCount += 1;
	}

	if (sectionCount < 2 || src[end] === ":") {
		return;
	}

	return src.slice(pos, end);
}

function readUnitTimestamp(src: string, pos: number) {
	let end = pos;
	let foundUnit = false;

	while (end < src.length) {
		const digits = readWhile(src, end, (char) => /\d/.test(char));

		if (!digits) {
			break;
		}

		const unit = src[end + digits.length];

		if (unit !== "h" && unit !== "m" && unit !== "s") {
			break;
		}

		foundUnit = true;
		end += digits.length + 1;
	}

	return foundUnit ? src.slice(pos, end) : undefined;
}

function parseTimestampToken(
	src: string,
	pos: number,
): TimestampData | undefined {
	if (!hasTextBoundaryBefore(src, pos) || !/\d/.test(src[pos] ?? "")) {
		return undefined;
	}

	const text = readColonTimestamp(src, pos) ?? readUnitTimestamp(src, pos);

	if (!text || !hasTextBoundaryAfter(src, pos + text.length)) {
		return undefined;
	}

	try {
		return {
			seconds: parseTimestamp(text),
			text,
		};
	} catch {
		return undefined;
	}
}

function renderTimestampToken(token: Token | undefined) {
	const text = token?.content ?? "";
	const seconds = getTokenSeconds(token);

	return `<button type="button" data-timestamp-seconds="${seconds}">[${escapeHtml(text)}]</button>`;
}

export { makeTimestampToken, parseTimestampToken, renderTimestampToken };
