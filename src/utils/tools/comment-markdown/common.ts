import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import Token from "markdown-it/lib/token.mjs";

interface LinkData {
	href: string;
	text: string;
}

interface TextReplacement {
	end: number;
	tokens: Token[];
}

function getEnvValue(env: unknown, key: string) {
	if (!env || typeof env !== "object") {
		return;
	}

	const value: unknown = Reflect.get(env, key);
	return value;
}

function getStringEnvValue(env: unknown, key: string) {
	const value = getEnvValue(env, key);
	return typeof value === "string" ? value : undefined;
}

function getBooleanEnvValue(env: unknown, key: string) {
	const value = getEnvValue(env, key);
	return typeof value === "boolean" ? value : undefined;
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function isWhitespace(value: string | undefined) {
	return value === undefined || /\s/.test(value);
}

function hasTextBoundaryBefore(src: string, pos: number) {
	if (pos === 0) {
		return true;
	}

	const previous = src[pos - 1];
	return (
		isWhitespace(previous) ||
		(previous !== undefined && "([{\"'".includes(previous))
	);
}

function hasTextBoundaryAfter(src: string, pos: number) {
	const next = src[pos];
	return (
		next === undefined || isWhitespace(next) || ".,;:!?)]}\"'".includes(next)
	);
}

function readWhile(
	src: string,
	pos: number,
	isAllowedCharacter: (char: string) => boolean,
) {
	let end = pos;

	while (end < src.length && isAllowedCharacter(src[end] ?? "")) {
		end += 1;
	}

	return src.slice(pos, end);
}

function makeTextToken(content: string, referenceToken: Token) {
	const token = new Token("text", "", 0);
	token.content = content;
	token.level = referenceToken.level;

	return token;
}

function makeLinkTokens({ href, text }: LinkData, referenceToken: Token) {
	const linkOpen = new Token("link_open", "a", 1);
	linkOpen.attrSet("href", href);
	linkOpen.attrSet("target", "_blank");
	linkOpen.level = referenceToken.level;

	const label = new Token("text", "", 0);
	label.content = text;
	label.level = referenceToken.level + 1;

	const linkClose = new Token("link_close", "a", -1);
	linkClose.level = referenceToken.level;

	return [linkOpen, label, linkClose];
}

function mergeAdjacentTextTokens(tokens: Token[]) {
	const nextTokens: Token[] = [];

	for (const token of tokens) {
		const previous = nextTokens.at(-1);

		if (previous?.type === "text" && token.type === "text") {
			previous.content += token.content;
			continue;
		}

		nextTokens.push(token);
	}

	tokens.splice(0, tokens.length, ...nextTokens);
}

function splitTextToken(
	token: Token,
	getReplacement: (src: string, pos: number) => TextReplacement | undefined,
) {
	const nextTokens: Token[] = [];
	let cursor = 0;

	while (cursor < token.content.length) {
		let replacementStart = -1;
		let replacement: TextReplacement | undefined;

		for (let pos = cursor; pos < token.content.length; pos += 1) {
			replacement = getReplacement(token.content, pos);

			if (replacement) {
				replacementStart = pos;
				break;
			}
		}

		if (!replacement || replacementStart === -1) {
			nextTokens.push(makeTextToken(token.content.slice(cursor), token));
			break;
		}

		if (replacementStart > cursor) {
			nextTokens.push(
				makeTextToken(token.content.slice(cursor, replacementStart), token),
			);
		}

		nextTokens.push(...replacement.tokens);
		cursor = replacement.end;
	}

	return nextTokens;
}

function replaceTextTokens(
	state: StateInline,
	getReplacement: (
		src: string,
		pos: number,
		referenceToken: Token,
	) => TextReplacement | undefined,
) {
	const nextTokens: Token[] = [];
	let linkLevel = 0;

	for (const token of state.tokens) {
		if (token.type === "link_open") {
			linkLevel += 1;
			nextTokens.push(token);
			continue;
		}

		if (token.type === "link_close") {
			linkLevel = Math.max(0, linkLevel - 1);
			nextTokens.push(token);
			continue;
		}

		if (token.type !== "text" || linkLevel > 0) {
			nextTokens.push(token);
			continue;
		}

		nextTokens.push(
			...splitTextToken(token, (src, pos) => getReplacement(src, pos, token)),
		);
	}

	state.tokens.splice(0, state.tokens.length, ...nextTokens);
}

export {
	escapeHtml,
	getBooleanEnvValue,
	getEnvValue,
	getStringEnvValue,
	hasTextBoundaryAfter,
	hasTextBoundaryBefore,
	isWhitespace,
	makeLinkTokens,
	mergeAdjacentTextTokens,
	readWhile,
	replaceTextTokens,
};
export type { LinkData, TextReplacement };
