import { defineExtensionMessaging } from "@webext-core/messaging";

import type { Comment, Replies, Thread } from "./types/elements";
import type {
	CommentRequest,
	DeleteRequest,
	GetCommentsRequest,
	GetMoreChildrenRequest,
	GetThreadsRequest,
	LemmyLoginRequest,
	SearchYouTubeRequest,
	VoteRequest,
} from "./types/network-requests";
import type { CommentResponse, FetchResponse } from "./types/network-responses";
import type { Site } from "./types/site";

interface PopupThreadsResponse {
	site?: Site;
	threads?: Thread[];
	url?: URL;
}

interface ProtocolMap {
	comment(request: CommentRequest): FetchResponse<Comment>;
	deleteComment(request: DeleteRequest): FetchResponse<undefined>;
	getComments(request: GetCommentsRequest): FetchResponse<CommentResponse>;
	getMoreChildren(request: GetMoreChildrenRequest): FetchResponse<Replies>;
	getPopupThreads(request: number): PopupThreadsResponse;
	getThreads(request: GetThreadsRequest): FetchResponse<Thread[]>;
	lemmyLogin(request: LemmyLoginRequest): FetchResponse<string>;
	searchYouTube(
		request: SearchYouTubeRequest,
	): FetchResponse<string | undefined>;
	vote(request: VoteRequest): FetchResponse<undefined>;
}

const messaging = defineExtensionMessaging<ProtocolMap>();

const onMessage = messaging.onMessage.bind(messaging);
const sendMessage = messaging.sendMessage.bind(messaging);

export { onMessage, sendMessage };
