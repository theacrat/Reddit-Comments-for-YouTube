import {
	RedditCommentSort,
	LemmyCommentSort,
	ThreadSort,
	Website,
} from "@/utils/constants";
import { getValue, Settings } from "@/utils/settings";
import type { SelectOption, Thread } from "@/utils/types/elements";

const REDDIT_SORT_OPTIONS = Object.values(RedditCommentSort).map<
	SelectOption<RedditCommentSort>
>((option) => ({
	id: option,
	title: i18n.t(`redditCommentSortOptions.${option}`),
}));

const LEMMY_SORT_OPTIONS = Object.values(LemmyCommentSort).map<
	SelectOption<LemmyCommentSort>
>((option) => ({
	id: option,
	title: i18n.t(`lemmyCommentSortOptions.${option}`),
}));

function isThreadSort(value: unknown): value is ThreadSort {
	return (
		typeof value === "string" &&
		new Set<string>(Object.values(ThreadSort)).has(value)
	);
}

interface GetSortConditionsParams {
	sort: ThreadSort;
	threadA: Thread;
	threadB: Thread;
}

function getSortConditions({
	sort,
	threadA,
	threadB,
}: GetSortConditionsParams) {
	switch (sort) {
		case ThreadSort.COMMENTS: {
			return { conditionA: threadB.comments, conditionB: threadA.comments };
		}

		case ThreadSort.NEWEST: {
			return {
				conditionA: threadB.createdTimestamp,
				conditionB: threadA.createdTimestamp,
			};
		}

		case ThreadSort.SCORE: {
			return { conditionA: threadB.score, conditionB: threadA.score };
		}

		case ThreadSort.COMMUNITY: {
			return {
				conditionA: threadA.community.toLowerCase(),
				conditionB: threadB.community.toLowerCase(),
			};
		}
	}
}

interface SortThreadListParams {
	sort: ThreadSort;
	threads: Thread[];
}

function sortThreadList({ sort, threads }: SortThreadListParams) {
	return [...threads].toSorted((threadA, threadB) => {
		const { conditionA, conditionB } = getSortConditions({
			sort,
			threadA,
			threadB,
		});

		if (conditionA < conditionB) {
			return -1;
		}

		if (conditionA > conditionB) {
			return 1;
		}

		return threadA.plainTitle < threadB.plainTitle ? -1 : 1;
	});
}

async function getDefaultSort(thread: Thread) {
	if (thread.website === Website.REDDIT) {
		return getValue(Settings.DEFAULTSORT);
	}

	return getValue(Settings.DEFAULTSORTLEMMY);
}

function getCommentSortOptions(website: Website) {
	switch (website) {
		case Website.REDDIT: {
			return REDDIT_SORT_OPTIONS;
		}

		case Website.LEMMY: {
			return LEMMY_SORT_OPTIONS;
		}
	}
}
function applyLemmyMoreChildren(nextThread: Thread) {
	if (nextThread.website !== Website.LEMMY) {
		return nextThread;
	}

	let childComments = 0;

	for (const reply of nextThread.replies) {
		if (reply.kind === Kind.MORE) {
			continue;
		}

		childComments += reply.childCount + 1;
	}

	const remainingChildren = nextThread.comments - childComments;
	const filteredReplies = nextThread.replies.filter(
		(reply) => reply.kind === Kind.COMMENT,
	);

	nextThread.remainingChildren = remainingChildren;

	if (remainingChildren < 1) {
		nextThread.replies = filteredReplies;
		return nextThread;
	}

	nextThread.replies = [
		...filteredReplies,
		{
			children: [],
			count: remainingChildren,
			fullId: "",
			id: "",
			kind: Kind.MORE,
			page: nextThread.page,
			parent: nextThread.id,
			threadId: nextThread.id,
			website: Website.LEMMY,
		},
	];

	return nextThread;
}

export {
	applyLemmyMoreChildren,
	getCommentSortOptions,
	getDefaultSort,
	isThreadSort,
	sortThreadList,
};
