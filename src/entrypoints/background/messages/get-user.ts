import { z } from "zod";

import {
	REDDIT_API_DOMAIN,
	REDDIT_LINK_DOMAIN,
	Website,
} from "@/utils/constants";
import { Settings, getValue } from "@/utils/settings";
import {
	buildLemmyApiUrl,
	getLemmyAuthHeaders,
	requestJson,
} from "@/utils/tools/request-tools";
import type { User } from "@/utils/types/elements";
import type { FetchResponse } from "@/utils/types/network-responses";

let redditUser: User | undefined;
let lemmyUser: User | undefined;

const redditLoggedInUserDataSchema = z.object({
	is_suspended: z.boolean(),
	modhash: z.string(),
	name: z.string(),
});

const redditLoggedOutUserDataSchema = z.object({});

const redditUserResponseSchema = z.object({
	data: z.union([redditLoggedInUserDataSchema, redditLoggedOutUserDataSchema]),
});

const lemmyUserResponseSchema = z.object({
	my_user: z
		.object({
			local_user_view: z
				.object({
					person: z
						.object({
							actor_id: z.string(),
							banned: z.boolean(),
						})
						.optional(),
				})
				.optional(),
		})
		.optional(),
});

async function getUserReddit(): Promise<FetchResponse<User>> {
	if (redditUser) {
		return { success: true, value: redditUser };
	}

	const response = await requestJson(
		`${REDDIT_API_DOMAIN}/api/me.json`,
		redditUserResponseSchema,
	);

	if (!response.success) {
		return response;
	}

	const { data } = response.value;

	if (!data) {
		return {
			errorMessage: "Failed to get Reddit user data.",
			success: false,
		};
	}

	if (!data.modhash) {
		return { errorMessage: "User is not logged in.", success: false };
	}

	redditUser = {
		isSuspended: data.is_suspended,
		token: data.modhash,
		username: data.name ? `${REDDIT_LINK_DOMAIN}/user/${data.name}` : "",
		website: Website.REDDIT,
	};

	return { success: true, value: redditUser };
}

async function getUserLemmy(): Promise<FetchResponse<User>> {
	if (lemmyUser) {
		return { success: true, value: lemmyUser };
	}

	const token = await getValue(Settings.LEMMYTOKEN);
	if (!token) {
		return { errorMessage: "Lemmy token does not exist.", success: false };
	}

	const domain = await getValue(Settings.LEMMYDOMAIN);
	const url = await buildLemmyApiUrl({
		endpoint: "site",
	});

	const response = await requestJson(url, lemmyUserResponseSchema, {
		headers: getLemmyAuthHeaders(token),
	});
	if (!response.success) {
		return response;
	}

	const data = response.value.my_user?.local_user_view?.person;
	if (!data) {
		return {
			errorMessage: "Failed to get Lemmy user data.",
			success: false,
		};
	}

	lemmyUser = {
		isSuspended: data.banned,
		token,
		username: `${data.actor_id}@${domain}`,
		website: Website.LEMMY,
	};

	return { success: true, value: lemmyUser };
}

async function getUser(type: Website): Promise<FetchResponse<User>> {
	switch (type) {
		case Website.REDDIT: {
			return getUserReddit();
		}

		case Website.LEMMY: {
			return getUserLemmy();
		}
	}
}

function resetUser() {
	redditUser = undefined;
	lemmyUser = undefined;
}

export { getUser, resetUser };
