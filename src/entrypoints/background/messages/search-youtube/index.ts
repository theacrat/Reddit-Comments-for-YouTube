import { GetListByKeyword as getListByKeyword } from "youtube-search-api";
import type { SearchItem } from "youtube-search-api";

import type { SearchYouTubeRequest } from "@/utils/types/network-requests";
import type { FetchResponse } from "@/utils/types/network-responses";

import { findYouTubeMatch } from "./youtube-match";

const searchCache = new Map<
	string,
	Promise<FetchResponse<string | undefined>>
>();

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

function getSearchCacheKey(request: SearchYouTubeRequest) {
	return [
		request.channelId,
		request.channelName,
		request.title,
		Math.round(request.videoLength),
	].join("\0");
}

async function getYouTubeResults({
	channelName,
	title,
}: SearchYouTubeRequest): Promise<FetchResponse<SearchItem[]>> {
	try {
		const searchResponse = await getListByKeyword(
			`${channelName} ${title}`,
			false,
			20,
			[{ type: "video" }],
		);

		return { success: true, value: searchResponse.items };
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
