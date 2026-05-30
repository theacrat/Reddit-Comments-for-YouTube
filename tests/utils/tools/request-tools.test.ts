import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { Settings, getValue } from "@/utils/settings";
import {
	addLemmyAuth,
	appendSearchParams,
	buildLemmyApiUrl,
	buildLemmyUrl,
	convertRedditUserVotes,
	getLemmyAuthHeaders,
	requestJson,
	requestText,
} from "@/utils/tools/request-tools";

const { mockedAxiosRequest } = vi.hoisted(() => ({
	mockedAxiosRequest: vi.fn(),
}));

vi.mock("@/utils/settings", () => ({
	Settings: {
		LEMMYDOMAIN: "lemmyDomain",
		LEMMYTOKEN: "lemmyToken",
	},
	getValue: vi.fn(),
}));

vi.mock("axios", () => ({
	default: {
		request: mockedAxiosRequest,
	},
	isAxiosError: (error: unknown) =>
		typeof error === "object" &&
		error !== null &&
		"isAxiosError" in error &&
		error.isAxiosError === true,
}));

const mockedGetValue = vi.mocked(getValue);

async function getMockSetting(name: Settings) {
	await Promise.resolve();

	if (name === Settings.LEMMYDOMAIN) {
		return "lemmy.example";
	}

	if (name === Settings.LEMMYTOKEN) {
		return "token-123";
	}

	return "";
}

beforeEach(() => {
	mockedAxiosRequest.mockReset();
	mockedGetValue.mockImplementation(getMockSetting);

	vi.stubGlobal("navigator", { onLine: true });
});

describe("Lemmy request helpers", () => {
	it("builds Lemmy URLs with normalised endpoints", async () => {
		await expect(buildLemmyUrl({ endpoint: "post/1" })).resolves.toBe(
			"https://lemmy.example/post/1",
		);
		await expect(
			buildLemmyUrl({ api: true, endpoint: "/post/list" }),
		).resolves.toBe("https://lemmy.example/api/v3/post/list");
	});

	it("builds API URLs with search params and optional auth", async () => {
		const url = await buildLemmyApiUrl({
			auth: true,
			endpoint: "post/list",
			searchParams: {
				community_name: "typescript",
				limit: 20,
				page: undefined,
				saved_only: false,
			},
		});

		expect(url.toString()).toBe(
			"https://lemmy.example/api/v3/post/list?community_name=typescript&limit=20&saved_only=false&auth=token-123",
		);
	});

	it("appends defined search params and skips undefined values", () => {
		const url = appendSearchParams(new URL("https://example.test/"), {
			enabled: false,
			limit: 10,
			page: undefined,
			q: "test",
		});

		expect(url.toString()).toBe(
			"https://example.test/?enabled=false&limit=10&q=test",
		);
	});

	it("creates Lemmy auth payloads and headers", () => {
		expect(getLemmyAuthHeaders("abc")).toStrictEqual({
			Authorization: "Bearer abc",
		});
		expect(addLemmyAuth({ post_id: 1 }, "abc")).toStrictEqual({
			auth: "abc",
			post_id: 1,
		});
	});
});

describe("Reddit vote conversion", () => {
	it("maps Reddit likes to local vote values", () => {
		expect(convertRedditUserVotes(true)).toBe(1);
		expect(convertRedditUserVotes(false)).toBe(-1);
		// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- Reddit uses null for no vote.
		expect(convertRedditUserVotes(JSON.parse("null") as boolean | null)).toBe(
			0,
		);
	});
});

describe("requestJson", () => {
	it("returns successful JSON responses", async () => {
		mockedAxiosRequest.mockResolvedValueOnce({ data: { ok: true } });

		await expect(
			requestJson("https://example.test/api"),
		).resolves.toStrictEqual({
			success: true,
			value: { ok: true },
		});
	});

	it("validates responses against a schema", async () => {
		mockedAxiosRequest.mockResolvedValueOnce({
			data: { id: 1, title: "Hello" },
		});

		await expect(
			requestJson("https://example.test/api", z.object({ id: z.number() })),
		).resolves.toStrictEqual({
			success: true,
			value: { id: 1 },
		});
	});

	it("returns an invalid-shape error when schema validation fails", async () => {
		mockedAxiosRequest.mockResolvedValueOnce({ data: { id: "wrong" } });
		vi.spyOn(console, "error").mockImplementation(() => {
			/* Empty */
		});

		await expect(
			requestJson("https://example.test/api", z.object({ id: z.number() })),
		).resolves.toStrictEqual({
			errorMessage: "Invalid response shape.",
			success: false,
		});
	});

	it("uses response status text for Axios response errors", async () => {
		mockedAxiosRequest.mockRejectedValueOnce({
			isAxiosError: true,
			response: {
				status: 429,
				statusText: "Too Many Requests",
			},
		});

		await expect(
			requestJson("https://example.test/api"),
		).resolves.toStrictEqual({
			errorMessage: "429 Too Many Requests",
			success: false,
		});
	});

	it("reports offline Axios request failures", async () => {
		vi.stubGlobal("navigator", { onLine: false });
		mockedAxiosRequest.mockRejectedValueOnce({ isAxiosError: true });

		await expect(
			requestJson("https://example.test/api"),
		).resolves.toStrictEqual({
			errorMessage: "Internet offline",
			success: false,
		});
	});

	it("uses text responseType for text requests", async () => {
		mockedAxiosRequest.mockResolvedValueOnce({ data: "plain text" });

		await expect(
			requestText(new URL("https://example.test/text")),
		).resolves.toStrictEqual({
			success: true,
			value: "plain text",
		});
		expect(mockedAxiosRequest).toHaveBeenCalledWith({
			responseType: "text",
			url: "https://example.test/text",
		});
	});
});
