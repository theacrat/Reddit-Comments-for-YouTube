import Token from "markdown-it/lib/token.mjs";

import { escapeHtml, getEnvValue } from "./common";

interface MediaEntry {
	previews: MediaPreview[];
	source?: {
		gif?: string;
		height: number;
		url?: string;
		width: number;
	};
	type: string;
}

interface MediaPreview {
	height: number;
	url: string;
	width: number;
}

interface RedditMediaHtml {
	href: string;
	imageHtml: string;
}

function decodeHtmlUrl(value: string) {
	return value
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", '"');
}

function normaliseUrl(value: string) {
	return decodeHtmlUrl(value.trim());
}

function decodeUrlComponent(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function getMediaIdFromUrl(value: string) {
	try {
		const url = new URL(normaliseUrl(value));
		const filename = url.pathname.split("/").at(-1) ?? "";

		return filename.replace(/\.[^.]+$/, "") || undefined;
	} catch {
		return;
	}
}

function getMediaPreview(value: unknown): MediaPreview | undefined {
	if (!value || typeof value !== "object") {
		return;
	}

	const url = getEnvValue(value, "u");
	const width = getEnvValue(value, "x");
	const height = getEnvValue(value, "y");

	if (
		typeof url !== "string" ||
		typeof width !== "number" ||
		typeof height !== "number"
	) {
		return;
	}

	return {
		height,
		url,
		width,
	};
}

function getMediaPreviews(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((preview) => {
		const mediaPreview = getMediaPreview(preview);
		return mediaPreview ? [mediaPreview] : [];
	});
}

function getMediaEntry(value: unknown): MediaEntry | undefined {
	if (!value || typeof value !== "object") {
		return;
	}

	const entryType = getEnvValue(value, "e");
	const previews = getMediaPreviews(getEnvValue(value, "p"));
	const source = getEnvValue(value, "s");

	if (typeof entryType !== "string") {
		return;
	}

	if (!source || typeof source !== "object") {
		return { previews, type: entryType };
	}

	const gif = getEnvValue(source, "gif");
	const url = getEnvValue(source, "u");
	const width = getEnvValue(source, "x");
	const height = getEnvValue(source, "y");

	if (typeof width !== "number" || typeof height !== "number") {
		return { previews, type: entryType };
	}

	const mediaSource: MediaEntry["source"] = {
		height,
		width,
	};

	if (typeof gif === "string") {
		mediaSource.gif = gif;
	}

	if (typeof url === "string") {
		mediaSource.url = url;
	}

	return {
		previews,
		source: mediaSource,
		type: entryType,
	};
}

function getMediaSource(media: MediaEntry) {
	return (media.type === "Image" ? media.source?.url : media.source?.gif) ?? "";
}

function doUrlsMatch(first: string, second: string) {
	return normaliseUrl(first) === normaliseUrl(second);
}

function findMediaEntry(media: unknown, src: string): MediaEntry | undefined {
	if (!media || typeof media !== "object") {
		return;
	}

	const srcId = getMediaIdFromUrl(src);
	const directEntry = getMediaEntry(getEnvValue(media, srcId ?? src));

	if (directEntry) {
		return directEntry;
	}

	for (const key of Object.keys(media)) {
		const entry = getMediaEntry(getEnvValue(media, key));

		if (entry && (key === srcId || doUrlsMatch(getMediaSource(entry), src))) {
			return entry;
		}
	}

	return undefined;
}

function getRedditMediaSrcSet(entry: MediaEntry) {
	if (entry.type !== "Image") {
		return "";
	}

	const oneX = entry.previews.find((preview) => preview.width === 320);
	const twoX = entry.previews.find((preview) => preview.width === 640);

	if (!oneX || !twoX) {
		return "";
	}

	return `${escapeHtml(normaliseUrl(oneX.url))} 1x, ${escapeHtml(normaliseUrl(twoX.url))} 2x`;
}

function renderRedditMediaImage(
	entry: MediaEntry,
): RedditMediaHtml | undefined {
	if (!entry.source) {
		return;
	}

	const mediaSource = normaliseUrl(getMediaSource(entry));

	if (!mediaSource) {
		return;
	}
	const srcSet = getRedditMediaSrcSet(entry);
	const srcSetHtml = srcSet ? ` srcset="${srcSet}"` : "";

	return {
		href: mediaSource,
		imageHtml: `<img src="${escapeHtml(mediaSource)}" alt="Comment Image" ${srcSetHtml} sizes="(min-width: 1415px) 750px, (min-width: 768px) 50vw, 100vw" loading="lazy">`,
	};
}

function getRedditMediaFromSrc(src: string, env: unknown) {
	const media = getEnvValue(env, "media");

	if (!media) {
		return;
	}

	const entry = findMediaEntry(media, src);

	if (!entry?.source) {
		return;
	}

	return renderRedditMediaImage(entry);
}

function getRedditMedia(token: Token | undefined, env: unknown) {
	if (!token) {
		return;
	}

	const src = decodeUrlComponent(token.attrGet("src") ?? "");
	const alt = token.content;

	if (alt === "gif" && src.startsWith("giphy|")) {
		const giphyId = src.slice("giphy|".length);
		const giphySrc = `https://i.giphy.com/${giphyId}.gif`;

		return {
			href: `https://giphy.com/gifs/${giphyId}`,
			imageHtml: `<img src="${escapeHtml(giphySrc)}" alt="Comment Image" loading="lazy">`,
		};
	}

	return getRedditMediaFromSrc(src, env);
}

function replaceRedditMediaLinks(tokens: Token[], env: unknown) {
	for (const token of tokens) {
		if (token.type !== "inline" || !token.children) {
			continue;
		}

		const nextChildren: Token[] = [];

		for (let index = 0; index < token.children.length; index += 1) {
			const linkOpen = token.children[index];
			const text = token.children[index + 1];
			const linkClose = token.children[index + 2];

			if (
				linkOpen?.type === "link_open" &&
				text?.type === "text" &&
				linkClose?.type === "link_close"
			) {
				const href = linkOpen.attrGet("href") ?? "";
				const media = getRedditMediaFromSrc(href, env);

				if (media && doUrlsMatch(href, text.content)) {
					const mediaToken = new Token("html_inline", "", 0);
					mediaToken.content = media.imageHtml;
					mediaToken.level = linkOpen.level;
					linkOpen.attrSet("href", media.href);
					nextChildren.push(linkOpen);
					nextChildren.push(mediaToken);
					nextChildren.push(linkClose);
					index += 2;
					continue;
				}
			}

			const child = token.children[index];

			if (child) {
				nextChildren.push(child);
			}
		}

		token.children.splice(0, token.children.length, ...nextChildren);
	}
}

export { getRedditMedia, replaceRedditMediaLinks };
export type { RedditMediaHtml };
