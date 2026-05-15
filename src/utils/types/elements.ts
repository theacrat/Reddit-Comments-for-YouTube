import type { Kind, Website } from "@/utils/constants";

import type { UserVote } from "./api-reponses";

interface SelectOption<T> {
	id: T;
	title: string;
}

interface Element {
	fullId: string;
	id: string;
	kind: Kind;
	website: Website;
}

interface MoreReplies extends Element {
	children: string[];
	count: number;
	kind: typeof Kind.MORE;
	page?: number;
	parent: string;
	threadId: string;
}

interface PostBase extends Element {
	author: string;
	authorLink: string;
	createdTimestamp: number;
	kind: typeof Kind.THREAD | typeof Kind.COMMENT;
	link: string;
	locked: boolean;
	remainingChildren: number;
	replies: Replies;
	score: number;
	userVote: UserVote;
}

interface Comment extends PostBase {
	body: string;
	bodyHtml?: string | undefined;
	childCount: number;
	controversial: boolean;
	distinguishedPoster: "op" | "moderator" | "admin" | undefined;
	editedTimestamp: number | undefined;
	kind: typeof Kind.COMMENT;
	parent: string;
	scoreHidden: boolean;
	stickied: boolean;
	thread: string;
}

type Replies = (Comment | MoreReplies)[];

interface Thread extends PostBase, SelectOption<string> {
	archived: boolean;
	comments: number;
	community: string;
	communityLink: string;
	kind: typeof Kind.THREAD;
	linkedTimestamp?: number | undefined;
	page: number;
	plainTitle: string;
	selftext_html?: string | undefined;
	submissionLink: string;
	title: string;
}

type Post = Comment | Thread;

interface User {
	isSuspended: boolean;
	token: string;
	username: string;
	website: Website;
}

export type {
	Comment,
	Element,
	MoreReplies,
	Post,
	PostBase,
	Replies,
	SelectOption,
	Thread,
	User,
	UserVote,
};
