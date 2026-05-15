import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

import { REDDIT_LINK_DOMAIN } from "@/utils/constants";
import type { RedditMedia } from "@/utils/types/api-reponses";

import { getBooleanEnvValue } from "./comment-markdown/common";
import { lemmyMarkdownPlugin } from "./comment-markdown/lemmy";
import { redditMarkdownPlugin } from "./comment-markdown/reddit";
import {
	getRedditMedia,
	replaceRedditMediaLinks,
} from "./comment-markdown/reddit-media";
import type { RedditMediaHtml } from "./comment-markdown/reddit-media";
import { renderTimestampToken } from "./comment-markdown/timestamp";
import { buildLemmyUrl } from "./request-tools";

interface RenderLinkedHtmlParams {
	env: unknown;
	media: RedditMediaHtml;
	options: Parameters<MarkdownIt["renderer"]["render"]>[1];
	parser: MarkdownIt;
}

function renderLinkedHtml({
	env,
	media,
	options,
	parser,
}: RenderLinkedHtmlParams) {
	const linkOpen = new Token("link_open", "a", 1);
	linkOpen.attrSet("href", media.href);

	const html = new Token("html_inline", "", 0);
	html.content = media.imageHtml;

	const linkClose = new Token("link_close", "a", -1);

	return parser.renderer.render([linkOpen, html, linkClose], options, env);
}

function createParser() {
	const parser = new MarkdownIt({
		breaks: false,
		html: false,
		linkify: true,
	});

	const defaultLinkOpen =
		parser.renderer.rules["link_open"] ??
		((tokens, index, options, _env, self) =>
			self.renderToken(tokens, index, options));
	const defaultImage =
		parser.renderer.rules.image ??
		((tokens, index, options, _env, self) =>
			self.renderToken(tokens, index, options));

	parser.renderer.rules["link_open"] = (tokens, index, options, env, self) => {
		const token = tokens[index];
		const isReddit = getBooleanEnvValue(env, "reddit");
		const href = token?.attrGet("href");

		if (token && isReddit && href?.startsWith("/")) {
			token.attrSet("href", `${REDDIT_LINK_DOMAIN}${href}`);
		}

		token?.attrSet("target", "_blank");
		return defaultLinkOpen(tokens, index, options, env, self);
	};

	parser.renderer.rules.image = (tokens, index, options, env, self) => {
		const media = getRedditMedia(tokens[index], env);

		if (media) {
			return renderLinkedHtml({ env, media, options, parser });
		}

		const html = defaultImage(tokens, index, options, env, self);

		return html;
	};

	parser.renderer.rules["comment_timestamp"] = (tokens, index) =>
		renderTimestampToken(tokens[index]);

	parser.core.ruler.after("inline", "reddit_media_links", (state) => {
		if (getBooleanEnvValue(state.env, "reddit")) {
			replaceRedditMediaLinks(state.tokens, state.env);
		}
	});

	return parser;
}

function normaliseRedditMarkdown(content: string) {
	return content.replaceAll("&gt;", ">").replaceAll("&lt;", "<");
}

const redditParser = createParser().use(redditMarkdownPlugin);
const lemmyParser = createParser().use(lemmyMarkdownPlugin);

interface RedditCommentParserParams {
	content: string;
	media: RedditMedia;
}

function redditCommentParser({ content, media }: RedditCommentParserParams) {
	const html = redditParser.render(
		normaliseRedditMarkdown(content).replaceAll("] (http", "](http"),
		{
			media,
			reddit: true,
		},
	);

	return html;
}

async function lemmyCommentParser(content: string) {
	const lemmyUrl = await buildLemmyUrl({ endpoint: "" });
	const lemmyDomain = lemmyUrl.endsWith("/") ? lemmyUrl.slice(0, -1) : lemmyUrl;

	return lemmyParser.render(content.replaceAll("] (http", "](http"), {
		lemmyDomain,
	});
}

export { lemmyCommentParser, redditCommentParser };
