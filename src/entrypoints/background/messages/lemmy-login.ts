import { z } from "zod";

import { buildLemmyApiUrl, requestJson } from "@/utils/tools/request-tools";
import type { LemmyLoginRequest } from "@/utils/types/network-requests";
import type { FetchResponse } from "@/utils/types/network-responses";

const lemmyLoginResponseSchema = z.object({
	jwt: z.string().optional(),
});

async function lemmyLogin(
	request: LemmyLoginRequest,
): Promise<FetchResponse<string>> {
	const url = await buildLemmyApiUrl({ endpoint: "user/login" });

	const response = await requestJson(url, lemmyLoginResponseSchema, {
		data: request,
		method: "POST",
	});

	if (!response.success) {
		return response;
	}

	const token = response.value.jwt;

	if (!token) {
		return { errorMessage: "Failed to log in.", success: false };
	}

	return { success: true, value: token };
}

export { lemmyLogin };
