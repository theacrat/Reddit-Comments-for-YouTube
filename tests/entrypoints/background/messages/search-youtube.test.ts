import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchItem } from "youtube-search-api";

import { searchYouTube } from "@/entrypoints/background/messages/search-youtube";
import { findYouTubeMatch } from "@/entrypoints/background/messages/search-youtube/youtube-match";
import type { SearchYouTubeRequest } from "@/utils/types/network-requests";

const { mockedGetListByKeyword } = vi.hoisted(() => ({
	mockedGetListByKeyword: vi.fn<() => unknown>(),
}));

vi.mock("youtube-search-api", () => ({
	GetListByKeyword: mockedGetListByKeyword,
}));

const baseRequest: SearchYouTubeRequest = {
	channelId: "channel-1",
	channelName: "Example Channel",
	title: "Episode 12 - A Useful Title",
	videoLength: 600,
};

function createSearchItem(overrides: Partial<SearchItem>): SearchItem {
	return {
		channelTitle: "Example Channel",
		id: "video-1",
		length: { simpleText: "10:02" },
		thumbnail: undefined,
		title: "Episode 12 - A Useful Title",
		type: "video",
		...overrides,
	};
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
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("searches YouTube and returns the matched video id", async () => {
		mockedGetListByKeyword.mockResolvedValue({
			items: [createSearchItem({ id: "matched-video" })],
		});

		await expect(searchYouTube(baseRequest)).resolves.toStrictEqual({
			success: true,
			value: "matched-video",
		});
		expect(mockedGetListByKeyword).toHaveBeenCalledWith(
			"Example Channel Episode 12 - A Useful Title",
			false,
			20,
			[{ type: "video" }],
		);
	});

	it("caches identical searches", async () => {
		const request = { ...baseRequest, title: "Episode 12 - Cache Test" };
		mockedGetListByKeyword.mockResolvedValue({
			items: [
				createSearchItem({
					id: "cached-video",
					title: "Episode 12 - Cache Test",
				}),
			],
		});

		await expect(searchYouTube(request)).resolves.toStrictEqual({
			success: true,
			value: "cached-video",
		});
		await expect(searchYouTube(request)).resolves.toStrictEqual({
			success: true,
			value: "cached-video",
		});
		expect(mockedGetListByKeyword).toHaveBeenCalledOnce();
	});

	it("returns a parse error when YouTube search throws", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {
			/* Empty */
		});
		mockedGetListByKeyword.mockRejectedValue(new Error("bad response"));

		await expect(
			searchYouTube({ ...baseRequest, title: "Different title" }),
		).resolves.toStrictEqual({
			errorMessage: "Failed to parse YouTube search results.",
			success: false,
		});
	});
});
