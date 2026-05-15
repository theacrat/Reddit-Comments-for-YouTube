import { Kind, REDDIT_LINK_DOMAIN, Website } from "@/utils/constants";
import { redditCommentParser } from "@/utils/tools/comment-tools";
import {
	buildLemmyUrl,
	convertRedditUserVotes,
} from "@/utils/tools/request-tools";
import {
	lemmyTimestampToEpoch,
	parseTimestamp,
} from "@/utils/tools/time-tools";
import type {
	LemmyThreadResponse,
	RedditThreadResponse,
} from "@/utils/types/api-reponses";
import type { Thread } from "@/utils/types/elements";

interface BuildTitleParams {
	comments: number;
	community: string;
	communityPrefix: string;
	score: number;
	title: string;
}

function buildTitle({
	comments,
	community,
	communityPrefix,
	score,
	title,
}: BuildTitleParams): string {
	const prefix = `${communityPrefix}${community}, ${score}⇧, ${comments}💬`;

	return `${prefix}\r\n${title}`;
}

function getRedditLinkedTimestamp(url: string): number | undefined {
	const linkedUrl = new URL(url.replaceAll("&amp;", "&"));
	const timestampParam = linkedUrl.searchParams.get("t");

	let linkedTimestamp: number | undefined = undefined;

	if (!timestampParam) {
		return linkedTimestamp;
	}

	try {
		linkedTimestamp = parseTimestamp(timestampParam);
	} catch {
		console.error("Invalid timestamp param", timestampParam);
	}

	return linkedTimestamp;
}

function redditThreadToThread(thread: RedditThreadResponse): Thread {
	const { data } = thread;

	const linkedTimestamp = getRedditLinkedTimestamp(data.url);
	const userVote = convertRedditUserVotes(data.likes);

	return {
		archived: data.archived,
		author: data.author,
		authorLink: `${REDDIT_LINK_DOMAIN}/user/${data.author}`,
		comments: data.num_comments,
		community: `r/${data.subreddit}`,
		communityLink: `${REDDIT_LINK_DOMAIN}/r/${data.subreddit}`,
		createdTimestamp: data.created,
		fullId: data.name,
		id: data.id,
		kind: Kind.THREAD,
		link: REDDIT_LINK_DOMAIN + data.permalink,
		linkedTimestamp,
		locked: data.locked,
		page: 0,
		plainTitle: data.title,
		remainingChildren: 0,
		replies: [],
		score: data.score - userVote,
		selftext_html:
			data.selftext &&
			redditCommentParser({
				content: data.selftext,
				media: data.media_metadata ?? {},
			}),
		submissionLink: data.url,
		title: buildTitle({
			comments: data.num_comments,
			community: data.subreddit,
			communityPrefix: "r/",
			score: data.score,
			title: data.title,
		}),
		userVote,
		website: Website.REDDIT,
	};
}

async function lemmyThreadToThread(
	thread: LemmyThreadResponse,
): Promise<Thread> {
	const { post, creator, community, counts } = thread;

	const author = `${creator.name}@${creator.actor_id.split("/")[2]}`;
	const fullCommunity = `${community.name}@${community.actor_id.split("/")[2]}`;

	return {
		archived: false,
		author: `@${author}`,
		authorLink: await buildLemmyUrl({ endpoint: `u/${author}` }),
		comments: counts.comments,
		community: `!${fullCommunity}`,
		communityLink: await buildLemmyUrl({ endpoint: `c/${fullCommunity}` }),
		createdTimestamp: lemmyTimestampToEpoch(post.published),
		fullId: post.id,
		id: post.id,
		kind: Kind.THREAD,
		link: await buildLemmyUrl({ endpoint: `post/${post.id}` }),
		locked: post.locked,
		page: 1,
		plainTitle: post.name,
		remainingChildren: counts.comments,
		replies: [],
		score: counts.score - thread.my_vote,
		submissionLink: post.url,
		title: buildTitle({
			comments: counts.comments,
			community: fullCommunity,
			communityPrefix: "!",
			score: counts.score,
			title: post.name,
		}),
		userVote: thread.my_vote,
		website: Website.LEMMY,
	};
}

export { lemmyThreadToThread, redditThreadToThread };
