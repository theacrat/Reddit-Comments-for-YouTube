import type { CommentSort, Kind, Website } from "@/utils/constants";

import type { MoreReplies, Thread } from "./elements";
import type { Site } from "./site";

interface WebsiteRef {
	website: Website;
}

interface EntityRef extends WebsiteRef {
	id: string;
}

interface CommentRequest extends EntityRef {
	isEdit: boolean;
	text: string;
	threadId: string;
}

type DeleteRequest = EntityRef;

interface SortedRequest {
	sort: CommentSort;
}

interface GetCommentsRequest extends SortedRequest {
	thread: Thread;
}

interface GetMoreChildrenRequest extends SortedRequest {
	moreChildren: MoreReplies;
	page: number;
}

interface GetThreadsRequest {
	site: Site;
	url: string;
	youtubeId: string | undefined;
}

interface LemmyLoginRequest {
	password: string;
	totp_2fa_token?: string;
	username_or_email: string;
}

interface SearchYouTubeRequest {
	channelId: string;
	channelName: string;
	title: string;
	videoLength: number;
}

interface VoteRequest extends EntityRef {
	kind: typeof Kind.COMMENT | typeof Kind.THREAD;
	vote: number;
}

export type {
	CommentRequest,
	DeleteRequest,
	GetCommentsRequest,
	GetMoreChildrenRequest,
	GetThreadsRequest,
	LemmyLoginRequest,
	SearchYouTubeRequest,
	VoteRequest,
};
