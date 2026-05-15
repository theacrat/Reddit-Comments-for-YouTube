import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUser, resetUser } from "@/entrypoints/background/messages/get-user";
import {
	REDDIT_API_DOMAIN,
	REDDIT_LINK_DOMAIN,
	Website,
} from "@/utils/constants";
import { Settings, getValue } from "@/utils/settings";
import { requestJson } from "@/utils/tools/request-tools";

const { mockedBuildLemmyApiUrl, mockedGetValue, mockedRequestJson } =
	vi.hoisted(() => ({
		mockedBuildLemmyApiUrl: vi.fn<() => Promise<URL>>(),
		mockedGetValue: vi.fn<(setting: Settings) => Promise<string>>(),
		mockedRequestJson: vi.fn<() => unknown>(),
	}));

vi.mock("@/utils/settings", () => ({
	Settings: {
		LEMMYDOMAIN: "lemmyDomain",
		LEMMYTOKEN: "lemmyToken",
	},
	getValue: mockedGetValue,
}));

vi.mock("@/utils/tools/request-tools", () => ({
	buildLemmyApiUrl: mockedBuildLemmyApiUrl,
	requestJson: mockedRequestJson,
}));

const mockedImportedGetValue = vi.mocked(getValue);
const mockedImportedRequestJson = vi.mocked(requestJson);

describe("getUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetUser();
		mockedBuildLemmyApiUrl.mockResolvedValue(
			new URL("https://lemmy.example/api/v3/site?auth=token"),
		);
		mockedGetValue.mockImplementation(async (setting) => {
			await Promise.resolve();

			if (setting === Settings.LEMMYDOMAIN) {
				return "lemmy.example";
			}

			if (setting === Settings.LEMMYTOKEN) {
				return "token";
			}

			return "";
		});
	});

	it("returns and caches Reddit user data", async () => {
		mockedRequestJson.mockResolvedValue({
			success: true,
			value: {
				data: {
					is_suspended: false,
					modhash: "modhash",
					name: "reddit-user",
				},
			},
		});

		await expect(getUser(Website.REDDIT)).resolves.toStrictEqual({
			success: true,
			value: {
				isSuspended: false,
				token: "modhash",
				username: `${REDDIT_LINK_DOMAIN}/user/reddit-user`,
				website: Website.REDDIT,
			},
		});
		await expect(getUser(Website.REDDIT)).resolves.toStrictEqual({
			success: true,
			value: {
				isSuspended: false,
				token: "modhash",
				username: `${REDDIT_LINK_DOMAIN}/user/reddit-user`,
				website: Website.REDDIT,
			},
		});
		expect(mockedImportedRequestJson).toHaveBeenCalledOnce();
		expect(mockedImportedRequestJson).toHaveBeenCalledWith(
			`${REDDIT_API_DOMAIN}/api/me.json`,
			expect.anything(),
		);
	});

	it("reports a logged-out Reddit session", async () => {
		mockedRequestJson.mockResolvedValue({
			success: true,
			value: { data: {} },
		});

		await expect(getUser(Website.REDDIT)).resolves.toStrictEqual({
			errorMessage: "User is not logged in.",
			success: false,
		});
	});

	it("returns and caches Lemmy user data", async () => {
		mockedRequestJson.mockResolvedValue({
			success: true,
			value: {
				my_user: {
					local_user_view: {
						person: {
							actor_id: "https://lemmy.example/u/thea",
							banned: true,
						},
					},
				},
			},
		});

		await expect(getUser(Website.LEMMY)).resolves.toStrictEqual({
			success: true,
			value: {
				isSuspended: true,
				token: "token",
				username: "https://lemmy.example/u/thea@lemmy.example",
				website: Website.LEMMY,
			},
		});
		await expect(getUser(Website.LEMMY)).resolves.toMatchObject({
			success: true,
		});
		expect(mockedImportedGetValue).toHaveBeenCalledWith(Settings.LEMMYTOKEN);
		expect(mockedImportedGetValue).toHaveBeenCalledWith(Settings.LEMMYDOMAIN);
		expect(mockedBuildLemmyApiUrl).toHaveBeenCalledWith({
			endpoint: "site",
			searchParams: { auth: "token" },
		});
		expect(mockedImportedRequestJson).toHaveBeenCalledOnce();
	});

	it("requires a Lemmy token before requesting user data", async () => {
		mockedGetValue.mockResolvedValue("");

		await expect(getUser(Website.LEMMY)).resolves.toStrictEqual({
			errorMessage: "Lemmy token does not exist.",
			success: false,
		});
		expect(mockedBuildLemmyApiUrl).not.toHaveBeenCalled();
		expect(mockedImportedRequestJson).not.toHaveBeenCalled();
	});
});
