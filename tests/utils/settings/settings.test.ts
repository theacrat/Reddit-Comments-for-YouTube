import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	Settings,
	addToArray,
	getValue,
	setValueAsync,
} from "@/utils/settings";

vi.mock("@wxt-dev/i18n", () => ({
	createI18n: () => ({
		t: (key: string) => {
			if (key === "duplicateEntry") {
				return "Duplicate entry, ignored.";
			}

			return key;
		},
	}),
}));

describe("settings", () => {
	beforeEach(async () => {
		await setValueAsync(Settings.COMMUNITYBLACKLIST, undefined);
	});

	it("rejects duplicate array entries after validation", async () => {
		await setValueAsync(Settings.COMMUNITYBLACKLIST, ["r/typescript"]);

		await expect(
			addToArray(Settings.COMMUNITYBLACKLIST, "TypeScript"),
		).resolves.toBe("Duplicate entry, ignored.");
		await expect(getValue(Settings.COMMUNITYBLACKLIST)).resolves.toStrictEqual([
			"r/typescript",
		]);
	});
});
