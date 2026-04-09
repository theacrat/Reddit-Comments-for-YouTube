import type { Kind, Website } from "../constants";
import type { SelectOption } from "@/components/threads/interactable/CustomSelect.svelte";

export interface Element {
	kind: Kind;
	id: string;
	fullId: string;
	website: Website;
}

export type Replies = (Reply | MoreReplies)[];

export interface Thread extends Element, SelectOption<string> {
	kind: Kind.THREAD;
	id: string;
	fullId: string;
	title: string;
	plainTitle: string;
	author: string;
	authorLink: string;
	link: string;
	linkedTimestamp?: number;
	submissionLink: string;
	community: string;
	communityLink: string;
	score: number;
	comments: number;
	createdTimestamp: number;
	userVote: number;
	archived: boolean;
	locked: boolean;
	replies: Replies;
	page: number;
	remainingChildren: number;
}

export interface Reply extends Element {
	kind: Kind.COMMENT;
	parent: string;
	thread: string;
	body: string;
	bodyHtml?: string;
	author: string;
	authorLink: string;
	link: string;
	score: number;
	replies: Replies;
	createdTimestamp: number;
	editedTimestamp: number | null;
	distinguishedPoster: "op" | "moderator" | "admin" | null;
	stickied: boolean;
	scoreHidden: boolean;
	userVote: number;
	locked: boolean;
	controversial: boolean;
	childCount: number;
	remainingChildren: number;
}

export interface Media {
	[mediaId: string]: {
		e: string;
		s?: {
			x: number;
			y: number;
			u?: string;
			gif?: string;
		};
	};
}

export interface MoreReplies extends Element {
	kind: Kind.MORE;
	id: string;
	fullId: string;
	parent: string;
	threadId: string;
	count: number;
	children: string[];
	page?: number;
}

export type User = {
	website: Website;
	token: string;
	username: string;
	isSuspended: boolean;
};
