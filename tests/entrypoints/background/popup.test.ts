import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	getPopup,
	getPopupThreads,
	removeFromDicts,
} from "@/entrypoints/background/popup";
import { Kind, SiteId, Website } from "@/utils/constants";
import { Settings, getValue } from "@/utils/settings";
import type { Thread } from "@/utils/types/elements";

interface ActiveTab {
	url?: string;
}

const { browserMock, mockedGetThreads, mockedGetValue } = vi.hoisted(() => ({
	browserMock: {
		action: {
			setBadgeText: vi.fn<(options: { tabId: number; text: string }) => void>(),
		},
		runtime: {
			sendMessage: vi.fn<(message: unknown) => void>(),
		},
		tabs: {
			get: vi.fn<(tabId: number) => Promise<ActiveTab>>(),
		},
	},
	mockedGetThreads: vi.fn<(request: unknown) => unknown>(),
	mockedGetValue: vi.fn<(setting: Settings) => Promise<boolean>>(),
}));

vi.mock("wxt/browser", () => ({
	browser: browserMock,
}));

vi.mock("@/utils/settings", () => ({
	Settings: {
		SEARCHALLSITES: "searchAllSites",
	},
	getValue: mockedGetValue,
}));

vi.mock("@/entrypoints/background/messages/get-threads", () => ({
	getThreads: mockedGetThreads,
}));

const mockedImportedGetValue = vi.mocked(getValue);

function createThread(overrides: Partial<Thread> = {}): Thread {
	return {
		archived: false,
		author: "author",
		authorLink: "https://example.test/user/author",
		comments: 1,
		community: "community",
		communityLink: "https://example.test/c/community",
		createdTimestamp: 1,
		fullId: "t3_thread",
		id: "thread",
		kind: Kind.THREAD,
		link: "https://example.test/thread",
		locked: false,
		page: 1,
		plainTitle: "Thread",
		remainingChildren: 0,
		replies: [],
		score: 1,
		submissionLink: "https://example.test/watch?v=abc",
		title: "Thread",
		userVote: 0,
		website: Website.REDDIT,
		...overrides,
	};
}

describe("popup background helpers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedGetValue.mockResolvedValue(true);
		mockedGetThreads.mockResolvedValue({ success: true, value: [] });
	});

	it("does nothing when all-site popup search is disabled", async () => {
		mockedGetValue.mockResolvedValue(false);

		await getPopup(101);

		expect(mockedImportedGetValue).toHaveBeenCalledWith(
			Settings.SEARCHALLSITES,
		);
		expect(browserMock.tabs.get).not.toHaveBeenCalled();
		expect(mockedGetThreads).not.toHaveBeenCalled();
	});

	it("stores popup threads, filters exact popup URL matches, and sends an update", async () => {
		const matchingThread = createThread();
		const otherThread = createThread({
			fullId: "t3_other",
			id: "other",
			submissionLink: "https://example.test/watch?v=other",
		});

		browserMock.tabs.get.mockResolvedValue({
			url: "https://example.test/watch?v=abc",
		});
		mockedGetThreads.mockResolvedValue({
			success: true,
			value: [matchingThread, otherThread],
		});

		await getPopup(102);

		const [getThreadsCall] = mockedGetThreads.mock.calls;
		if (!getThreadsCall) {
			throw new Error("Expected getThreads to be called");
		}
		const [getThreadsRequest] = getThreadsCall;

		expect(getThreadsRequest).toMatchObject({
			site: {
				domains: ["example.test"],
				id: SiteId.POPUP,
			},
			url: "watch?v=abc",
			youtubeId: undefined,
		});
		expect(browserMock.action.setBadgeText).toHaveBeenCalledWith({
			tabId: 102,
			text: "...",
		});
		expect(browserMock.action.setBadgeText).toHaveBeenCalledWith({
			tabId: 102,
			text: "1",
		});
		const popupThreads = getPopupThreads(102);
		expect(popupThreads.site?.id).toBe(SiteId.POPUP);
		expect(popupThreads.threads).toStrictEqual([matchingThread]);

		const [sendMessageCall] = browserMock.runtime.sendMessage.mock.calls;
		if (!sendMessageCall) {
			throw new Error("Expected popup update message to be sent");
		}
		const [message] = sendMessageCall;

		expect(message).toMatchObject({
			dict: { threads: [matchingThread] },
			id: "DICTRESPONSE",
			tab: 102,
		});
	});

	it("sets an error badge when thread loading fails", async () => {
		browserMock.tabs.get.mockResolvedValue({
			url: "https://example.test/watch?v=abc",
		});
		mockedGetThreads.mockResolvedValue({
			errorMessage: "No threads",
			success: false,
		});

		await getPopup(103);

		expect(browserMock.action.setBadgeText).toHaveBeenCalledWith({
			tabId: 103,
			text: "Error",
		});
		expect(browserMock.runtime.sendMessage).not.toHaveBeenCalled();
	});

	it("skips duplicate URL requests and clears entries on removal", async () => {
		browserMock.tabs.get.mockResolvedValue({
			url: "https://example.test/watch?v=abc",
		});
		mockedGetThreads.mockResolvedValue({
			success: true,
			value: [createThread()],
		});

		await getPopup(104);
		await getPopup(104);
		removeFromDicts(104);

		expect(mockedGetThreads).toHaveBeenCalledOnce();
		expect(getPopupThreads(104)).toStrictEqual({
			site: undefined,
			threads: undefined,
		});
	});
});
