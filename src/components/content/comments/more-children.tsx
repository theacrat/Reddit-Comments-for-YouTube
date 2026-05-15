import { useCallback, useState } from "react";
import { Button } from "react-aria-components";

import { ExternalLink } from "@/components/common/external-link";
import { moreChildren as moreChildrenStyles } from "@/components/common/variants/comment-variants";
import {
	useCurrentThread,
	useThreadStore,
} from "@/components/content/thread-store";
import { Kind, Website } from "@/utils/constants";
import type { CommentSort } from "@/utils/constants";
import { sendMessage } from "@/utils/messaging";
import type { MoreReplies, Replies, Thread } from "@/utils/types/elements";
import type { GetMoreChildrenRequest } from "@/utils/types/network-requests";

type ReplyPath = number[];

const styles = moreChildrenStyles();
const buttonClassName = styles.button();
const continueThreadLinkClassName = styles.continueThreadLink();
const labelClassName = styles.label();
const loadControlClassName = styles.loadControl();
const loadingClassName = styles.loading();

interface GetRepliesPathParams {
	path?: ReplyPath | undefined;
	replies: Replies;
	target: Replies;
}

function getRepliesPath({
	path = [],
	replies,
	target,
}: GetRepliesPathParams): ReplyPath | undefined {
	if (replies === target) {
		return [...path];
	}

	for (let index = 0; index < replies.length; index += 1) {
		const reply = replies[index];

		if (reply?.kind !== Kind.COMMENT) {
			continue;
		}

		path.push(index);

		const childPath = getRepliesPath({
			path,
			replies: reply.replies,
			target,
		});

		if (childPath) {
			return childPath;
		}

		path.pop();
	}

	return undefined;
}

interface GetRepliesAtPathParams {
	path: ReplyPath;
	thread: Thread;
}

function getRepliesAtPath({ path, thread }: GetRepliesAtPathParams) {
	let { replies } = thread;

	for (const index of path) {
		const reply = replies[index];
		if (!reply || reply.kind !== Kind.COMMENT) {
			return;
		}

		const { replies: childReplies } = reply;
		replies = childReplies;
	}

	return replies;
}

interface MergeMoreChildrenRepliesParams {
	moreChildren: MoreReplies;
	repliesPath: ReplyPath;
	responseReplies: Replies;
	thread: Thread;
}

function mergeMoreChildrenReplies({
	moreChildren,
	repliesPath,
	responseReplies,
	thread,
}: MergeMoreChildrenRepliesParams) {
	const targetReplies = getRepliesAtPath({ path: repliesPath, thread });

	if (!targetReplies) {
		return;
	}

	if (moreChildren.website === Website.REDDIT) {
		targetReplies.splice(
			0,
			targetReplies.length,
			...targetReplies.filter((entry) => entry.kind === Kind.COMMENT),
			...responseReplies,
		);

		return;
	}

	if (moreChildren.parent === moreChildren.threadId) {
		const existingFullIds = new Set(
			thread.replies.map((entry) => entry.fullId),
		);

		thread.replies = [
			...thread.replies.filter((entry) => entry.kind === Kind.COMMENT),
			...responseReplies.filter((entry) => !existingFullIds.has(entry.fullId)),
		];
		thread.page += 1;

		return;
	}

	targetReplies.splice(0, targetReplies.length, ...responseReplies);
}

interface LoadMoreChildrenParams {
	moreChildrenProps: MoreChildrenProps;
	handleThreadChange: (thread: Thread) => void;
	setIsLoading: (value: boolean) => void;
	sort: CommentSort;
	thread: Thread;
}

async function loadMoreChildren({
	handleThreadChange,
	moreChildrenProps,
	setIsLoading,
	sort,
	thread,
}: LoadMoreChildrenParams) {
	const { comments, moreChildren } = moreChildrenProps;

	setIsLoading(true);

	const request: GetMoreChildrenRequest = {
		moreChildren,
		page: thread.page + 1,
		sort,
	};

	const response = await sendMessage("getMoreChildren", request);

	if (!response.success) {
		setIsLoading(false);
		return;
	}

	const repliesPath = getRepliesPath({
		replies: thread.replies,
		target: comments,
	});

	if (!repliesPath) {
		setIsLoading(false);
		return;
	}

	const nextThread = structuredClone(thread);

	mergeMoreChildrenReplies({
		moreChildren,
		repliesPath,
		responseReplies: response.value,
		thread: nextThread,
	});

	handleThreadChange(nextThread);
	setIsLoading(false);
}

interface ContinueThreadLinkProps {
	moreChildren: MoreReplies;
	thread: Thread;
}

function ContinueThreadLink({ moreChildren, thread }: ContinueThreadLinkProps) {
	const permalink = `${thread.link}${moreChildren.parent.split("_")[1]}`;

	return (
		<ExternalLink className={continueThreadLinkClassName} href={permalink}>
			{i18n.t("continueThread")}
		</ExternalLink>
	);
}

function useMoreChildren(moreChildrenProps: MoreChildrenProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleThreadChange = useThreadStore(
		(state) => state.handleThreadChange,
	);
	const selectedSort = useThreadStore((state) => state.commentSort);
	const thread = useCurrentThread();

	const handlePress = useCallback(() => {
		if (isLoading || !selectedSort || !thread) {
			return;
		}

		void loadMoreChildren({
			handleThreadChange,
			moreChildrenProps,
			setIsLoading,
			sort: selectedSort?.id,
			thread,
		});
	}, [handleThreadChange, isLoading, moreChildrenProps, selectedSort, thread]);

	return { handlePress, isLoading, thread };
}

interface MoreChildrenProps {
	comments: Replies;
	moreChildren: MoreReplies;
}

function MoreChildren(props: MoreChildrenProps) {
	const { moreChildren } = props;

	const { handlePress, isLoading, thread } = useMoreChildren(props);

	if (!thread) {
		return;
	}

	if (moreChildren.id === "_") {
		return <ContinueThreadLink moreChildren={moreChildren} thread={thread} />;
	}

	return (
		<Button className={buttonClassName} onPress={handlePress}>
			{isLoading ? (
				<span className={loadingClassName}>
					{i18n.t("loadingMoreComments")}
				</span>
			) : (
				<div className={loadControlClassName}>
					<span className={labelClassName}>{i18n.t("loadMoreComments")}</span>
					<span> {i18n.t("moreCount", [String(moreChildren.count)])}</span>
				</div>
			)}
		</Button>
	);
}

export { MoreChildren };
