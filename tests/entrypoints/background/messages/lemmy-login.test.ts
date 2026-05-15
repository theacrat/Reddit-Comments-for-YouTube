import { beforeEach, describe, expect, it, vi } from "vitest";

import { lemmyLogin } from "@/entrypoints/background/messages/lemmy-login";

const { mockedBuildLemmyApiUrl, mockedRequestJson } = vi.hoisted(() => ({
	mockedBuildLemmyApiUrl: vi.fn<() => Promise<URL>>(),
	mockedRequestJson: vi.fn<() => unknown>(),
}));

vi.mock("@/utils/tools/request-tools", () => ({
	buildLemmyApiUrl: mockedBuildLemmyApiUrl,
	requestJson: mockedRequestJson,
}));

describe("lemmyLogin", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedBuildLemmyApiUrl.mockResolvedValue(
			new URL("https://lemmy.example/api/v3/user/login"),
		);
	});

	it("posts login credentials and returns the JWT", async () => {
		const request = {
			password: "secret",
			totp_2fa_token: "123456",
			username_or_email: "thea",
		};
		mockedRequestJson.mockResolvedValue({
			success: true,
			value: { jwt: "jwt" },
		});

		await expect(lemmyLogin(request)).resolves.toStrictEqual({
			success: true,
			value: "jwt",
		});
		expect(mockedBuildLemmyApiUrl).toHaveBeenCalledWith({
			endpoint: "user/login",
		});
		expect(mockedRequestJson).toHaveBeenCalledWith(
			new URL("https://lemmy.example/api/v3/user/login"),
			expect.anything(),
			{
				data: request,
				method: "POST",
			},
		);
	});

	it("returns a login failure when the API omits a token", async () => {
		mockedRequestJson.mockResolvedValue({ success: true, value: {} });

		await expect(
			lemmyLogin({ password: "secret", username_or_email: "thea" }),
		).resolves.toStrictEqual({
			errorMessage: "Failed to log in.",
			success: false,
		});
	});

	it("passes through request failures", async () => {
		const response = { errorMessage: "Network error", success: false };
		mockedRequestJson.mockResolvedValue(response);

		await expect(
			lemmyLogin({ password: "secret", username_or_email: "thea" }),
		).resolves.toBe(response);
	});
});
