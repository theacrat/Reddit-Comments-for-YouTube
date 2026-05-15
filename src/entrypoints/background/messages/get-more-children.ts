import { z } from "zod";

import {
	isLemmyCommentSort,
	isRedditCommentSort,
	REDDIT_API_DOMAIN,
	Website,
} from "@/utils/constants";
import {
	lemmyCommentsToComments,
	redditCommentsToComments,
} from "@/utils/mappers/comment-mapper";
import { buildLemmyApiUrl, requestJson } from "@/utils/tools/request-tools";
import {
	lemmyCommentResponseSchema,
	redditReplyResponseSchema,
} from "@/utils/types/api-reponses";
import type { Comment, MoreReplies, Replies } from "@/utils/types/elements";
import type { GetMoreChildrenRequest } from "@/utils/types/network-requests";
import type { FetchResponse } from "@/utils/types/network-responses";

interface LemmyMoreChildrenBody {
	limit: number;
	max_depth?: number;
	page?: number;
	parent_id?: string;
	post_id?: string;
	sort: string;
	type_: "All";
}

interface RedditMoreChildrenBody {
	api_type: "json";
	children: string;
	id: string;
	limit_children: "False";
	link_id: string;
	parent: string;
	raw_json: "1";
	sort: string;
}

const redditMoreChildrenResponseSchema = z.object({
	json: z.object({
		data: z.object({
			things: z.array(redditReplyResponseSchema),
		}),
	}),
});

const lemmyMoreChildrenResponseSchema = z.object({
	comments: z.array(lemmyCommentResponseSchema).optional(),
});

interface BuildRedditMoreChildrenBodyParams {
	moreChildren: MoreReplies;
	sort: string;
}

function buildRedditMoreChildrenBody({
	moreChildren,
	sort,
}: BuildRedditMoreChildrenBodyParams) {
	return new URLSearchParams({
		api_type: "json",
		children: moreChildren.children.join(","),
		id: moreChildren.fullId,
		limit_children: "False",
		link_id: moreChildren.threadId,
		parent: moreChildren.parent,
		raw_json: "1",
		sort,
	} satisfies RedditMoreChildrenBody);
}

function getRedditThreadId(moreChildren: MoreReplies) {
	const [, threadId] = moreChildren.threadId.split("_");

	return threadId;
}

interface NestRedditMoreChildrenParams {
	moreChildren: MoreReplies;
	moreComments: Replies;
}

function nestRedditMoreChildren({
	moreChildren,
	moreComments,
}: NestRedditMoreChildrenParams) {
	for (const comment of moreComments) {
		const parent = moreComments.find<Comment>(
			(
				candidateParent,
			): candidateParent is Exclude<typeof candidateParent, MoreReplies> =>
				candidateParent.fullId === comment.parent,
		);

		if (!parent) {
			continue;
		}

		parent.replies.push(comment);
	}

	return moreComments.filter(
		(comment) => moreChildren.parent === comment.parent,
	);
}

async function getMoreChildrenReddit({
	moreChildren,
	sort,
}: GetMoreChildrenRequest): Promise<FetchResponse<Replies>> {
	if (!isRedditCommentSort(sort)) {
		return { errorMessage: "Invalid Reddit comment sort.", success: false };
	}

	const response = await requestJson(
		`${REDDIT_API_DOMAIN}/api/morechildren`,
		redditMoreChildrenResponseSchema,
		{
			data: buildRedditMoreChildrenBody({ moreChildren, sort }),
			method: "POST",
		},
	);

	if (!response.success) {
		return response;
	}

	const threadId = getRedditThreadId(moreChildren);

	if (!threadId) {
		return { errorMessage: "Invalid Reddit thread id.", success: false };
	}

	const moreComments = await redditCommentsToComments({
		threadId,
		threads: response.value.json.data.things,
	});

	return {
		success: true,
		value: nestRedditMoreChildren({ moreChildren, moreComments }),
	};
}

async function getMoreChildrenLemmy({
	moreChildren,
	page,
	sort,
}: GetMoreChildrenRequest): Promise<FetchResponse<Replies>> {
	if (!isLemmyCommentSort(sort)) {
		return { errorMessage: "Invalid Lemmy comment sort.", success: false };
	}

	const topLevel = moreChildren.parent === moreChildren.threadId;

	const url = await buildLemmyApiUrl({
		auth: true,
		endpoint: "comment/list",
		searchParams: {
			...(topLevel
				? {
						limit: 50,
						page,
						post_id: moreChildren.threadId,
					}
				: {
						limit: 999,
						max_depth: 8,
						parent_id: moreChildren.parent,
					}),
			sort,
			type_: "All",
		} satisfies LemmyMoreChildrenBody,
	});

	const response = await requestJson(url, lemmyMoreChildrenResponseSchema);

	if (!response.success) {
		return response;
	}

	if (!response.value.comments) {
		return { errorMessage: "Failed to get comments.", success: false };
	}

	const mappedComments = await lemmyCommentsToComments({
		parentString: topLevel ? "0" : moreChildren.parent,
		threadId: moreChildren.threadId,
		threads: response.value.comments,
	});

	return {
		success: true,
		value: mappedComments,
	};
}

async function getMoreChildren(
	request: GetMoreChildrenRequest,
): Promise<FetchResponse<Replies>> {
	switch (request.moreChildren.website) {
		case Website.REDDIT: {
			return getMoreChildrenReddit(request);
		}

		case Website.LEMMY: {
			return getMoreChildrenLemmy(request);
		}
	}
}

export { getMoreChildren };
