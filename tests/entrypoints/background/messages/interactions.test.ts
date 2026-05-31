import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteComment } from "@/entrypoints/background/messages/interactions/delete";
import { vote } from "@/entrypoints/background/messages/interactions/vote";
import { Kind, REDDIT_API_DOMAIN, Website } from "@/utils/constants";

interface RequestCatchOptions {
	data?: unknown;
	headers?: unknown;
	method: string;
}

const { mockedBuildLemmyApiUrl, mockedGetUser, mockedRequestCatch } =
	vi.hoisted(() => ({
		mockedBuildLemmyApiUrl: vi.fn<() => Promise<URL>>(),
		mockedGetUser: vi.fn<() => unknown>(),
		mockedRequestCatch:
			vi.fn<(url: string | URL, options: RequestCatchOptions) => unknown>(),
	}));

vi.mock("@/entrypoints/background/messages/get-user", () => ({
	getUser: mockedGetUser,
}));

vi.mock("@/utils/tools/request-tools", () => ({
	buildLemmyApiUrl: mockedBuildLemmyApiUrl,
	getLemmyAuthHeaders: (token: string) => ({
		Authorization: `Bearer ${token}`,
	}),
	requestCatch: mockedRequestCatch,
}));

describe("background interactions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedBuildLemmyApiUrl.mockResolvedValue(
			new URL("https://lemmy.example/api/v3/comment/delete"),
		);
		mockedGetUser.mockResolvedValue({
			success: true,
			value: {
				isSuspended: false,
				token: "token",
				username: "user",
				website: Website.LEMMY,
			},
		});
	});

	function getFirstRequestCatchOptions() {
		const [call] = mockedRequestCatch.mock.calls;

		if (call === undefined) {
			throw new Error("Expected requestCatch to have been called.");
		}

		return call[1];
	}

	function expectSearchParams(data: unknown) {
		expect(data).toBeInstanceOf(URLSearchParams);

		if (!(data instanceof URLSearchParams)) {
			throw new TypeError("Expected URLSearchParams.");
		}

		return Object.fromEntries(data);
	}

	it("returns the delete result to callers", async () => {
		const result = deleteComment({ id: "123", website: Website.LEMMY });

		await expect(Promise.resolve(result)).resolves.toStrictEqual({
			success: true,
			value: undefined,
		});
	});

	it("sends Reddit delete requests with the comment id and modhash", async () => {
		await expect(
			deleteComment({ id: "t1_comment", website: Website.REDDIT }),
		).resolves.toStrictEqual({
			success: true,
			value: undefined,
		});

		const options = getFirstRequestCatchOptions();

		expect(mockedRequestCatch.mock.calls[0]?.[0]).toBe(
			`${REDDIT_API_DOMAIN}/api/del`,
		);
		expect(options.method).toBe("POST");
		expect(expectSearchParams(options.data)).toStrictEqual({
			id: "t1_comment",
			uh: "token",
		});
	});

	it("sends Lemmy delete requests with auth headers and a numeric comment id", async () => {
		mockedBuildLemmyApiUrl.mockResolvedValue(
			new URL("https://lemmy.example/api/v3/comment/delete"),
		);

		await expect(
			deleteComment({ id: "123", website: Website.LEMMY }),
		).resolves.toStrictEqual({
			success: true,
			value: undefined,
		});

		expect(mockedBuildLemmyApiUrl).toHaveBeenCalledWith({
			endpoint: "comment/delete",
		});
		expect(mockedRequestCatch).toHaveBeenCalledWith(
			new URL("https://lemmy.example/api/v3/comment/delete"),
			{
				data: {
					comment_id: 123,
					deleted: true,
				},
				headers: {
					Authorization: "Bearer token",
				},
				method: "POST",
			},
		);
	});

	it("returns the vote result to callers", async () => {
		const result = vote({
			id: "123",
			kind: Kind.THREAD,
			vote: 1,
			website: Website.LEMMY,
		});

		await expect(Promise.resolve(result)).resolves.toStrictEqual({
			success: true,
			value: undefined,
		});
	});

	it("sends Reddit vote requests with the selected direction", async () => {
		await expect(
			vote({
				id: "t3_thread",
				kind: Kind.THREAD,
				vote: -1,
				website: Website.REDDIT,
			}),
		).resolves.toStrictEqual({
			success: true,
			value: undefined,
		});

		const options = getFirstRequestCatchOptions();

		expect(mockedRequestCatch.mock.calls[0]?.[0]).toBe(
			`${REDDIT_API_DOMAIN}/api/vote`,
		);
		expect(options.method).toBe("POST");
		expect(expectSearchParams(options.data)).toStrictEqual({
			dir: "-1",
			id: "t3_thread",
			uh: "token",
		});
	});

	it("sends Lemmy post vote requests to the post like endpoint", async () => {
		mockedBuildLemmyApiUrl.mockResolvedValue(
			new URL("https://lemmy.example/api/v3/post/like"),
		);

		await expect(
			vote({
				id: "456",
				kind: Kind.THREAD,
				vote: 1,
				website: Website.LEMMY,
			}),
		).resolves.toStrictEqual({
			success: true,
			value: undefined,
		});

		expect(mockedBuildLemmyApiUrl).toHaveBeenCalledWith({
			endpoint: "post/like",
		});
		expect(mockedRequestCatch).toHaveBeenCalledWith(
			new URL("https://lemmy.example/api/v3/post/like"),
			{
				data: {
					post_id: 456,
					score: 1,
				},
				headers: {
					Authorization: "Bearer token",
				},
				method: "POST",
			},
		);
	});

	it("sends Lemmy comment vote requests to the comment like endpoint", async () => {
		mockedBuildLemmyApiUrl.mockResolvedValue(
			new URL("https://lemmy.example/api/v3/comment/like"),
		);

		await expect(
			vote({
				id: "789",
				kind: Kind.COMMENT,
				vote: 0,
				website: Website.LEMMY,
			}),
		).resolves.toStrictEqual({
			success: true,
			value: undefined,
		});

		expect(mockedBuildLemmyApiUrl).toHaveBeenCalledWith({
			endpoint: "comment/like",
		});
		expect(mockedRequestCatch).toHaveBeenCalledWith(
			new URL("https://lemmy.example/api/v3/comment/like"),
			{
				data: {
					comment_id: 789,
					score: 0,
				},
				headers: {
					Authorization: "Bearer token",
				},
				method: "POST",
			},
		);
	});

	it("passes through user lookup failures", async () => {
		const response = { errorMessage: "User is not logged in.", success: false };
		mockedGetUser.mockResolvedValue(response);

		const result = deleteComment({ id: "123", website: Website.REDDIT });

		await expect(Promise.resolve(result)).resolves.toBe(response);
	});

	it("passes through Lemmy delete user lookup failures", async () => {
		const response = {
			errorMessage: "Lemmy token does not exist.",
			success: false,
		};
		mockedGetUser.mockResolvedValue(response);

		await expect(
			deleteComment({ id: "123", website: Website.LEMMY }),
		).resolves.toBe(response);
		expect(mockedRequestCatch).not.toHaveBeenCalled();
	});

	it("passes through Reddit vote user lookup failures", async () => {
		const response = { errorMessage: "User is not logged in.", success: false };
		mockedGetUser.mockResolvedValue(response);

		await expect(
			vote({
				id: "t3_thread",
				kind: Kind.THREAD,
				vote: 1,
				website: Website.REDDIT,
			}),
		).resolves.toBe(response);
		expect(mockedRequestCatch).not.toHaveBeenCalled();
	});

	it("passes through Lemmy vote user lookup failures", async () => {
		const response = {
			errorMessage: "Lemmy token does not exist.",
			success: false,
		};
		mockedGetUser.mockResolvedValue(response);

		await expect(
			vote({
				id: "123",
				kind: Kind.COMMENT,
				vote: 1,
				website: Website.LEMMY,
			}),
		).resolves.toBe(response);
		expect(mockedRequestCatch).not.toHaveBeenCalled();
	});
});
