import { z } from "zod";

import { getUser } from "@/entrypoints/background/messages/get-user";
import { Kind, REDDIT_API_DOMAIN, Website } from "@/utils/constants";
import {
	lemmyCommentsToComments,
	redditCommentsToComments,
} from "@/utils/mappers/comment-mapper";
import {
	buildLemmyApiUrl,
	getLemmyAuthHeaders,
	requestJson,
} from "@/utils/tools/request-tools";
import {
	lemmyCommentResponseSchema,
	redditReplyResponseSchema,
} from "@/utils/types/api-reponses";
import type { MoreReplies, Comment } from "@/utils/types/elements";
import type { CommentRequest } from "@/utils/types/network-requests";
import type { FetchResponse } from "@/utils/types/network-responses";

interface LemmyCreateCommentBody {
	content: string;
	parent_id: number;
	post_id: number;
}

interface LemmyEditCommentBody {
	comment_id: number;
	content: string;
}

interface RedditCommentBody {
	api_type: "json";
	raw_json: "1";
	text: string;
	thing_id: string;
	uh: string;
}

const redditCommentInteractionResponseSchema = z.object({
	json: z.object({
		data: z.object({
			things: z.array(redditReplyResponseSchema),
		}),
		errors: z.array(z.tuple([z.string(), z.string()])).optional(),
	}),
});

const lemmyCommentInteractionResponseSchema = z.object({
	comment_view: lemmyCommentResponseSchema.optional(),
});

function isComment(reply: Comment | MoreReplies): reply is Comment {
	return reply.kind === Kind.COMMENT;
}

interface BuildLemmyCommentBodyParams {
	request: CommentRequest;
}

function buildLemmyCommentBody({ request }: BuildLemmyCommentBodyParams) {
	if (request.isEdit) {
		return {
			comment_id: Number(request.id),
			content: request.text,
		} satisfies LemmyEditCommentBody;
	}

	return {
		content: request.text,
		parent_id: Number(request.id),
		post_id: Number(request.threadId),
	} satisfies LemmyCreateCommentBody;
}

async function commentReddit(
	request: CommentRequest,
): Promise<FetchResponse<Comment>> {
	const currentUser = await getUser(Website.REDDIT);

	if (!currentUser.success) {
		return currentUser;
	}

	const url = `${REDDIT_API_DOMAIN}/api/${request.isEdit ? "editusertext" : "comment"}`;
	const body = new URLSearchParams({
		api_type: "json",
		raw_json: "1",
		text: request.text,
		thing_id: request.id,
		uh: currentUser.value.token,
	} satisfies RedditCommentBody);

	const response = await requestJson(
		url,
		redditCommentInteractionResponseSchema,
		{
			data: body,
			method: "POST",
		},
	);

	if (!response.success) {
		return response;
	}

	const [firstError] = response.value.json.errors ?? [];

	if (firstError) {
		return { errorMessage: firstError[1], success: false };
	}

	const mapped = await redditCommentsToComments({
		threadId: request.threadId,
		threads: response.value.json.data.things,
	});

	const postedComment = mapped.find((reply) => isComment(reply));
	if (!postedComment) {
		return { errorMessage: "Error posting comment.", success: false };
	}

	return {
		success: true,
		value: postedComment,
	};
}

async function commentLemmy(
	request: CommentRequest,
): Promise<FetchResponse<Comment>> {
	const currentUser = await getUser(Website.LEMMY);

	if (!currentUser.success) {
		return currentUser;
	}

	const url = await buildLemmyApiUrl({ endpoint: "comment" });
	const method = request.isEdit ? "PUT" : "POST";

	const response = await requestJson(
		url,
		lemmyCommentInteractionResponseSchema,
		{
			data: buildLemmyCommentBody({ request }),
			headers: getLemmyAuthHeaders(currentUser.value.token),
			method,
		},
	);

	if (!response.success) {
		return response;
	}

	if (!response.value.comment_view) {
		return { errorMessage: "Error posting comment.", success: false };
	}

	const mapped = await lemmyCommentsToComments({
		threadId: request.threadId,
		threads: [response.value.comment_view],
	});

	const postedComment = mapped.find((reply) => isComment(reply));

	if (!postedComment) {
		return { errorMessage: "Error posting comment.", success: false };
	}

	return {
		success: true,
		value: postedComment,
	};
}

async function comment(
	request: CommentRequest,
): Promise<FetchResponse<Comment>> {
	switch (request.website) {
		case Website.REDDIT: {
			return commentReddit(request);
		}

		case Website.LEMMY: {
			return commentLemmy(request);
		}
	}
}

export { comment };
