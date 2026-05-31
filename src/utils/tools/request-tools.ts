import axios, { isAxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";
import type { ZodType } from "zod";

import { Settings, getValue } from "@/utils/settings";
import type { FetchResponse } from "@/utils/types/network-responses";

type SearchParamValue = boolean | number | string | undefined;

interface BuildLemmyUrlParams {
	api?: boolean;
	endpoint: string;
}

async function buildLemmyUrl({ api = false, endpoint }: BuildLemmyUrlParams) {
	const domain = await getValue(Settings.LEMMYDOMAIN);
	const normalisedEndpoint = endpoint.startsWith("/")
		? endpoint
		: `/${endpoint}`;

	return `https://${domain}${api ? "/api/v3" : ""}${normalisedEndpoint}`;
}

function appendSearchParams(
	url: URL,
	searchParams: Record<string, SearchParamValue>,
) {
	for (const [key, value] of Object.entries(searchParams)) {
		if (value === undefined) {
			continue;
		}

		url.searchParams.append(key, value.toString());
	}

	return url;
}

interface BuildLemmyApiUrlParams {
	endpoint: string;
	searchParams?: Record<string, SearchParamValue>;
}

async function buildLemmyApiUrl({
	endpoint,
	searchParams = {},
}: BuildLemmyApiUrlParams) {
	const url = new URL(await buildLemmyUrl({ api: true, endpoint }));

	return appendSearchParams(url, searchParams);
}

function getLemmyAuthHeaders(token: string) {
	return {
		Authorization: `Bearer ${token}`,
	};
}

async function getStoredLemmyAuthConfig(): Promise<AxiosRequestConfig> {
	const token = await getValue(Settings.LEMMYTOKEN);

	return token ? { headers: getLemmyAuthHeaders(token) } : {};
}

function convertRedditUserVotes(likes: boolean | null) {
	if (likes === null) {
		return 0;
	}

	return likes ? 1 : -1;
}

function getRequestErrorMessage(error: unknown) {
	if (isAxiosError(error)) {
		if (error.response) {
			return `${error.response.status} ${error.response.statusText}`;
		}

		return navigator.onLine ? "Network error" : "Internet offline";
	}

	return error instanceof Error ? error.message : "Unknown request error";
}

function normalise(url: string | URL) {
	return url.toString();
}

async function requestCatch<T = unknown>(
	url: string | URL,
	config?: AxiosRequestConfig,
): Promise<FetchResponse<T>> {
	try {
		const response = await axios.request<T>({
			url: normalise(url),
			...config,
		});

		return { success: true, value: response.data };
	} catch (error) {
		return {
			errorMessage: getRequestErrorMessage(error),
			success: false,
		};
	}
}

async function requestJson<T = unknown>(
	url: string | URL,
	config?: AxiosRequestConfig,
): Promise<FetchResponse<T>>;
async function requestJson<T>(
	url: string | URL,
	schema: ZodType<T>,
	config?: AxiosRequestConfig,
): Promise<FetchResponse<T>>;
async function requestJson<T>(
	url: string | URL,
	schemaOrConfig?: AxiosRequestConfig | ZodType<T>,
	config?: AxiosRequestConfig,
): Promise<FetchResponse<T>> {
	if (!schemaOrConfig || !("safeParse" in schemaOrConfig)) {
		return requestCatch<T>(url, schemaOrConfig);
	}

	const response = await requestCatch(url, config);

	if (!response.success) {
		return response;
	}

	const parsed = schemaOrConfig.safeParse(response.value);

	if (!parsed.success) {
		console.error(parsed.error);

		return {
			errorMessage: "Invalid response shape.",
			success: false,
		};
	}

	return { success: true, value: parsed.data };
}

async function requestText(url: string | URL, config?: AxiosRequestConfig) {
	return requestCatch<string>(url, {
		...config,
		responseType: "text",
	});
}

export {
	appendSearchParams,
	buildLemmyApiUrl,
	buildLemmyUrl,
	convertRedditUserVotes,
	getLemmyAuthHeaders,
	getStoredLemmyAuthConfig,
	requestCatch,
	requestJson,
	requestText,
};
