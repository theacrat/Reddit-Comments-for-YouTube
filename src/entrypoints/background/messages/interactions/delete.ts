import { getUser } from "@/entrypoints/background/messages/get-user";
import { REDDIT_API_DOMAIN, Website } from "@/utils/constants";
import {
	buildLemmyApiUrl,
	getLemmyAuthHeaders,
	requestCatch,
} from "@/utils/tools/request-tools";
import type { DeleteRequest } from "@/utils/types/network-requests";
import type { FetchResponse } from "@/utils/types/network-responses";

interface LemmyDeleteCommentBody {
	comment_id: number;
	deleted: true;
}

interface RedditDeleteCommentBody {
	id: string;
	uh: string;
}

async function deleteRedditComment(
	request: DeleteRequest,
): Promise<FetchResponse<undefined>> {
	const currentUser = await getUser(Website.REDDIT);

	if (!currentUser.success) {
		return currentUser;
	}

	const body = new URLSearchParams({
		id: request.id,
		uh: currentUser.value.token,
	} satisfies RedditDeleteCommentBody);

	void requestCatch(`${REDDIT_API_DOMAIN}/api/del`, {
		data: body,
		method: "POST",
	});

	return { success: true, value: undefined };
}

async function deleteLemmyComment(
	request: DeleteRequest,
): Promise<FetchResponse<undefined>> {
	const currentUser = await getUser(Website.LEMMY);

	if (!currentUser.success) {
		return currentUser;
	}

	const url = await buildLemmyApiUrl({ endpoint: "comment/delete" });
	const body = {
		comment_id: Number(request.id),
		deleted: true,
	} satisfies LemmyDeleteCommentBody;

	void requestCatch(url, {
		data: body,
		headers: getLemmyAuthHeaders(currentUser.value.token),
		method: "POST",
	});

	return { success: true, value: undefined };
}

async function deleteComment(
	request: DeleteRequest,
): Promise<FetchResponse<undefined>> {
	switch (request.website) {
		case Website.REDDIT: {
			return deleteRedditComment(request);
		}

		case Website.LEMMY: {
			return deleteLemmyComment(request);
		}
	}
}

export { deleteComment };
