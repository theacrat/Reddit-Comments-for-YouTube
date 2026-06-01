import { z } from "zod";

import type { SearchYouTubeRequest } from "@/utils/types/network-requests";
import type { FetchResponse } from "@/utils/types/network-responses";

import { findYouTubeMatch } from "./youtube-match";
import type { YouTubeSearchResult } from "./youtube-match";

const YOUTUBE_INITIAL_DATA_REGEX =
	/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/;

const youtubeRunSchema = z.looseObject({
	text: z.string(),
});

const youtubeVideoRendererSchema = z.looseObject({
	lengthText: z.object({
		simpleText: z.string(),
	}),
	longBylineText: z.object({
		runs: z.array(youtubeRunSchema).min(1),
	}),
	title: z.object({
		runs: z.array(youtubeRunSchema).min(1),
	}),
	videoId: z.string(),
});

const youtubeSearchItemSchema = z.looseObject({
	videoRenderer: youtubeVideoRendererSchema.optional(),
});

const youtubeSearchResponseSchema = z.object({
	contents: z.object({
		twoColumnSearchResultsRenderer: z.object({
			primaryContents: z.object({
				sectionListRenderer: z.object({
					contents: z.array(
						z.looseObject({
							itemSectionRenderer: z
								.object({
									contents: z.array(youtubeSearchItemSchema),
								})
								.optional(),
						}),
					),
				}),
			}),
		}),
	}),
});

const searchCache = new Map<
	string,
	Promise<FetchResponse<string | undefined>>
>();

type YouTubeSearchResponse = z.infer<typeof youtubeSearchResponseSchema>;

function cacheSearch(
	cacheKey: string,
	search: Promise<FetchResponse<string | undefined>>,
) {
	searchCache.set(cacheKey, search);

	if (searchCache.size > 50) {
		const oldestCacheKey = searchCache.keys().next().value;

		if (oldestCacheKey) {
			searchCache.delete(oldestCacheKey);
		}
	}
}

interface GetYouTubeSearchUrlParams {
	channelName: string;
	title: string;
}

function getYouTubeSearchUrl({
	channelName,
	title,
}: GetYouTubeSearchUrlParams) {
	const url = new URL("https://www.youtube.com/results");
	url.searchParams.set("search_query", `${channelName} ${title}`);

	return url;
}

async function fetchYouTubeSearchPage(
	request: SearchYouTubeRequest,
): Promise<FetchResponse<string>> {
	try {
		const response = await fetch(getYouTubeSearchUrl(request).toString());

		if (!response.ok) {
			return {
				errorMessage: "Failed to get YouTube search results.",
				success: false,
			};
		}

		return { success: true, value: await response.text() };
	} catch (error) {
		console.error(error);

		return {
			errorMessage: "Failed to get YouTube search results.",
			success: false,
		};
	}
}

function getSearchCacheKey(request: SearchYouTubeRequest) {
	return [
		request.channelId,
		request.channelName,
		request.title,
		Math.round(request.videoLength),
	].join("\0");
}

function getYouTubeSearchItems(searchResponse: YouTubeSearchResponse) {
	return (
		searchResponse.contents.twoColumnSearchResultsRenderer.primaryContents
			.sectionListRenderer.contents[0]?.itemSectionRenderer?.contents ?? []
	);
}

function parseYouTubeInitialData(responseText: string) {
	const match = YOUTUBE_INITIAL_DATA_REGEX.exec(responseText);

	if (!match?.[1]) {
		throw new Error("Could not find ytInitialData.");
	}

	const parsed: unknown = JSON.parse(match[1]);
	const searchResponse = youtubeSearchResponseSchema.safeParse(parsed);

	if (!searchResponse.success) {
		throw searchResponse.error;
	}

	return searchResponse.data;
}

function parseYouTubeResults(responseText: string): YouTubeSearchResult[] {
	const searchResponse = parseYouTubeInitialData(responseText);

	return getYouTubeSearchItems(searchResponse).flatMap((item) => {
		const video = item.videoRenderer;

		if (!video) {
			return [];
		}

		return {
			channelTitle: video.longBylineText.runs[0]?.text ?? "",
			id: video.videoId,
			length: video.lengthText,
			title: video.title.runs[0]?.text ?? "",
		};
	});
}

async function getYouTubeResults(
	request: SearchYouTubeRequest,
): Promise<FetchResponse<YouTubeSearchResult[]>> {
	const response = await fetchYouTubeSearchPage(request);

	if (!response.success) {
		return response;
	}

	try {
		return { success: true, value: parseYouTubeResults(response.value) };
	} catch (error) {
		console.error(error);

		return {
			errorMessage: "Failed to parse YouTube search results.",
			success: false,
		};
	}
}

async function searchYouTubeUncached(
	request: SearchYouTubeRequest,
): Promise<FetchResponse<string | undefined>> {
	const youtubeResults = await getYouTubeResults(request);

	if (!youtubeResults.success) {
		return youtubeResults;
	}

	const youtubeMatch = findYouTubeMatch({
		request,
		results: youtubeResults.value,
	});

	return { success: true, value: youtubeMatch?.id };
}

async function searchYouTube(
	request: SearchYouTubeRequest,
): Promise<FetchResponse<string | undefined>> {
	const cacheKey = getSearchCacheKey(request);
	const cachedSearch = await searchCache.get(cacheKey);

	if (cachedSearch) {
		return cachedSearch;
	}

	const search = searchYouTubeUncached(request);
	cacheSearch(cacheKey, search);

	return search;
}

export { searchYouTube };
