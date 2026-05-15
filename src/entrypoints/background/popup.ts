import { SiteId } from "@/utils/constants";
import { Settings, getValue } from "@/utils/settings";
import type { Thread } from "@/utils/types/elements";
import type { GetThreadsRequest } from "@/utils/types/network-requests";
import type { Site } from "@/utils/types/site";
import { getPopupSite } from "@/utils/types/site";

import { getThreads } from "./messages/get-threads";

const dict = new Map<
	number,
	{
		site?: Site;
		threads?: Thread[];
		url?: URL;
	}
>();

interface SetBadgeParams {
	tabId: number;
	text: string;
}

function setBadge({ tabId, text }: SetBadgeParams) {
	const options = { tabId, text };

	void browser.action.setBadgeText(options);
}

interface FilterPopupThreadsParams {
	site: Site;
	threads: Thread[];
	url: URL;
}

function filterPopupThreads({ site, threads, url }: FilterPopupThreadsParams) {
	if (site.id !== SiteId.POPUP) {
		return threads;
	}

	return threads.filter((thread) => {
		const threadUrl = new URL(thread.submissionLink);

		return threadUrl.href === url.href;
	});
}

function getOrCreateEntry(tabId: number) {
	if (!dict.has(tabId)) {
		dict.set(tabId, {});
	}

	return dict.get(tabId);
}

interface GetPopupPathParams {
	site: Site;
	url: URL;
}

function getPopupPath({ site, url }: GetPopupPathParams) {
	const fallbackPath = `${url.pathname}${url.search}`.slice(1);

	if (site.id === SiteId.POPUP) {
		return fallbackPath;
	}

	const urlMatch = url.href.match(site.idRegex)?.[0];

	return urlMatch ?? fallbackPath;
}

function getPopupThreads(tabId: number) {
	const popupEntry = dict.get(tabId);

	return {
		site: popupEntry?.site,
		threads: popupEntry?.threads,
	};
}

async function getPopup(tabId: number) {
	const enabled = await getValue(Settings.SEARCHALLSITES);

	if (!enabled) {
		return;
	}

	const activeTab = await browser.tabs.get(tabId);

	if (!activeTab.url) {
		return;
	}

	const tabUrl = new URL(activeTab.url);
	const entry = getOrCreateEntry(tabId);

	if (!entry || entry.url?.href === tabUrl.href) {
		return;
	}

	entry.url = tabUrl;

	const site = getPopupSite(tabUrl);
	const path = getPopupPath({ site, url: tabUrl });

	setBadge({ tabId, text: "..." });

	const getThreadsRequest: GetThreadsRequest = {
		site,
		url: path,
		youtubeId: undefined,
	};

	const response = await getThreads(getThreadsRequest);

	if (entry.url?.href !== tabUrl.href) {
		return;
	}

	if (!response.success) {
		setBadge({ tabId, text: "Error" });

		return;
	}

	const filteredThreads = filterPopupThreads({
		site,
		threads: response.value,
		url: tabUrl,
	});

	site.id = SiteId.POPUP;
	entry.site = site;
	entry.threads = filteredThreads;

	setBadge({ tabId, text: filteredThreads.length.toString() });

	void browser.runtime.sendMessage({
		dict: getPopupThreads(tabId),
		id: "DICTRESPONSE",
		tab: tabId,
	});
}

function removeFromDicts(tabId: number) {
	dict.delete(tabId);
}

export { getPopup, removeFromDicts, getPopupThreads };
