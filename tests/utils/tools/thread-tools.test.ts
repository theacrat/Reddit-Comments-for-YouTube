import { describe, expect, it, vi } from "vitest";

import { Kind, ThreadSort, Website } from "@/utils/constants";
import { Settings, getValue } from "@/utils/settings";
import {
	applyLemmyMoreChildren,
	getDefaultSort,
	isThreadSort,
	sortThreadList,
} from "@/utils/tools/thread-tools";
import type { Comment, MoreReplies, Thread } from "@/utils/types/elements";

vi.mock("#i18n", () => ({
	i18n: {
		t: (key: string) => key,
	},
}));

vi.mock("@/utils/settings", () => ({
	Settings: {
		DEFAULTSORT: "defaultSort",
		DEFAULTSORTLEMMY: "defaultSortLemmy",
	},
	getValue: vi.fn(),
}));

function makeThread(overrides: Partial<Thread>): Thread {
	return {
		archived: false,
		author: "author",
		authorLink: "",
		comments: 0,
		community: "r/test",
		communityLink: "",
		createdTimestamp: 0,
		fullId: "t3_id",
		id: "id",
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
		fullId: "comment",
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
		website: Website.LEMMY,
		...overrides,
	};
}

async function getMockDefaultSort(name: Settings) {
	await Promise.resolve();

	return name === Settings.DEFAULTSORT ? "top" : "Hot";
}

describe("isThreadSort", () => {
	it("accepts known thread sort values only", () => {
		expect(isThreadSort(ThreadSort.COMMENTS)).toBe(true);
		expect(isThreadSort("missing")).toBe(false);
		expect(isThreadSort(1)).toBe(false);
	});
});

describe("sortThreadList", () => {
	const threads = [
		makeThread({
			comments: 2,
			community: "r/Zed",
			createdTimestamp: 20,
			id: "b",
			plainTitle: "Beta",
			score: 50,
		}),
		makeThread({
			comments: 10,
			community: "r/alpha",
			createdTimestamp: 10,
			id: "a",
			plainTitle: "Alpha",
			score: 25,
		}),
		makeThread({
			comments: 10,
			community: "r/Beta",
			createdTimestamp: 30,
			id: "c",
			plainTitle: "Gamma",
			score: 25,
		}),
	];

	it("sorts by comments, newest, score, and community with title tiebreaks", () => {
		expect(
			sortThreadList({ sort: ThreadSort.COMMENTS, threads }).map(
				(thread) => thread.id,
			),
		).toStrictEqual(["a", "c", "b"]);
		expect(
			sortThreadList({ sort: ThreadSort.NEWEST, threads }).map(
				(thread) => thread.id,
			),
		).toStrictEqual(["c", "b", "a"]);
		expect(
			sortThreadList({ sort: ThreadSort.SCORE, threads }).map(
				(thread) => thread.id,
			),
		).toStrictEqual(["b", "a", "c"]);
		expect(
			sortThreadList({ sort: ThreadSort.COMMUNITY, threads }).map(
				(thread) => thread.id,
			),
		).toStrictEqual(["a", "c", "b"]);
	});

	it("does not mutate the input array", () => {
		const sorted = sortThreadList({ sort: ThreadSort.SCORE, threads });

		expect(sorted).not.toBe(threads);
		expect(threads.map((thread) => thread.id)).toStrictEqual(["b", "a", "c"]);
	});
});

describe("getDefaultSort", () => {
	it("uses the Reddit default for Reddit threads and the Lemmy default for Lemmy threads", async () => {
		const mockedGetValue = vi.mocked(getValue);
		mockedGetValue.mockImplementation(getMockDefaultSort);

		await expect(
			getDefaultSort(makeThread({ website: Website.REDDIT })),
		).resolves.toBe("top");
		await expect(
			getDefaultSort(makeThread({ website: Website.LEMMY })),
		).resolves.toBe("Hot");
	});
});

describe("applyLemmyMoreChildren", () => {
	it("returns non-Lemmy threads unchanged", () => {
		const thread = makeThread({ website: Website.REDDIT });

		expect(applyLemmyMoreChildren(thread)).toBe(thread);
	});

	it("adds a Lemmy more-replies marker for remaining top-level comments", () => {
		const thread = makeThread({
			comments: 5,
			id: "thread",
			page: 3,
			replies: [
				makeComment({ childCount: 1, id: "visible" }),
				{
					children: ["old"],
					count: 99,
					fullId: "",
					id: "",
					kind: Kind.MORE,
					parent: "thread",
					threadId: "thread",
					website: Website.LEMMY,
				} satisfies MoreReplies,
			],
			website: Website.LEMMY,
		});

		const result = applyLemmyMoreChildren(thread);

		expect(result.remainingChildren).toBe(3);
		expect(result.replies).toHaveLength(2);
		expect(result.replies.at(-1)).toStrictEqual({
			children: [],
			count: 3,
			fullId: "",
			id: "",
			kind: Kind.MORE,
			page: 3,
			parent: "thread",
			threadId: "thread",
			website: Website.LEMMY,
		});
	});

	it("removes stale more-replies markers when all children are loaded", () => {
		const thread = makeThread({
			comments: 1,
			id: "thread",
			replies: [
				makeComment({ childCount: 0, id: "visible" }),
				{
					children: ["old"],
					count: 99,
					fullId: "",
					id: "",
					kind: Kind.MORE,
					parent: "thread",
					threadId: "thread",
					website: Website.LEMMY,
				} satisfies MoreReplies,
			],
			website: Website.LEMMY,
		});

		const result = applyLemmyMoreChildren(thread);

		expect(result.remainingChildren).toBe(0);
		expect(result.replies).toStrictEqual([thread.replies[0]]);
	});
});
