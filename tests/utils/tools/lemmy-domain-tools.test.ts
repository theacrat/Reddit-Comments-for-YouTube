import { beforeEach, describe, expect, it, vi } from "vitest";

import { Settings, getValue, setValue } from "@/utils/settings";
import {
	clearPendingLemmyDomain,
	parseLemmyDomain,
	promoteLemmyDomain,
	promotePendingLemmyDomain,
} from "@/utils/tools/lemmy-domain-tools";

const { contains } = vi.hoisted(() => ({
	contains: vi.fn(),
}));

vi.mock("wxt/browser", () => ({
	browser: {
		permissions: {
			contains,
		},
	},
}));

vi.mock("@/utils/settings", () => ({
	Settings: {
		LEMMYDOMAIN: "lemmyDomain",
		LEMMYPENDINGDOMAIN: "lemmyPendingDomain",
		LEMMYPENDINGORIGIN: "lemmyPendingOrigin",
		LEMMYTOKEN: "lemmyToken",
		LEMMYUSERNAME: "lemmyUsername",
	},
	getValue: vi.fn(),
	setValue: vi.fn(),
}));

const mockedGetValue = vi.mocked(getValue);
const mockedSetValue = vi.mocked(setValue);

beforeEach(() => {
	mockedGetValue.mockReset();
	mockedSetValue.mockReset();
	contains.mockReset();
});

async function getPendingDomainSetting(name: Settings) {
	await Promise.resolve();

	return name === Settings.LEMMYPENDINGDOMAIN
		? "lemmy.example"
		: "https://lemmy.example/*";
}

describe("parseLemmyDomain", () => {
	it("normalises bare domains to HTTPS origins", () => {
		expect(parseLemmyDomain("lemmy.example")).toStrictEqual({
			host: "lemmy.example",
			origin: "https://lemmy.example/*",
		});
	});

	it("preserves provided protocols and ports", () => {
		expect(parseLemmyDomain("http://localhost:8536")).toStrictEqual({
			host: "localhost:8536",
			origin: "http://localhost:8536/*",
		});
	});

	it("returns undefined for invalid domains", () => {
		expect(parseLemmyDomain("https://")).toBeUndefined();
	});
});

describe("Lemmy domain promotion", () => {
	it("clears pending Lemmy domain state", () => {
		clearPendingLemmyDomain();

		expect(mockedSetValue).toHaveBeenCalledWith(
			Settings.LEMMYPENDINGDOMAIN,
			undefined,
		);
		expect(mockedSetValue).toHaveBeenCalledWith(
			Settings.LEMMYPENDINGORIGIN,
			undefined,
		);
	});

	it("promotes a domain and clears stale login state", () => {
		promoteLemmyDomain("lemmy.example");

		expect(mockedSetValue).toHaveBeenCalledWith(
			Settings.LEMMYDOMAIN,
			"lemmy.example",
		);
		expect(mockedSetValue).toHaveBeenCalledWith(Settings.LEMMYTOKEN, undefined);
		expect(mockedSetValue).toHaveBeenCalledWith(
			Settings.LEMMYUSERNAME,
			undefined,
		);
		expect(mockedSetValue).toHaveBeenCalledWith(
			Settings.LEMMYPENDINGDOMAIN,
			undefined,
		);
		expect(mockedSetValue).toHaveBeenCalledWith(
			Settings.LEMMYPENDINGORIGIN,
			undefined,
		);
	});

	it("promotes pending domains only when permission exists", async () => {
		mockedGetValue.mockImplementation(getPendingDomainSetting);
		contains.mockResolvedValueOnce(true);

		await expect(promotePendingLemmyDomain()).resolves.toBe("lemmy.example");

		expect(contains).toHaveBeenCalledWith({
			origins: ["https://lemmy.example/*"],
		});
		expect(mockedSetValue).toHaveBeenCalledWith(
			Settings.LEMMYDOMAIN,
			"lemmy.example",
		);
	});

	it("does not promote when pending values or permissions are missing", async () => {
		mockedGetValue.mockResolvedValueOnce("").mockResolvedValueOnce("");

		await expect(promotePendingLemmyDomain()).resolves.toBe("");
		expect(contains).not.toHaveBeenCalled();

		mockedGetValue.mockReset();
		mockedSetValue.mockReset();
		mockedGetValue.mockImplementation(getPendingDomainSetting);
		contains.mockResolvedValueOnce(false);

		await expect(promotePendingLemmyDomain()).resolves.toBe("");
		expect(mockedSetValue).not.toHaveBeenCalled();
	});
});
