import { afterEach, describe, expect, it, vi } from "vitest";

import {
	lemmyTimestampToEpoch,
	numberToHms,
	parseTimestamp,
	timestampToRelativeTime,
} from "@/utils/tools/time-tools";

vi.mock("#i18n", () => ({
	i18n: {
		t: (key: string, substitutions?: number | unknown[]) => {
			if (key === "time.justNow") {
				return "just now";
			}

			const value = Array.isArray(substitutions)
				? substitutions[0]
				: substitutions;
			const valueString = String(value);

			if (key === "time.seconds") {
				return `${valueString} seconds ago`;
			}

			if (key === "time.minutes") {
				return `${valueString} minutes ago`;
			}

			if (key === "time.hours") {
				return `${valueString} hours ago`;
			}

			if (key === "time.days") {
				return `${valueString} days ago`;
			}

			return key;
		},
	},
}));

afterEach(() => {
	vi.useRealTimers();
});

describe("parseTimestamp", () => {
	it("parses plain seconds", () => {
		expect(parseTimestamp("125")).toBe(125);
	});

	it("parses colon timestamps with minutes and hours", () => {
		expect(parseTimestamp("1:02")).toBe(62);
		expect(parseTimestamp("1:02:03")).toBe(3723);
	});

	it("rejects colon timestamps with more than three sections", () => {
		expect(() => parseTimestamp("1:02:03:04")).toThrow(
			"Invalid timestamp: too many sections.",
		);
	});

	it("parses hms timestamps", () => {
		expect(parseTimestamp("1h2m3s")).toBe(3723);
		expect(parseTimestamp("2m03s")).toBe(123);
	});

	it("rejects unsupported timestamp formats", () => {
		expect(() => parseTimestamp("later")).toThrow(
			"Invalid timestamp: unsupported format.",
		);
	});
});

describe("numberToHms", () => {
	it("formats seconds as minutes and seconds", () => {
		expect(numberToHms(62)).toBe("1:02");
	});

	it("formats hour timestamps with padded minutes and seconds", () => {
		expect(numberToHms(3723)).toBe("1:02:03");
	});
});

describe("timestampToRelativeTime", () => {
	it("uses the smallest matching relative-time bucket", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-16T00:00:00Z"));

		const now = Math.floor(Date.now() / 1000);

		expect(timestampToRelativeTime(now - 5)).toBe("just now");
		expect(timestampToRelativeTime(now - 30)).toBe("30 seconds ago");
		expect(timestampToRelativeTime(now - 120)).toBe("2 minutes ago");
		expect(timestampToRelativeTime(now - 7200)).toBe("2 hours ago");
		expect(timestampToRelativeTime(now - 172_800)).toBe("2 days ago");
	});
});

describe("lemmyTimestampToEpoch", () => {
	it("treats timestamps without a zone as UTC", () => {
		expect(lemmyTimestampToEpoch("2026-05-16T00:00:00")).toBe(1_778_889_600);
	});

	it("preserves timestamps that already include a UTC marker", () => {
		expect(lemmyTimestampToEpoch("2026-05-16T00:00:00Z")).toBe(1_778_889_600);
	});
});
