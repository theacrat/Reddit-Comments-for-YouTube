import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	lemmyCommentParser,
	redditCommentParser,
} from "@/utils/tools/comment-tools";
import { buildLemmyUrl } from "@/utils/tools/request-tools";
import type { RedditMedia } from "@/utils/types/api-reponses";

vi.mock("@/utils/tools/request-tools", () => ({
	buildLemmyUrl: vi.fn(),
}));

function renderRedditComment(content: string, media: RedditMedia = {}) {
	return redditCommentParser({ content, media });
}

function mockBuildLemmyUrl(value: string) {
	vi.mocked(buildLemmyUrl).mockResolvedValue(value);
}

async function renderLemmyComment(content: string) {
	return lemmyCommentParser(content);
}

function getRedditImageMedia() {
	return {
		image123: {
			e: "Image",
			p: [
				{
					u: "https://preview.redd.it/image123.png?width=320&amp;auto=webp",
					x: 320,
					y: 180,
				},
				{
					u: "https://preview.redd.it/image123.png?width=640&amp;auto=webp",
					x: 640,
					y: 360,
				},
			],
			s: {
				u: "https://preview.redd.it/image123.png?width=1200&amp;format=png",
				x: 1200,
				y: 675,
			},
		},
	} satisfies RedditMedia;
}

function getRedditAnimatedMedia() {
	return {
		animation123: {
			e: "AnimatedImage",
			p: [],
			s: {
				gif: "https://i.redd.it/animation123.gif",
				x: 480,
				y: 270,
			},
		},
	} satisfies RedditMedia;
}

beforeEach(() => {
	mockBuildLemmyUrl("https://lemmy.example/");
});

describe("redditCommentParser Reddit spoiler markdown", () => {
	it("renders escaped Reddit spoiler delimiters from API bodies", () => {
		const html = renderRedditComment("Careful &gt;!hidden text!&lt;");

		expect(html).toContain("Careful ");
		expect(html).toContain(
			'<button type="button" data-reddit-spoiler-button><span>hidden text</span></button>',
		);
	});

	it("renders a spoiler at the beginning of a line as a paragraph, not a blockquote", () => {
		const html = renderRedditComment("&gt;!hidden line!&lt;");

		expect(html).toBe(
			'<p><button type="button" data-reddit-spoiler-button><span>hidden line</span></button></p>\n',
		);
	});

	it("leaves an escaped spoiler opener as literal text", () => {
		const html = renderRedditComment(String.raw`\&gt;!visible text!&lt;`);

		expect(html).toBe("<p>&gt;!visible text!&lt;</p>\n");
	});
});

describe("redditCommentParser Reddit superscript markdown", () => {
	it("renders caret-prefixed text as superscript through the next whitespace", () => {
		const html = renderRedditComment("mass^2 wins");

		expect(html).toBe("<p>mass<sup>2</sup> wins</p>\n");
	});

	it("renders parenthesized superscript content with spaces", () => {
		const html = renderRedditComment("a^(whole phrase) example");

		expect(html).toBe("<p>a<sup>whole phrase</sup> example</p>\n");
	});

	it("renders repeated carets as nested superscript levels", () => {
		const html = renderRedditComment("tiny ^^^^word");

		expect(html).toBe(
			"<p>tiny <sup><sup><sup><sup>word</sup></sup></sup></sup></p>\n",
		);
	});

	it("leaves a caret followed by whitespace as literal text", () => {
		const html = renderRedditComment("not ^ superscript");

		expect(html).toBe("<p>not ^ superscript</p>\n");
	});
});

describe("redditCommentParser Reddit shortcut links", () => {
	it("links subreddit shortcuts with and without a leading slash", () => {
		const html = renderRedditComment("/r/typescript and r/reactjs");

		expect(html).toContain(
			'<a href="https://www.reddit.com/r/typescript" target="_blank">/r/typescript</a>',
		);
		expect(html).toContain(
			'<a href="https://www.reddit.com/r/reactjs" target="_blank">r/reactjs</a>',
		);
	});

	it("links user shortcuts with and without a leading slash", () => {
		const html = renderRedditComment("/u/example-user and u/example");

		expect(html).toContain(
			'<a href="https://www.reddit.com/u/example-user" target="_blank">/u/example-user</a>',
		);
		expect(html).toContain(
			'<a href="https://www.reddit.com/u/example" target="_blank">u/example</a>',
		);
	});

	it("links subreddit shortcuts that contain underscores", () => {
		const html = renderRedditComment("/r/react_native and r/test_sub");

		expect(html).toContain(
			'<a href="https://www.reddit.com/r/react_native" target="_blank">/r/react_native</a>',
		);
		expect(html).toContain(
			'<a href="https://www.reddit.com/r/test_sub" target="_blank">r/test_sub</a>',
		);
	});

	it("links user shortcuts that contain underscores", () => {
		const html = renderRedditComment("/u/example_user and u/name_with_under");

		expect(html).toContain(
			'<a href="https://www.reddit.com/u/example_user" target="_blank">/u/example_user</a>',
		);
		expect(html).toContain(
			'<a href="https://www.reddit.com/u/name_with_under" target="_blank">u/name_with_under</a>',
		);
	});

	it("does not link shortcuts embedded in another word", () => {
		const html = renderRedditComment("prefixr/test suffixu/person");

		expect(html).toBe("<p>prefixr/test suffixu/person</p>\n");
	});

	it("does not rewrite shortcut text inside an existing markdown link", () => {
		const html = renderRedditComment("[r/test](https://example.com)");

		expect(html).toBe(
			'<p><a href="https://example.com" target="_blank">r/test</a></p>\n',
		);
	});

	it("does not rewrite underscore shortcut text inside an existing markdown link", () => {
		const html = renderRedditComment("[u/example_user](https://example.com)");

		expect(html).toBe(
			'<p><a href="https://example.com" target="_blank">u/example_user</a></p>\n',
		);
	});
});

describe("redditCommentParser Reddit renderer fixes", () => {
	it("prefixes Reddit-relative markdown link hrefs", () => {
		const html = renderRedditComment(
			"[comment](/r/test/comments/abc/title/def/)",
		);

		expect(html).toBe(
			'<p><a href="https://www.reddit.com/r/test/comments/abc/title/def/" target="_blank">comment</a></p>\n',
		);
	});

	it("repairs Reddit API markdown links that contain a space before the URL", () => {
		const html = renderRedditComment("[site] (https://example.com)");

		expect(html).toBe(
			'<p><a href="https://example.com" target="_blank">site</a></p>\n',
		);
	});

	it("renders emphasis before applying Reddit text replacements", () => {
		const html = renderRedditComment("*important* r/test");

		expect(html).toContain("<em>important</em>");
		expect(html).toContain(
			'<a href="https://www.reddit.com/r/test" target="_blank">r/test</a>',
		);
	});

	it("renders recognized timestamps as seek buttons", () => {
		const html = renderRedditComment("watch 1:02 or 2m03s");

		expect(html).toContain(
			'<button type="button" data-timestamp-seconds="62">[1:02]</button>',
		);
		expect(html).toContain(
			'<button type="button" data-timestamp-seconds="123">[2m03s]</button>',
		);
	});
});

describe("redditCommentParser Reddit media markdown", () => {
	it("renders Reddit's Giphy image markdown as a linked gif image", () => {
		const html = renderRedditComment("![gif](giphy|abc123)");

		expect(html).toBe(
			'<p><a href="https://giphy.com/gifs/abc123" target="_blank"><img src="https://i.giphy.com/abc123.gif" alt="Comment Image" loading="lazy"></a></p>\n',
		);
	});

	it("renders a bare Reddit image URL from matching media metadata", () => {
		const html = renderRedditComment(
			"https://preview.redd.it/image123.png?width=1200&amp;format=png",
			getRedditImageMedia(),
		);

		expect(html).toContain(
			'<a href="https://preview.redd.it/image123.png?width=1200&amp;format=png" target="_blank">',
		);
		expect(html).toContain(
			'<img src="https://preview.redd.it/image123.png?width=1200&amp;format=png" alt="Comment Image"',
		);
		expect(html).toContain(
			'srcset="https://preview.redd.it/image123.png?width=320&amp;auto=webp 1x, https://preview.redd.it/image123.png?width=640&amp;auto=webp 2x"',
		);
	});

	it("renders a bare Reddit animated image URL from its gif media source", () => {
		const html = renderRedditComment(
			"https://i.redd.it/animation123.gif",
			getRedditAnimatedMedia(),
		);

		expect(html).toContain(
			'<a href="https://i.redd.it/animation123.gif" target="_blank">',
		);
		expect(html).toContain(
			'<img src="https://i.redd.it/animation123.gif" alt="Comment Image"',
		);
		expect(html).not.toContain("srcset=");
	});
});

describe("lemmyCommentParser Lemmy mentions", () => {
	it("links Lemmy community mentions to the configured instance", async () => {
		const html = await renderLemmyComment("Join !frontend@programming.dev");

		expect(html).toBe(
			'<p>Join <a href="https://lemmy.example/c/frontend@programming.dev" target="_blank">!frontend@programming.dev</a></p>\n',
		);
	});

	it("links Lemmy user mentions to the configured instance", async () => {
		const html = await renderLemmyComment("Ask @ada-lovelace@example.org");

		expect(html).toBe(
			'<p>Ask <a href="https://lemmy.example/u/ada-lovelace@example.org" target="_blank">@ada-lovelace@example.org</a></p>\n',
		);
	});

	it("links Lemmy mentions that contain underscores", async () => {
		const html = await renderLemmyComment(
			"See @example_user@example.org and !test_group@example.org",
		);

		expect(html).toContain(
			'<a href="https://lemmy.example/u/example_user@example.org" target="_blank">@example_user@example.org</a>',
		);
		expect(html).toContain(
			'<a href="https://lemmy.example/c/test_group@example.org" target="_blank">!test_group@example.org</a>',
		);
	});

	it("normalises a configured Lemmy instance URL without a trailing slash", async () => {
		mockBuildLemmyUrl("https://lemmy.test");

		const html = await renderLemmyComment("@person@example.org");

		expect(html).toBe(
			'<p><a href="https://lemmy.test/u/person@example.org" target="_blank">@person@example.org</a></p>\n',
		);
	});

	it("does not link malformed Lemmy mentions", async () => {
		const html = await renderLemmyComment("No @local-user or !community");

		expect(html).toBe("<p>No @local-user or !community</p>\n");
	});

	it("does not rewrite mention text inside an existing markdown link", async () => {
		const html = await renderLemmyComment(
			"[@person@example.org](https://example.com)",
		);

		expect(html).toBe(
			'<p><a href="https://example.com" target="_blank">@person@example.org</a></p>\n',
		);
	});
});

describe("lemmyCommentParser renderer behavior", () => {
	it("repairs API markdown links that contain a space before the URL", async () => {
		const html = await renderLemmyComment("[site] (https://example.com)");

		expect(html).toBe(
			'<p><a href="https://example.com" target="_blank">site</a></p>\n',
		);
	});

	it("renders emphasis before applying Lemmy text replacements", async () => {
		const html = await renderLemmyComment("*important* @person@example.org");

		expect(html).toContain("<em>important</em>");
		expect(html).toContain(
			'<a href="https://lemmy.example/u/person@example.org" target="_blank">@person@example.org</a>',
		);
	});

	it("renders recognized timestamps as seek buttons", async () => {
		const html = await renderLemmyComment("watch 1:02 or 2m03s");

		expect(html).toContain(
			'<button type="button" data-timestamp-seconds="62">[1:02]</button>',
		);
		expect(html).toContain(
			'<button type="button" data-timestamp-seconds="123">[2m03s]</button>',
		);
	});

	it("escapes raw HTML instead of rendering it", async () => {
		const html = await renderLemmyComment('<script>alert("x")</script>');

		expect(html).toBe(
			"<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>\n",
		);
	});

	it("adds target blank to ordinary markdown links", async () => {
		const html = await renderLemmyComment("[site](https://example.com)");

		expect(html).toBe(
			'<p><a href="https://example.com" target="_blank">site</a></p>\n',
		);
	});
});

describe("redditCommentParser common renderer behavior", () => {
	it("escapes raw HTML instead of rendering it", () => {
		const html = renderRedditComment('<script>alert("x")</script>');

		expect(html).toBe(
			"<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>\n",
		);
	});

	it("adds target blank to ordinary markdown links", () => {
		const html = renderRedditComment("[site](https://example.com)");

		expect(html).toBe(
			'<p><a href="https://example.com" target="_blank">site</a></p>\n',
		);
	});
});
