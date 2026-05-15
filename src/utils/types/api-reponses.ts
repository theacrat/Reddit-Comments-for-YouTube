import { z } from "zod";

const userVoteSchema = z.union([z.literal(-1), z.literal(0), z.literal(1)]);

type UserVote = z.infer<typeof userVoteSchema>;

const lemmyActorSchema = z.object({
	actor_id: z.string(),
	name: z.string(),
});

const lemmyCountsSchema = z.object({
	score: z.number(),
});

const lemmyCommentResponseSchema = z.object({
	comment: z.object({
		content: z.string(),
		id: z.coerce.string(),
		path: z.string(),
		published: z.string(),
		updated: z.string().optional(),
	}),
	counts: lemmyCountsSchema.extend({
		child_count: z.number(),
	}),
	creator: lemmyActorSchema,
	my_vote: userVoteSchema.optional().default(0),
});

type LemmyCommentResponse = z.infer<typeof lemmyCommentResponseSchema>;

const lemmyThreadResponseSchema = z.object({
	community: lemmyActorSchema,
	counts: lemmyCountsSchema.extend({
		comments: z.number(),
	}),
	creator: lemmyActorSchema,
	my_vote: userVoteSchema.optional().default(0),
	post: z.object({
		id: z.coerce.string(),
		locked: z.boolean(),
		name: z.string(),
		published: z.string(),
		url: z.string(),
	}),
});

type LemmyThreadResponse = z.infer<typeof lemmyThreadResponseSchema>;

const redditMediaEntrySchema = z.union([
	z.object({
		e: z.string(),
		p: z
			.array(
				z.object({
					u: z.string(),
					x: z.number(),
					y: z.number(),
				}),
			)
			.optional(),
		s: z
			.object({
				gif: z.string().optional(),
				mp4: z.string().optional(),
				u: z.string().optional(),
				x: z.number(),
				y: z.number(),
			})
			.optional(),
	}),
	z.object({
		status: z.string(),
	}),
]);

const redditMediaSchema = z.record(z.string(), redditMediaEntrySchema);

type RedditMedia = z.infer<typeof redditMediaSchema>;

const redditPostableDataSchema = z.object({
	author: z.string(),
	id: z.string(),
	likes: z.boolean().nullable(),
	locked: z.boolean(),
	name: z.string(),
	permalink: z.string(),
	score: z.number(),
});

const redditThreadResponseSchema = z.object({
	data: redditPostableDataSchema.extend({
		archived: z.boolean(),
		created: z.number(),
		media_metadata: redditMediaSchema.optional(),
		num_comments: z.number(),
		selftext: z.string().optional(),
		subreddit: z.string(),
		title: z.string(),
		url: z.string(),
	}),
});

type RedditThreadResponse = z.infer<typeof redditThreadResponseSchema>;

const redditEditedSchema = z.preprocess(
	(value) => (value === false ? undefined : value),
	z.number().nullish(),
);

const redditMoreResponseSchema = z.object({
	data: z.object({
		children: z.array(z.string()).optional(),
		count: z.number(),
		depth: z.number(),
		id: z.string(),
		name: z.string(),
		parent_id: z.string(),
	}),
	kind: z.literal("more"),
});

type RedditMoreResponse = z.infer<typeof redditMoreResponseSchema>;

const redditCommentResponseSchema = z.object({
	data: redditPostableDataSchema.extend({
		body: z.string(),
		children: z.array(z.string()).optional(),
		controversiality: z.coerce.boolean(),
		count: z.number().optional(),
		created_utc: z.number(),
		distinguished: z
			.union([z.literal("op"), z.literal("moderator"), z.literal("admin")])
			.nullable(),
		edited: redditEditedSchema,
		is_submitter: z.boolean(),
		media_metadata: redditMediaSchema.optional(),
		parent_id: z.string(),
		get replies() {
			return z.union([
				z.string(),
				z.object({
					data: z.object({
						get children() {
							return z.array(
								z.union([
									redditCommentResponseSchema,
									redditMoreResponseSchema,
								]),
							);
						},
					}),
				}),
			]);
		},
		score_hidden: z.boolean(),
		stickied: z.boolean(),
	}),
	kind: z.literal("t1"),
});

type RedditCommentResponse = z.infer<typeof redditCommentResponseSchema>;

const redditReplyResponseSchema = z.union([
	redditCommentResponseSchema,
	redditMoreResponseSchema,
]);

type RedditReplyResponse = z.infer<typeof redditReplyResponseSchema>;

export {
	lemmyCommentResponseSchema,
	lemmyThreadResponseSchema,
	redditCommentResponseSchema,
	redditMoreResponseSchema,
	redditReplyResponseSchema,
	redditThreadResponseSchema,
};
export type {
	LemmyCommentResponse,
	LemmyThreadResponse,
	RedditCommentResponse,
	RedditMedia,
	RedditMoreResponse,
	RedditReplyResponse,
	RedditThreadResponse,
	UserVote,
};
