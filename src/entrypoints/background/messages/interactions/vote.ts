import { getUser } from "@/entrypoints/background/messages/get-user";
import { Kind, REDDIT_API_DOMAIN, Website } from "@/utils/constants";
import {
	buildLemmyApiUrl,
	getLemmyAuthHeaders,
	requestCatch,
} from "@/utils/tools/request-tools";
import type { VoteRequest } from "@/utils/types/network-requests";
import type { FetchResponse } from "@/utils/types/network-responses";

interface LemmyCommentVoteBody {
	comment_id: number;
	score: number;
}

interface LemmyPostVoteBody {
	post_id: number;
	score: number;
}

interface RedditVoteBody {
	dir: string;
	id: string;
	uh: string;
}

async function voteReddit(
	request: VoteRequest,
): Promise<FetchResponse<undefined>> {
	const currentUser = await getUser(Website.REDDIT);

	if (!currentUser.success) {
		return currentUser;
	}

	const body = new URLSearchParams({
		dir: request.vote.toString(),
		id: request.id,
		uh: currentUser.value.token,
	} satisfies RedditVoteBody);
	void requestCatch(`${REDDIT_API_DOMAIN}/api/vote`, {
		data: body,
		method: "POST",
	});

	return { success: true, value: undefined };
}

async function voteLemmy(
	request: VoteRequest,
): Promise<FetchResponse<undefined>> {
	const currentUser = await getUser(Website.LEMMY);

	if (!currentUser.success) {
		return currentUser;
	}

	const contentKind = request.kind === Kind.COMMENT ? "comment" : "post";
	const url = await buildLemmyApiUrl({ endpoint: `${contentKind}/like` });

	const body =
		contentKind === "comment"
			? ({
					comment_id: Number(request.id),
					score: request.vote,
				} satisfies LemmyCommentVoteBody)
			: ({
					post_id: Number(request.id),
					score: request.vote,
				} satisfies LemmyPostVoteBody);

	void requestCatch(url, {
		data: body,
		headers: getLemmyAuthHeaders(currentUser.value.token),
		method: "POST",
	});

	return { success: true, value: undefined };
}

async function vote(request: VoteRequest): Promise<FetchResponse<undefined>> {
	switch (request.website) {
		case Website.REDDIT: {
			return voteReddit(request);
		}

		case Website.LEMMY: {
			return voteLemmy(request);
		}
	}
}

export { vote };
