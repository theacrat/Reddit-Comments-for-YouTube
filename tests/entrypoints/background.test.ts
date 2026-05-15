import { beforeEach, describe, expect, it, vi } from "vitest";

import backgroundDefinition from "@/entrypoints/background";

type MessageHandler = (message: { data: unknown }) => unknown;
type PermissionsAddedListener = () => void;
type RuntimeMessageListener = (data: unknown) => void;
type TabRemovedListener = (tabId: number) => void;
type TabUpdatedListener = (
	tabId: number,
	changeInfo: { status?: string; url?: string },
) => void;

const {
	browserMock,
	messageHandlers,
	mockedComment,
	mockedDeleteComment,
	mockedGetComments,
	mockedGetMoreChildren,
	mockedGetPopup,
	mockedGetPopupThreads,
	mockedGetThreads,
	mockedLemmyLogin,
	mockedOnMessage,
	mockedPromotePendingLemmyDomain,
	mockedRemoveFromDicts,
	mockedSearchYouTube,
	mockedVote,
} = vi.hoisted(() => {
	const handlers = new Map<string, MessageHandler>();

	return {
		browserMock: {
			permissions: {
				onAdded: {
					addListener: vi.fn<(listener: PermissionsAddedListener) => void>(),
				},
			},
			runtime: {
				onMessage: {
					addListener: vi.fn<(listener: RuntimeMessageListener) => void>(),
				},
				sendMessage: vi.fn<(message: unknown) => void>(),
			},
			tabs: {
				onRemoved: {
					addListener: vi.fn<(listener: TabRemovedListener) => void>(),
				},
				onUpdated: {
					addListener: vi.fn<(listener: TabUpdatedListener) => void>(),
				},
				sendMessage: vi.fn<(tabId: number, message: unknown) => void>(),
			},
		},
		messageHandlers: handlers,
		mockedComment: vi.fn<(request: unknown) => unknown>(),
		mockedDeleteComment: vi.fn<(request: unknown) => unknown>(),
		mockedGetComments: vi.fn<(request: unknown) => unknown>(),
		mockedGetMoreChildren: vi.fn<(request: unknown) => unknown>(),
		mockedGetPopup: vi.fn<(tabId: number) => void>(),
		mockedGetPopupThreads: vi.fn<(tabId: number) => unknown>(),
		mockedGetThreads: vi.fn<(request: unknown) => unknown>(),
		mockedLemmyLogin: vi.fn<(request: unknown) => unknown>(),
		mockedOnMessage: vi.fn((type: string, handler: MessageHandler) => {
			handlers.set(type, handler);

			return vi.fn();
		}),
		mockedPromotePendingLemmyDomain: vi.fn<() => unknown>(),
		mockedRemoveFromDicts: vi.fn<(tabId: number) => void>(),
		mockedSearchYouTube: vi.fn<(request: unknown) => unknown>(),
		mockedVote: vi.fn<(request: unknown) => unknown>(),
	};
});

vi.mock("@/utils/messaging", () => ({
	onMessage: mockedOnMessage,
}));

vi.mock("wxt/browser", () => ({
	browser: browserMock,
}));

vi.mock("@/utils/tools/lemmy-domain-tools", () => ({
	promotePendingLemmyDomain: mockedPromotePendingLemmyDomain,
}));

vi.mock("@/entrypoints/background/messages/get-comments", () => ({
	getComments: mockedGetComments,
}));

vi.mock("@/entrypoints/background/messages/get-more-children", () => ({
	getMoreChildren: mockedGetMoreChildren,
}));

vi.mock("@/entrypoints/background/messages/get-threads", () => ({
	getThreads: mockedGetThreads,
}));

vi.mock("@/entrypoints/background/messages/interactions", () => ({
	comment: mockedComment,
	deleteComment: mockedDeleteComment,
	vote: mockedVote,
}));

vi.mock("@/entrypoints/background/messages/lemmy-login", () => ({
	lemmyLogin: mockedLemmyLogin,
}));

vi.mock("@/entrypoints/background/messages/search-youtube", () => ({
	searchYouTube: mockedSearchYouTube,
}));

vi.mock("@/entrypoints/background/popup", () => ({
	getPopup: mockedGetPopup,
	getPopupThreads: mockedGetPopupThreads,
	removeFromDicts: mockedRemoveFromDicts,
}));

function startBackground() {
	backgroundDefinition.main();
}

function getMessageHandler(type: string) {
	const handler = messageHandlers.get(type);
	if (!handler) {
		throw new Error(`Missing message handler for ${type}`);
	}

	return handler;
}

function getFirstCallArg<T>(calls: [T][]) {
	const [call] = calls;
	if (!call) {
		throw new Error("Expected listener to be registered");
	}

	return call[0];
}

describe("background entrypoint", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		messageHandlers.clear();
		startBackground();
	});

	it("returns fetch responses from request message handlers", async () => {
		const request = { id: "request" };
		const response = { success: true, value: "response" };

		mockedComment.mockResolvedValue(response);
		mockedGetComments.mockResolvedValue(response);
		mockedGetMoreChildren.mockResolvedValue(response);
		mockedGetThreads.mockResolvedValue(response);
		mockedLemmyLogin.mockResolvedValue(response);
		mockedSearchYouTube.mockResolvedValue(response);

		await Promise.all(
			[
				"comment",
				"getComments",
				"getMoreChildren",
				"getThreads",
				"lemmyLogin",
				"searchYouTube",
			].map(async (type) =>
				expect(
					Promise.resolve(getMessageHandler(type)({ data: request })),
				).resolves.toBe(response),
			),
		);

		expect(mockedComment).toHaveBeenCalledWith(request);
		expect(mockedGetComments).toHaveBeenCalledWith(request);
		expect(mockedGetMoreChildren).toHaveBeenCalledWith(request);
		expect(mockedGetThreads).toHaveBeenCalledWith(request);
		expect(mockedLemmyLogin).toHaveBeenCalledWith(request);
		expect(mockedSearchYouTube).toHaveBeenCalledWith(request);
	});

	it("returns delete and vote results to the caller", async () => {
		const request = { id: "thing" };
		const response = { success: true, value: undefined };

		mockedDeleteComment.mockResolvedValue(response);
		mockedVote.mockResolvedValue(response);

		await expect(
			Promise.resolve(getMessageHandler("deleteComment")({ data: request })),
		).resolves.toBe(response);
		await expect(
			Promise.resolve(getMessageHandler("vote")({ data: request })),
		).resolves.toBe(response);

		expect(mockedDeleteComment).toHaveBeenCalledWith(request);
		expect(mockedVote).toHaveBeenCalledWith(request);
	});

	it("updates popup state on tab lifecycle events", () => {
		const onUpdated = getFirstCallArg(
			browserMock.tabs.onUpdated.addListener.mock.calls,
		);
		const onRemoved = getFirstCallArg(
			browserMock.tabs.onRemoved.addListener.mock.calls,
		);

		onUpdated(10, { status: "complete" });
		onUpdated(11, { url: "https://example.test/path" });
		onRemoved(12);

		expect(mockedGetPopup).toHaveBeenCalledWith(10);
		expect(browserMock.tabs.sendMessage).toHaveBeenCalledWith(11, {
			hasUrlChanged: true,
		});
		expect(mockedRemoveFromDicts).toHaveBeenCalledWith(12);
	});

	it("promotes pending Lemmy domains when permissions are added", () => {
		const onAdded = getFirstCallArg(
			browserMock.permissions.onAdded.addListener.mock.calls,
		);

		onAdded();

		expect(mockedPromotePendingLemmyDomain).toHaveBeenCalledTimes(1);
	});

	it("responds to popup dictionary requests", () => {
		const popupThreads = { threads: [{ id: "thread" }] };
		mockedGetPopupThreads.mockReturnValue(popupThreads);
		const onRuntimeMessage = getFirstCallArg(
			browserMock.runtime.onMessage.addListener.mock.calls,
		);

		onRuntimeMessage({ id: "DICTREQUEST", tab: 13 });
		onRuntimeMessage({ id: "DICTREQUEST", tab: "not-a-number" });

		expect(mockedGetPopupThreads).toHaveBeenCalledWith(13);
		expect(browserMock.runtime.sendMessage).toHaveBeenCalledOnce();
		expect(browserMock.runtime.sendMessage).toHaveBeenCalledWith({
			dict: popupThreads,
			id: "DICTRESPONSE",
			tab: 13,
		});
	});
});
