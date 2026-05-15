import type { Site } from "@/utils/types/site";

interface ScannedElements {
	anchorElement: HTMLElement;
	titleElement: HTMLElement;
	usernameElement: HTMLAnchorElement;
	videoElement: HTMLVideoElement;
}

interface QueriedElements {
	anchorElement: HTMLElement | null;
	titleElement: HTMLElement | null;
	usernameElement: HTMLAnchorElement | null;
	videoElement: HTMLVideoElement | null;
}

type ElementScanResult =
	| { status: "missing" }
	| { status: "await-video-metadata" }
	| { elements: ScannedElements; status: "ready" };

function isScannedElements(
	elements: QueriedElements,
): elements is ScannedElements {
	return (
		elements.anchorElement instanceof HTMLElement &&
		elements.titleElement instanceof HTMLElement &&
		elements.usernameElement instanceof HTMLAnchorElement &&
		elements.videoElement instanceof HTMLVideoElement
	);
}

function getQueriedElements(site: Site): QueriedElements {
	return {
		anchorElement: document.querySelector<HTMLElement>(site.anchorElement),
		titleElement: document.querySelector<HTMLElement>(site.titleElement),
		usernameElement: document.querySelector<HTMLAnchorElement>(
			site.usernameElement,
		),
		videoElement: document.querySelector<HTMLVideoElement>(site.videoElement),
	};
}

function getDisabledSearchElements(anchorElement: HTMLElement) {
	const scannedElements: ScannedElements = {
		anchorElement,
		titleElement: document.createElement("div"),
		usernameElement: document.createElement("a"),
		videoElement: document.createElement("video"),
	};

	return scannedElements;
}

function hasVideoMetadata(videoElement: HTMLVideoElement) {
	return videoElement.readyState >= HTMLMediaElement.HAVE_METADATA;
}

async function waitForVideoMetadata(video: HTMLVideoElement) {
	if (hasVideoMetadata(video)) {
		return;
	}

	const { promise, resolve } = Promise.withResolvers();

	video.addEventListener(
		"loadedmetadata",
		() => {
			resolve(undefined);
		},
		{ once: true },
	);

	await promise;
}

function scanElements({ searchYouTubeEnabled, site }: WaitForElementsParams) {
	const elements = getQueriedElements(site);

	if (!searchYouTubeEnabled && elements.anchorElement instanceof HTMLElement) {
		return {
			elements: getDisabledSearchElements(elements.anchorElement),
			status: "ready",
		} satisfies ElementScanResult;
	}

	if (!isScannedElements(elements)) {
		return { status: "missing" } satisfies ElementScanResult;
	}

	if (hasVideoMetadata(elements.videoElement)) {
		return { elements, status: "ready" } satisfies ElementScanResult;
	}

	return { status: "await-video-metadata" } satisfies ElementScanResult;
}

async function resolveAndAwaitVideo(site: Site) {
	const elements = getQueriedElements(site);

	if (!isScannedElements(elements)) {
		return;
	}

	await waitForVideoMetadata(elements.videoElement);

	return elements;
}

interface CheckElementsParams extends WaitForElementsParams {
	observer: MutationObserver;
	resolve: ReturnType<typeof Promise.withResolvers<ScannedElements>>["resolve"];
}

async function checkElements({
	observer,
	resolve,
	...params
}: CheckElementsParams) {
	const result = scanElements(params);

	switch (result.status) {
		case "missing": {
			return;
		}

		case "await-video-metadata": {
			const elements = await resolveAndAwaitVideo(params.site);

			if (!elements) {
				return;
			}

			observer.disconnect();
			resolve(elements);

			return;
		}

		case "ready": {
			observer.disconnect();
			resolve(result.elements);
		}
	}
}

interface WaitForElementsParams {
	searchYouTubeEnabled: boolean;
	site: Site;
}

async function waitForElements(params: WaitForElementsParams) {
	const { promise, resolve } = Promise.withResolvers<ScannedElements>();

	const observer = new MutationObserver((_mutations, self) => {
		void checkElements({ ...params, observer: self, resolve });
	});

	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
	});

	void checkElements({ ...params, observer, resolve });

	return promise;
}

export { waitForElements };
