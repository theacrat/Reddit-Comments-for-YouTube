import { beforeEach, describe, expect, it, vi } from "vitest";

import { getThreads } from "@/entrypoints/background/messages/get-threads";
import { SiteId } from "@/utils/constants";
import { Settings, getValue } from "@/utils/settings";
import {
	getRedditLoginRequiredErrorMessage,
	requestJson,
} from "@/utils/tools/request-tools";
import type { GetThreadsRequest } from "@/utils/types/network-requests";
import type { Site } from "@/utils/types/site";

const {
	getMockRedditLoginRequiredErrorMessage,
	mockedGetValue,
	mockedRequestJson,
	mockedResetUser,
} = vi.hoisted(() => ({
	getMockRedditLoginRequiredErrorMessage: vi.fn(
		() => "translated reddit login message",
	),
	mockedGetValue: vi.fn<(setting: Settings) => Promise<unknown>>(),
	mockedRequestJson: vi.fn<() => unknown>(),
	mockedResetUser: vi.fn(),
}));

vi.mock("@/entrypoints/background/messages/get-user", () => ({
	resetUser: mockedResetUser,
}));

vi.mock("@/utils/settings", () => ({
	Settings: {
		COMMUNITYBLACKLIST: "communityBlacklist",
		INCLUDENSFW: "includeNSFW",
		LEMMYDOMAIN: "lemmyDomain",
		SHOWREDDITRESULTS: "showRedditResults",
	},
	getValue: mockedGetValue,
}));

vi.mock("@/utils/tools/request-tools", () => ({
	buildLemmyApiUrl: vi.fn(),
	getRedditLoginRequiredErrorMessage: getMockRedditLoginRequiredErrorMessage,
	getStoredLemmyAuthConfig: vi.fn(),
	requestJson: mockedRequestJson,
}));

const site: Site = {
	anchorElement: "",
	anchorType: "beforeend",
	canMatchYouTube: false,
	domains: ["www.youtube.com"],
	eventListeners: [],
	id: SiteId.YOUTUBE,
	idRegex: /.*/,
	templates: ["https://www.youtube.com/watch?v=videoId"],
	titleElement: "",
	usernameElement: "",
	videoElement: "",
};

const request: GetThreadsRequest = {
	site,
	url: "video-id",
	youtubeId: undefined,
};

const mockedGetRedditLoginRequiredErrorMessage = vi.mocked(
	getRedditLoginRequiredErrorMessage,
);
const mockedImportedGetValue = vi.mocked(getValue);
const mockedImportedRequestJson = vi.mocked(requestJson);

describe("getThreads", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedGetValue.mockImplementation(async (setting) => {
			await Promise.resolve();

			if (setting === Settings.INCLUDENSFW) {
				return false;
			}

			if (setting === Settings.SHOWREDDITRESULTS) {
				return true;
			}

			if (setting === Settings.COMMUNITYBLACKLIST) {
				return [];
			}

			return "";
		});
	});

	it("surfaces Reddit login guidance when thread searches are forbidden", async () => {
		const errorMessage = getRedditLoginRequiredErrorMessage();

		mockedRequestJson.mockResolvedValue({
			errorMessage,
			success: false,
		});

		await expect(getThreads(request)).resolves.toStrictEqual({
			errorMessage,
			success: false,
		});
		expect(mockedGetRedditLoginRequiredErrorMessage).toHaveBeenCalled();
		expect(mockedImportedGetValue).toHaveBeenCalledWith(Settings.INCLUDENSFW);
		expect(mockedImportedRequestJson).toHaveBeenCalledWith(
			expect.objectContaining({
				hostname: "api.reddit.com",
				pathname: "/search.json",
			}),
			expect.anything(),
		);
		expect(mockedResetUser).toHaveBeenCalledOnce();
	});
});
