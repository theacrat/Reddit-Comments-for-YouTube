import { Kind, REDDIT_LINK_DOMAIN, Website } from "@/utils/constants";
import {
	lemmyCommentParser,
	redditCommentParser,
} from "@/utils/tools/comment-tools";
import {
	buildLemmyUrl,
	convertRedditUserVotes,
} from "@/utils/tools/request-tools";
import { lemmyTimestampToEpoch } from "@/utils/tools/time-tools";
import type {
	LemmyCommentResponse,
	RedditCommentResponse,
	RedditMoreResponse,
	RedditReplyResponse,
} from "@/utils/types/api-reponses";
import type { MoreReplies, Comment } from "@/utils/types/elements";

interface CommentMapperBaseParams {
	threadId: string;
}

function isMappableRedditReply(thread: RedditReplyResponse) {
	return ["more", "t1"].includes(thread.kind);
}

interface MapRedditRepliesParams extends RedditCommentsToCommentsParams {
	mapReply: (params: MapRedditReplyParams) => Promise<Comment | MoreReplies>;
}

async function mapRedditReplies({
	mapReply,
	threadId,
	threads,
}: MapRedditRepliesParams) {
	return Promise.all(
		threads.flatMap((thread) =>
			isMappableRedditReply(thread) ? [mapReply({ thread, threadId })] : [],
		),
	);
}

interface BuildRedditCommentParams extends CommentMapperBaseParams {
	data: RedditCommentResponse["data"];
}

function buildRedditComment({ data, threadId }: BuildRedditCommentParams) {
	const userVote = convertRedditUserVotes(data.likes);

	const comment: Comment = {
		author: data.author,
		authorLink: `${REDDIT_LINK_DOMAIN}/user/${data.author}`,
		body: data.body,
		bodyHtml: redditCommentParser({
			content: data.body,
			media: data.media_metadata ?? {},
		}),
		childCount: 0,
		controversial: data.controversiality,
		createdTimestamp: data.created_utc,
		distinguishedPoster: data.is_submitter
			? "op"
			: (data.distinguished ?? undefined),
		editedTimestamp: data.edited ?? undefined,
		fullId: data.name,
		id: data.id,
		kind: Kind.COMMENT,
		link: REDDIT_LINK_DOMAIN + data.permalink,
		locked: data.locked,
		parent: data.parent_id,
		remainingChildren: 0,
		replies: [],
		score: data.score - userVote,
		scoreHidden: data.score_hidden,
		stickied: data.stickied,
		thread: threadId,
		userVote,
		website: Website.REDDIT,
	};

	return comment;
}

interface BuildRedditMoreReplyParams extends CommentMapperBaseParams {
	data: RedditMoreResponse["data"];
}

function buildRedditMoreReply({ data, threadId }: BuildRedditMoreReplyParams) {
	const moreReplies = {
		children: data.children ?? [],
		count: data.count ?? 0,
		fullId: data.name,
		id: data.id,
		kind: Kind.MORE,
		parent: data.parent_id,
		threadId: `t3_${threadId}`,
		website: Website.REDDIT,
	};

	return moreReplies;
}

interface MapRedditReplyParams extends CommentMapperBaseParams {
	thread: RedditReplyResponse;
}

async function mapRedditReply({
	thread,
	threadId,
}: MapRedditReplyParams): Promise<Comment | MoreReplies> {
	if (thread.kind === "t1") {
		const { data } = thread;

		const comment = buildRedditComment({ data, threadId });

		if (data.replies !== "" && typeof data.replies === "object") {
			const replies = await mapRedditReplies({
				mapReply: mapRedditReply,
				threadId,
				threads: data.replies.data.children,
			});

			comment.replies.push(...replies);
		}

		return comment;
	}

	return buildRedditMoreReply({ data: thread.data, threadId });
}

interface RedditCommentsToCommentsParams extends CommentMapperBaseParams {
	threads: RedditReplyResponse[];
}

async function redditCommentsToComments({
	threadId,
	threads,
}: RedditCommentsToCommentsParams) {
	return mapRedditReplies({
		mapReply: mapRedditReply,
		threadId,
		threads,
	});
}

interface MapLemmyReplyParams extends CommentMapperBaseParams {
	thread: LemmyCommentResponse;
}

async function mapLemmyReply({ thread, threadId }: MapLemmyReplyParams) {
	const { comment: data, creator, counts } = thread;

	const author = `${creator.name}@${creator.actor_id.split("/")[2]}`;

	const comment: Comment = {
		author: `@${author}`,
		authorLink: await buildLemmyUrl({ endpoint: `u/${author}` }),
		body: data.content,
		bodyHtml: await lemmyCommentParser(data.content),
		childCount: counts.child_count,
		controversial: false,
		createdTimestamp: lemmyTimestampToEpoch(data.published),
		distinguishedPoster: undefined,
		editedTimestamp: data.updated
			? lemmyTimestampToEpoch(data.updated)
			: undefined,
		fullId: data.id,
		id: data.id,
		kind: Kind.COMMENT,
		link: await buildLemmyUrl({ endpoint: `/comment/${data.id}` }),
		locked: false,
		parent: data.path.split(".").at(-2) ?? "",
		remainingChildren: counts.child_count,
		replies: [],
		score: counts.score - thread.my_vote,
		scoreHidden: false,
		stickied: false,
		thread: threadId,
		userVote: thread.my_vote,
		website: Website.LEMMY,
	};

	return comment;
}

interface NestLemmyRepliesParams {
	mappedComments: Comment[];
	parentString?: string | undefined;
}

function nestLemmyReplies({
	mappedComments,
	parentString,
}: NestLemmyRepliesParams) {
	for (const comment of mappedComments) {
		if (comment.parent === parentString) {
			continue;
		}

		const parent = mappedComments.find((entry) => entry.id === comment.parent);

		if (!parent) {
			continue;
		}

		parent.replies.push(comment);
		parent.remainingChildren -= comment.childCount + 1;
	}
}

interface GetParentLemmyRepliesParams extends CommentMapperBaseParams {
	mappedComments: Comment[];
	parentString: string;
}

function getParentLemmyReplies({
	mappedComments,
	parentString,
	threadId,
}: GetParentLemmyRepliesParams) {
	return mappedComments.flatMap((comment) => {
		if (comment.remainingChildren > 0) {
			const moreChildren: MoreReplies = {
				children: [],
				count: comment.remainingChildren,
				fullId: "",
				id: "",
				kind: Kind.MORE,
				parent: comment.id,
				threadId,
				website: Website.LEMMY,
			};
			comment.replies.push(moreChildren);
		}

		return comment.parent === parentString ? comment : [];
	});
}

interface LemmyCommentsToCommentsParams extends CommentMapperBaseParams {
	parentString?: string | undefined;
	threads: LemmyCommentResponse[];
}

async function lemmyCommentsToComments({
	parentString,
	threadId,
	threads,
}: LemmyCommentsToCommentsParams) {
	const mappedComments = await Promise.all(
		threads.map(async (thread) => mapLemmyReply({ thread, threadId })),
	);

	nestLemmyReplies({ mappedComments, parentString });

	if (!parentString) {
		return mappedComments;
	}

	return getParentLemmyReplies({ mappedComments, parentString, threadId });
}

export { lemmyCommentsToComments, redditCommentsToComments };
