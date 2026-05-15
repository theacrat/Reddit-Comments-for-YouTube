import { fuzzy } from "fast-fuzzy";
import type { SearchItem } from "youtube-search-api";

import { cleanString } from "@/utils/tools/string-tools";
import { parseTimestamp } from "@/utils/tools/time-tools";
import type { SearchYouTubeRequest } from "@/utils/types/network-requests";

const EPISODE_MATCH_REGEX = /(?:Episode|Ep|Part)[. ]*?(\d+)/i;
const TITLE_SEGMENT_SEPARATOR_REGEX = /[|-–—]/;

interface YouTubeLength {
	simpleText: string;
}

function isYouTubeLength(value: unknown): value is YouTubeLength {
	return (
		typeof value === "object" &&
		value !== null &&
		"simpleText" in value &&
		typeof (value as Record<string, unknown>)["simpleText"] === "string"
	);
}

function getChannelScore({ request, result }: GetMatchScoreParams) {
	if (!result.channelTitle) {
		return Number.NEGATIVE_INFINITY;
	}

	const cleanChannelName = cleanString(request.channelName);
	const cleanResultChannelName = cleanString(result.channelTitle);

	if (cleanResultChannelName === cleanChannelName) {
		return 30;
	}

	if (
		cleanResultChannelName.includes(cleanChannelName) ||
		cleanChannelName.includes(cleanResultChannelName)
	) {
		return 15;
	}

	return Number.NEGATIVE_INFINITY;
}

function getEpisodeNumber(value: string) {
	return EPISODE_MATCH_REGEX.exec(value)?.[1];
}

function getLengthScore({ request, result }: GetMatchScoreParams) {
	const { videoLength } = request;
	const resultLength: unknown = result.length;

	if (!isYouTubeLength(resultLength)) {
		return Number.NEGATIVE_INFINITY;
	}

	const parsedLength = parseTimestamp(resultLength.simpleText);
	const difference = Math.abs(videoLength - parsedLength);

	if (parsedLength - videoLength > 200) {
		return Number.NEGATIVE_INFINITY;
	}

	return Math.max(0, 25 - difference / 12);
}

interface GetTitleSegmentMatchesParams {
	cleanResultTitle: string;
	requestTitle: string;
}

function getTitleSegmentMatches({
	cleanResultTitle,
	requestTitle,
}: GetTitleSegmentMatchesParams) {
	return requestTitle
		.split(TITLE_SEGMENT_SEPARATOR_REGEX)
		.some((entry) => cleanString(entry) === cleanResultTitle);
}

interface GetMatchScoreParams {
	request: SearchYouTubeRequest;
	result: SearchItem;
}

function getMatchScore(params: GetMatchScoreParams) {
	const { request, result } = params;
	const { title } = request;

	const channelScore = getChannelScore(params);

	if (channelScore === Number.NEGATIVE_INFINITY) {
		return channelScore;
	}

	const titleEpisodeNumber = getEpisodeNumber(title);
	const resultEpisodeNumber = getEpisodeNumber(result.title);

	if (
		titleEpisodeNumber &&
		resultEpisodeNumber &&
		titleEpisodeNumber !== resultEpisodeNumber
	) {
		return Number.NEGATIVE_INFINITY;
	}

	const cleanTitle = cleanString(title);
	const cleanResultTitle = cleanString(result.title);

	const exactTitleScore =
		cleanResultTitle === cleanTitle ||
		getTitleSegmentMatches({ cleanResultTitle, requestTitle: title })
			? 40
			: 0;
	const titleScore = fuzzy(cleanTitle, cleanResultTitle) * 60;

	const lengthScore = getLengthScore(params);
	if (lengthScore === Number.NEGATIVE_INFINITY) {
		return lengthScore;
	}

	return channelScore + exactTitleScore + titleScore + lengthScore;
}

interface FindYouTubeMatchParams {
	request: SearchYouTubeRequest;
	results: SearchItem[];
}

function findYouTubeMatch({
	request,
	results,
}: FindYouTubeMatchParams): SearchItem | undefined {
	let bestScore = Number.NEGATIVE_INFINITY;
	let bestMatch: SearchItem | undefined = undefined;

	for (const result of results) {
		const score = getMatchScore({ request, result });

		if (score <= bestScore) {
			continue;
		}

		bestScore = score;
		bestMatch = result;
	}

	return bestScore >= 75 ? bestMatch : undefined;
}

export { findYouTubeMatch };
