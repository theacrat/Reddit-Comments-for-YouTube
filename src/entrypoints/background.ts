import { onMessage } from "@/utils/messaging";
import { promotePendingLemmyDomain } from "@/utils/tools/lemmy-domain-tools";

import { getComments } from "./background/messages/get-comments";
import { getMoreChildren } from "./background/messages/get-more-children";
import { getThreads } from "./background/messages/get-threads";
import {
	comment,
	deleteComment,
	vote,
} from "./background/messages/interactions";
import { lemmyLogin } from "./background/messages/lemmy-login";
import { searchYouTube } from "./background/messages/search-youtube";
import { getPopup, getPopupThreads, removeFromDicts } from "./background/popup";

interface PopupDictRequest {
	id: "DICTREQUEST";
	tab: number;
}

function isPopupDictRequest(data: unknown): data is PopupDictRequest {
	if (typeof data !== "object" || data === null) {
		return false;
	}

	return (
		"id" in data &&
		"tab" in data &&
		data.id === "DICTREQUEST" &&
		typeof data.tab === "number"
	);
}

export default defineBackground(() => {
	onMessage("comment", async ({ data }) => comment(data));
	onMessage("deleteComment", async ({ data }) => deleteComment(data));
	onMessage("getComments", async ({ data }) => getComments(data));
	onMessage("getMoreChildren", async ({ data }) => getMoreChildren(data));
	onMessage("getThreads", async ({ data }) => getThreads(data));
	onMessage("vote", async ({ data }) => vote(data));
	onMessage("lemmyLogin", async ({ data }) => lemmyLogin(data));
	onMessage("searchYouTube", async ({ data }) => searchYouTube(data));

	browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
		if (changeInfo.status === "complete") {
			void getPopup(tabId);
		}

		if (changeInfo.url) {
			void browser.tabs.sendMessage(tabId, {
				hasUrlChanged: true,
			});
		}
	});

	browser.tabs.onRemoved.addListener((tabId) => {
		removeFromDicts(tabId);
	});

	browser.permissions.onAdded.addListener(() => {
		void (async () => {
			await promotePendingLemmyDomain();
		})();
	});

	browser.runtime.onMessage.addListener((data: unknown) => {
		if (isPopupDictRequest(data)) {
			void browser.runtime.sendMessage({
				dict: getPopupThreads(data.tab),
				id: "DICTRESPONSE",
				tab: data.tab,
			});
		}
	});
});
