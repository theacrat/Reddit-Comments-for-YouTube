import type MarkdownIt from "markdown-it";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import type Token from "markdown-it/lib/token.mjs";

import type { LinkData, TextReplacement } from "./common";
import {
	getStringEnvValue,
	hasTextBoundaryAfter,
	hasTextBoundaryBefore,
	makeLinkTokens,
	mergeAdjacentTextTokens,
	readWhile,
	replaceTextTokens,
} from "./common";
import { makeTimestampToken, parseTimestampToken } from "./timestamp";

function parseLemmyMention(
	src: string,
	pos: number,
	lemmyDomain: string,
): LinkData | undefined {
	if (!hasTextBoundaryBefore(src, pos)) {
		return undefined;
	}

	const marker = src[pos];

	if (marker !== "!" && marker !== "@") {
		return undefined;
	}

	const name = readWhile(src, pos + 1, (char) => /[\w.@-]/.test(char));
	const atIndex = name.indexOf("@");

	if (
		atIndex <= 0 ||
		atIndex === name.length - 1 ||
		!name.slice(atIndex + 1).includes(".") ||
		!hasTextBoundaryAfter(src, pos + 1 + name.length)
	) {
		return undefined;
	}

	const endpoint = `${marker === "!" ? "c" : "u"}/${name}`;

	return {
		href: `${lemmyDomain}/${endpoint}`,
		text: `${marker}${name}`,
	};
}

interface LemmyTextReplacementParams {
	lemmyDomain: string;
	referenceToken: Token;
	src: string;
	pos: number;
}

function getLemmyTextReplacement({
	lemmyDomain,
	pos,
	referenceToken,
	src,
}: LemmyTextReplacementParams): TextReplacement | undefined {
	const link = parseLemmyMention(src, pos, lemmyDomain);

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

function lemmyTextPostProcess(state: StateInline) {
	const lemmyDomain = getStringEnvValue(state.env, "lemmyDomain");

	if (!lemmyDomain) {
		return false;
	}

	mergeAdjacentTextTokens(state.tokens);
	replaceTextTokens(state, (src, pos, token) =>
		getLemmyTextReplacement({
			lemmyDomain,
			pos,
			referenceToken: token,
			src,
		}),
	);

	return false;
}

function lemmyMarkdownPlugin(md: MarkdownIt) {
	md.inline.ruler2.after("fragments_join", "lemmy_text", lemmyTextPostProcess);
}

export { lemmyMarkdownPlugin };
