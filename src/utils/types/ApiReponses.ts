import { Media } from "./Elements";

export interface YouTubeSearchResponse {
	contents: {
		twoColumnSearchResultsRenderer: {
			primaryContents: {
				sectionListRenderer: {
					contents: Array<{
						itemSectionRenderer: {
							contents: Array<{
								videoRenderer?: {
									videoId: string;
									title: {
										runs: Array<{
											text: string;
										}>;
									};
									longBylineText: {
										runs: Array<{
											text: string;
											navigationEndpoint?: {
												browseEndpoint: {
													browseId: string;
												};
											};
										}>;
									};
									lengthText: {
										simpleText: string;
									};
								};
							}>;
						};
					}>;
				};
			};
		};
	};
}

export interface RedditThreadResponse {
	data: {
		id: string;
		name: string;
		title: string;
		author: string;
		url: string;
		permalink: string;
		subreddit: string;
		score: number;
		num_comments: number;
		created: number;
		likes: boolean | null;
		archived: boolean;
		locked: boolean;
	};
}

export interface LemmyThreadResponse {
	post: {
		id: number;
		name: string;
		url: string;
		published: string;
		locked: boolean;
	};
	creator: {
		name: string;
		actor_id: string;
	};
	community: {
		name: string;
		actor_id: string;
	};
	counts: {
		score: number;
		comments: number;
	};
	my_vote: number;
}

export interface RedditCommentResponse {
	kind: string;
	data: {
		id: string;
		name: string;
		parent_id: string;
		body: string;
		author: string;
		permalink: string;
		score: number;
		created_utc: number;
		edited: number | null;
		distinguished: "op" | "moderator" | "admin" | null;
		stickied: boolean;
		score_hidden: boolean;
		likes: boolean | null;
		locked: boolean;
		controversiality: number;
		is_submitter: boolean;
		media_metadata?: Media;
		replies:
			| {
					data: {
						children: RedditCommentResponse[];
					};
			  }
			| string;
		count?: number;
		children?: string[];
	};
}

export interface LemmyCommentResponse {
	comment: {
		id: number;
		content: string;
		published: string;
		updated?: string;
		path: string;
	};
	creator: {
		name: string;
		actor_id: string;
	};
	counts: {
		score: number;
		child_count: number;
	};
	my_vote: number;
}
