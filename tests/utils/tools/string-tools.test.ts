import { describe, expect, it, vi } from "vitest";

import { Kind, Website } from "@/utils/constants";
import { cleanString, getScoreString } from "@/utils/tools/string-tools";
import type { Comment, Thread } from "@/utils/types/elements";

vi.mock("#i18n", () => ({
	i18n: {
		t: (key: string, substitutions?: number | unknown[]) => {
			if (key === "tagline.commentScoreHidden") {
				return "score hidden";
			}

			if (key === "tagline.commentThousandUnit") {
				const score = Array.isArray(substitutions)
					? String(substitutions[0])
					: String(substitutions);

				return `${score}k`;
			}

			if (key === "tagline.commentPoints") {
				return `${String(substitutions)} points`;
			}

			return key;
		},
	},
}));

function makeComment(overrides: Partial<Comment>): Comment {
	return {
		author: "author",
		authorLink: "",
		body: "",
		childCount: 0,
		controversial: false,
		createdTimestamp: 0,
		distinguishedPoster: undefined,
		editedTimestamp: undefined,
		fullId: "t1_comment",
		id: "comment",
		kind: Kind.COMMENT,
		link: "",
		locked: false,
		parent: "thread",
		remainingChildren: 0,
		replies: [],
		score: 0,
		scoreHidden: false,
		stickied: false,
		thread: "thread",
		userVote: 0,
		website: Website.REDDIT,
		...overrides,
	};
}

function makeThread(overrides: Partial<Thread>): Thread {
	return {
		archived: false,
		author: "author",
		authorLink: "",
		comments: 0,
		community: "r/test",
		communityLink: "",
		createdTimestamp: 0,
		fullId: "t3_thread",
		id: "thread",
		kind: Kind.THREAD,
		link: "",
		locked: false,
		page: 0,
		plainTitle: "Title",
		remainingChildren: 0,
		replies: [],
		score: 0,
		submissionLink: "",
		title: "Title",
		userVote: 0,
		website: Website.REDDIT,
		...overrides,
	};
}

describe("cleanString", () => {
	it("normalizes punctuation, repeated whitespace, and casing", () => {
		expect(cleanString("One---Two\tTHREE!!")).toBe("one two three ");
	});
});

describe("getScoreString", () => {
	it("shows hidden comment scores without reading the numeric score", () => {
		expect(getScoreString(makeComment({ score: 12, scoreHidden: true }))).toBe(
			"score hidden",
		);
	});

	it("adds the user vote before formatting comment points", () => {
		expect(getScoreString(makeComment({ score: 9, userVote: 1 }))).toBe(
			"10 points",
		);
	});

	it("returns plain scores for threads below the thousands display threshold", () => {
		expect(getScoreString(makeThread({ score: 50, userVote: -1 }))).toBe("49");
	});

	it("formats large thread scores with one decimal place", () => {
		expect(getScoreString(makeThread({ score: 12_345, userVote: 0 }))).toBe(
			"12.3k",
		);
	});

	it("formats six-figure scores with no decimal places", () => {
		expect(getScoreString(makeThread({ score: 123_456, userVote: 1 }))).toBe(
			"123k",
		);
	});
});
