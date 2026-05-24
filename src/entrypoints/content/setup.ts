import type { Root } from "react-dom/client";

import { SiteId } from "@/utils/constants";
import { Settings, getValue } from "@/utils/settings";
import type { SearchYouTubeRequest } from "@/utils/types/network-requests";
import type { Site } from "@/utils/types/site";

import { waitForElements } from "./dom-wait";
import { renderSelector } from "./render";

interface ContentState {
	currentRoot: Root | undefined;
	isEditableHostSynced: boolean;
	lastVideoId: string | undefined;
	shadowUi: ShadowRootContentScriptUi<Root> | undefined;
}

interface SearchYouTubeParams {
	titleElement: HTMLElement;
	usernameElement: HTMLAnchorElement;
	videoElement: HTMLVideoElement;
}

async function searchYouTube({
	titleElement,
	usernameElement,
	videoElement,
}: SearchYouTubeParams) {
	const request: SearchYouTubeRequest = {
		channelId: usernameElement.href.split("/").pop() ?? "",
		channelName: usernameElement.textContent ?? "",
		title: titleElement.textContent ?? "",
		videoLength: videoElement.duration,
	};

	const response = await sendMessage("searchYouTube", request);

	if (!response.success) {
		console.error("searchYouTube", response.errorMessage);
		return;
	}

	return response.value ?? "";
}

type SyncHostAppearanceParams = InsertUiParams;

function isTextEntryElement(target: EventTarget | null | undefined) {
	return (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		(target instanceof HTMLElement && target.isContentEditable)
	);
}

function relatedFocusTarget(event: Event) {
	return event instanceof FocusEvent ? event.relatedTarget : undefined;
}

function syncEditableHost(shadowUi: ShadowRootContentScriptUi<Root>) {
	const { shadow, shadowHost } = shadowUi;

	shadowHost.contentEditable = "false";

	shadow.addEventListener("focusin", (event) => {
		if (isTextEntryElement(event.target)) {
			shadowHost.contentEditable = "true";
		}
	});

	shadow.addEventListener("focusout", (event) => {
		shadowHost.contentEditable = isTextEntryElement(relatedFocusTarget(event))
			? "true"
			: "false";
	});
}

function syncEditableHostOnce(state: ContentState) {
	if (!state.shadowUi || state.isEditableHostSynced) {
		return;
	}

	syncEditableHost(state.shadowUi);
	state.isEditableHostSynced = true;
}

function syncHostAppearance({
	anchorElement,
	shadowUi,
	site,
}: SyncHostAppearanceParams) {
	const anchorStyles = getComputedStyle(anchorElement);
	const rootStyles = getComputedStyle(document.documentElement);

	const { fontFamily, fontSize } = anchorStyles;

	const rootFontSize = rootStyles.fontSize;

	shadowUi.shadowHost.style.fontFamily = fontFamily;
	shadowUi.shadowHost.style.fontSize = fontSize;
	shadowUi.uiContainer.style.fontFamily = fontFamily;
	shadowUi.uiContainer.style.fontSize = fontSize;
	shadowUi.shadow
		.querySelector("html")
		?.setAttribute(
			"style",
			`font-family: ${fontFamily}; font-size: ${rootFontSize};`,
		);
	shadowUi.shadow
		.querySelector("body")
		?.setAttribute(
			"style",
			`font-family: ${fontFamily}; font-size: ${fontSize};`,
		);

	const root = document.documentElement;

	const isDark =
		(site.id === SiteId.YOUTUBE && root.hasAttribute("dark")) ||
		(site.id === SiteId.NEBULA && root.dataset["theme"] === "dark");

	shadowUi.shadowHost.toggleAttribute("data-dark", isDark);
}

interface InsertUiParams {
	anchorElement: HTMLElement;
	shadowUi: ShadowRootContentScriptUi<Root>;
	site: Site;
}

function insertUi(params: InsertUiParams) {
	const { anchorElement, shadowUi, site } = params;

	syncHostAppearance(params);

	switch (site.anchorType) {
		case "beforebegin": {
			anchorElement.before(shadowUi.shadowHost);
			break;
		}

		case "beforeend": {
			anchorElement.append(shadowUi.shadowHost);
			break;
		}

		case "afterbegin": {
			anchorElement.prepend(shadowUi.shadowHost);
			break;
		}

		case "afterend": {
			anchorElement.after(shadowUi.shadowHost);
			break;
		}
	}
}

async function siteEnabled(id: SiteId) {
	switch (id) {
		case SiteId.YOUTUBE: {
			return getValue(Settings.ENABLEYOUTUBE);
		}

		case SiteId.NEBULA: {
			return getValue(Settings.ENABLENEBULA);
		}

		case SiteId.POPUP: {
			return false;
		}
	}
}

function getVideoId(site: Site) {
	const urlMatch = globalThis.location.href.match(site.idRegex)?.[0];

	return urlMatch;
}

async function shouldSearchYouTube(site: Site) {
	return site.canMatchYouTube && (await getValue(Settings.MATCHTOYOUTUBE));
}

function resetState(state: ContentState) {
	state.shadowUi?.remove();
	state.currentRoot = undefined;
	state.lastVideoId = undefined;
}

interface SetupParams {
	site: Site;
	state: ContentState;
}

async function setup({ site, state }: SetupParams) {
	if (!(await siteEnabled(site.id))) {
		resetState(state);
		return;
	}

	const videoId = getVideoId(site);

	if (!videoId) {
		resetState(state);
		return;
	}

	const searchYouTubeEnabled = await shouldSearchYouTube(site);
	const { anchorElement, titleElement, usernameElement, videoElement } =
		await waitForElements({ searchYouTubeEnabled, site });

	if (!state.shadowUi) {
		return;
	}

	syncEditableHostOnce(state);

	if (!state.shadowUi.shadowHost.isConnected) {
		state.shadowUi.mount();
	}

	insertUi({ anchorElement, shadowUi: state.shadowUi, site });

	if (!state.currentRoot) {
		return;
	}

	const { currentRoot } = state;

	const initialYouTubeId = site.canMatchYouTube ? undefined : "";

	if (videoId !== state.lastVideoId) {
		state.lastVideoId = videoId;

		renderSelector({
			root: currentRoot,
			site,
			videoId,
			youtubeId: initialYouTubeId,
		});
	}

	const youtubeId = searchYouTubeEnabled
		? await searchYouTube({
				titleElement,
				usernameElement,
				videoElement,
			})
		: "";

	renderSelector({
		root: currentRoot,
		site,
		videoId,
		youtubeId,
	});
}

export { setup };
export type { ContentState };
