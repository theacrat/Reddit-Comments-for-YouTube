import { describe, expect, it, vi } from "vitest";

import { canUserInteractWithThread } from "@/components/content/thread-store";
import { Kind, Website } from "@/utils/constants";
import type { Thread, User } from "@/utils/types/elements";

vi.mock("#i18n", () => ({
	i18n: {
		t: (key: string) => key,
	},
}));

function makeThread(overrides: Partial<Thread> = {}): Thread {
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

function makeUser(overrides: Partial<User> = {}): User {
	return {
		isSuspended: false,
		token: "token",
		username: "user",
		website: Website.REDDIT,
		...overrides,
	};
}

describe("canUserInteractWithThread", () => {
	it("requires a logged-in user for the active thread website", () => {
		expect(
			canUserInteractWithThread({
				thread: makeThread(),
				user: makeUser(),
			}),
		).toBe(true);

		expect(
			canUserInteractWithThread({
				thread: makeThread(),
				user: undefined,
			}),
		).toBe(false);

		expect(
			canUserInteractWithThread({
				thread: makeThread({ website: Website.LEMMY }),
				user: makeUser({ website: Website.REDDIT }),
			}),
		).toBe(false);
	});

	it("blocks archived threads and suspended users", () => {
		expect(
			canUserInteractWithThread({
				thread: makeThread({ archived: true }),
				user: makeUser(),
			}),
		).toBe(false);

		expect(
			canUserInteractWithThread({
				thread: makeThread(),
				user: makeUser({ isSuspended: true }),
			}),
		).toBe(false);
	});
});
