import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import type Token from "markdown-it/lib/token.mjs";

import { REDDIT_LINK_DOMAIN } from "@/utils/constants";

import type { LinkData, TextReplacement } from "./common";
import {
	hasTextBoundaryAfter,
	hasTextBoundaryBefore,
	isWhitespace,
	makeLinkTokens,
	mergeAdjacentTextTokens,
	readWhile,
	replaceTextTokens,
} from "./common";
import {
	makeTimestampToken,
	parseTimestampToken,
	renderTimestampToken,
} from "./timestamp";

function parseRedditAutolink(src: string, pos: number): LinkData | undefined {
	if (!hasTextBoundaryBefore(src, pos)) {
		return undefined;
	}

	const startsWithSlash = src[pos] === "/";
	const prefixPos = startsWithSlash ? pos + 1 : pos;
	const prefix = src.slice(prefixPos, prefixPos + 2).toLowerCase();

	if (prefix !== "r/" && prefix !== "u/") {
		return undefined;
	}

	const namePos = prefixPos + 2;
	const name = readWhile(src, namePos, (char) => /[\w-]/.test(char));

	if (!name || !hasTextBoundaryAfter(src, namePos + name.length)) {
		return undefined;
	}

	const text = src.slice(pos, namePos + name.length);
	const path = prefix.startsWith("r") ? "r" : "u";

	return {
		href: `${REDDIT_LINK_DOMAIN}/${path}/${name}`,
		text,
	};
}

function findClosingSpoiler(src: string, pos: number) {
	let cursor = pos + 2;

	while (cursor < src.length) {
		const close = src.indexOf("!<", cursor);

		if (close === -1) {
			return -1;
		}

		if (src[close - 1] !== "\\") {
			return close;
		}

		cursor = close + 2;
	}

	return -1;
}

function spoilerRule(state: StateInline, silent: boolean) {
	if (state.src.slice(state.pos, state.pos + 2) !== ">!") {
		return false;
	}

	const close = findClosingSpoiler(state.src, state.pos);

	if (close === -1) {
		return false;
	}

	if (!silent) {
		const token = state.push("reddit_spoiler", "span", 0);
		token.content = state.src.slice(state.pos + 2, close);
	}

	state.pos = close + 2;
	return true;
}

function lineStartSpoilerRule(
	state: StateBlock,
	startLine: number,
	_endLine: number,
	silent: boolean,
) {
	const pos = (state.bMarks[startLine] ?? 0) + (state.tShift[startLine] ?? 0);
	const max = state.eMarks[startLine] ?? pos;

	if (
		state.src.slice(pos, pos + 2) !== ">!" ||
		findClosingSpoiler(state.src.slice(pos, max), 0) === -1
	) {
		return false;
	}

	if (silent) {
		return true;
	}

	const paragraphOpen = state.push("paragraph_open", "p", 1);
	paragraphOpen.map = [startLine, startLine + 1];

	const inline = state.push("inline", "", 0);
	inline.content = state.src.slice(pos, max);
	inline.map = [startLine, startLine + 1];
	inline.children = [];

	state.push("paragraph_close", "p", -1);

	state.line = startLine + 1;
	return true;
}

function findClosingParen(src: string, pos: number) {
	let depth = 0;

	for (let index = pos; index < src.length; index += 1) {
		const char = src[index];

		if (char === "\\" && index + 1 < src.length) {
			index += 1;
			continue;
		}

		if (char === "(") {
			depth += 1;
		} else if (char === ")") {
			depth -= 1;

			if (depth === 0) {
				return index;
			}
		}
	}

	return -1;
}

function readSuperscriptContent(src: string, pos: number) {
	let markerCount = 0;

	while (src[pos + markerCount] === "^") {
		markerCount += 1;
	}

	const contentPos = pos + markerCount;

	if (markerCount === 0 || isWhitespace(src[contentPos])) {
		return;
	}

	if (src[contentPos] === "(") {
		const close = findClosingParen(src, contentPos);

		if (close === -1) {
			return;
		}

		return {
			content: src.slice(contentPos + 1, close),
			end: close + 1,
			level: markerCount,
		};
	}

	const content = readWhile(src, contentPos, (char) => !isWhitespace(char));

	if (!content) {
		return;
	}

	return {
		content,
		end: contentPos + content.length,
		level: markerCount,
	};
}

function superscriptRule(state: StateInline, silent: boolean) {
	if (state.src[state.pos] !== "^") {
		return false;
	}

	const superscript = readSuperscriptContent(state.src, state.pos);

	if (!superscript) {
		return false;
	}

	if (!silent) {
		for (let index = 0; index < superscript.level; index += 1) {
			state.push("sup_open", "sup", 1);
		}

		state.md.inline.parse(
			superscript.content,
			state.md,
			state.env,
			state.tokens,
		);

		for (let index = 0; index < superscript.level; index += 1) {
			state.push("sup_close", "sup", -1);
		}
	}

	state.pos = superscript.end;
	return true;
}

function getRedditTextReplacement(
	src: string,
	pos: number,
	referenceToken: Token,
): TextReplacement | undefined {
	const link = parseRedditAutolink(src, pos);

	if (link) {
		return {
			end: pos + link.text.length,
			tokens: makeLinkTokens(link, referenceToken),
		};
	}

	const timestamp = parseTimestampToken(src, pos);

	if (timestamp) {
		return {
			end: pos + timestamp.text.length,
			tokens: [makeTimestampToken(timestamp, referenceToken)],
		};
	}

	return undefined;
}

function redditTextPostProcess(state: StateInline) {
	mergeAdjacentTextTokens(state.tokens);
	replaceTextTokens(state, getRedditTextReplacement);
	return false;
}

function redditMarkdownPlugin(md: MarkdownIt) {
	md.block.ruler.before(
		"blockquote",
		"reddit_line_start_spoiler",
		lineStartSpoilerRule,
	);
	md.inline.ruler.before("text", "reddit_spoiler", spoilerRule);
	md.inline.ruler.before("text", "reddit_superscript", superscriptRule);
	md.inline.ruler2.after(
		"fragments_join",
		"reddit_text",
		redditTextPostProcess,
	);

	md.renderer.rules["reddit_spoiler"] = (tokens, index, _options, env) => {
		const content = tokens[index]?.content ?? "";
		const renderedContent = md.renderInline(content, env);

		return `<button type="button" data-reddit-spoiler-button><span>${renderedContent}</span></button>`;
	};

	md.renderer.rules["comment_timestamp"] = (tokens, index) =>
		renderTimestampToken(tokens[index]);
}

export { redditMarkdownPlugin };
