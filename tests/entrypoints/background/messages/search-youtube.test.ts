import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchYouTube } from "@/entrypoints/background/messages/search-youtube";
import { findYouTubeMatch } from "@/entrypoints/background/messages/search-youtube/youtube-match";
import type { YouTubeSearchResult } from "@/entrypoints/background/messages/search-youtube/youtube-match";
import type { SearchYouTubeRequest } from "@/utils/types/network-requests";

const { mockedFetch } = vi.hoisted(() => ({
	mockedFetch: vi.fn<typeof fetch>(),
}));

const baseRequest: SearchYouTubeRequest = {
	channelId: "channel-1",
	channelName: "Example Channel",
	title: "Episode 12 - A Useful Title",
	videoLength: 600,
};

function createSearchItem(
	overrides: Partial<YouTubeSearchResult>,
): YouTubeSearchResult {
	return {
		channelTitle: "Example Channel",
		id: "video-1",
		length: { simpleText: "10:02" },
		title: "Episode 12 - A Useful Title",
		...overrides,
	};
}

function createYouTubeSearchPage(items: Partial<YouTubeSearchResult>[]) {
	return `<html><body><script>var ytInitialData = ${JSON.stringify({
		contents: {
			twoColumnSearchResultsRenderer: {
				primaryContents: {
					sectionListRenderer: {
						contents: [
							{
								itemSectionRenderer: {
									contents: items.map((item) => ({
										videoRenderer: {
											lengthText: item.length,
											longBylineText: {
												runs: [{ text: item.channelTitle }],
											},
											title: {
												runs: [{ text: item.title }],
											},
											videoId: item.id,
										},
									})),
								},
							},
						],
					},
				},
			},
		},
	})};</script></body></html>`;
}

describe("findYouTubeMatch", () => {
	it("selects the strongest title, channel, and length match", () => {
		const match = createSearchItem({
			id: "correct",
			title: "A Useful Title",
		});
		const wrongEpisode = createSearchItem({
			id: "wrong-episode",
			title: "Episode 13 - A Useful Title",
		});
		const wrongChannel = createSearchItem({
			channelTitle: "Different Channel",
			id: "wrong-channel",
		});

		expect(
			findYouTubeMatch({
				request: baseRequest,
				results: [wrongEpisode, wrongChannel, match],
			}),
		).toBe(match);
	});

	it("rejects weak matches", () => {
		expect(
			findYouTubeMatch({
				request: baseRequest,
				results: [
					createSearchItem({
						channelTitle: "Unrelated",
						id: "bad",
						length: { simpleText: "45:00" },
						title: "Nothing similar",
					}),
				],
			}),
		).toBeUndefined();
	});
});

describe("searchYouTube", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", mockedFetch);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("searches YouTube and returns the matched video id", async () => {
		mockedFetch.mockResolvedValue(
			new Response(
				createYouTubeSearchPage([createSearchItem({ id: "matched-video" })]),
			),
		);

		await expect(searchYouTube(baseRequest)).resolves.toStrictEqual({
			success: true,
			value: "matched-video",
		});
		expect(mockedFetch).toHaveBeenCalledWith(
			"https://www.youtube.com/results?search_query=Example+Channel+Episode+12+-+A+Useful+Title",
		);
	});

	it("excludes invalid videos from YouTube search results", async () => {
		const request = {
			...baseRequest,
			title: "Episode 12 - Invalid Video Test",
		};
		mockedFetch.mockResolvedValue(
			new Response(
				createYouTubeSearchPage([
					{
						channelTitle: "Example Channel",
						id: "livestream",
						title: request.title,
					},
					createSearchItem({
						id: "valid-video",
						title: request.title,
					}),
				]),
			),
		);

		await expect(searchYouTube(request)).resolves.toStrictEqual({
			success: true,
			value: "valid-video",
		});
	});

	it("caches identical searches", async () => {
		const request = { ...baseRequest, title: "Episode 12 - Cache Test" };
		mockedFetch.mockResolvedValue(
			new Response(
				createYouTubeSearchPage([
					createSearchItem({
						id: "cached-video",
						title: "Episode 12 - Cache Test",
					}),
				]),
			),
		);

		await expect(searchYouTube(request)).resolves.toStrictEqual({
			success: true,
			value: "cached-video",
		});
		await expect(searchYouTube(request)).resolves.toStrictEqual({
			success: true,
			value: "cached-video",
		});
		expect(mockedFetch).toHaveBeenCalledOnce();
	});

	it("returns a parse error when YouTube search cannot be parsed", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {
			/* Empty */
		});
		mockedFetch.mockResolvedValue(new Response("<html></html>"));

		await expect(
			searchYouTube({ ...baseRequest, title: "Different title" }),
		).resolves.toStrictEqual({
			errorMessage: "Failed to parse YouTube search results.",
			success: false,
		});
	});
});
