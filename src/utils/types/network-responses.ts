import type { Replies, User } from "./elements";

type FetchResponse<T> =
	| {
			success: true;
			value: T;
	  }
	| {
			errorMessage: string;
			success: false;
	  };

interface CommentResponse {
	isBanned?: boolean | undefined;
	replies: Replies;
	user?: User | undefined;
}

export type { FetchResponse, CommentResponse };
