import { create } from "zustand";

import type { CommentSort, ThreadSort } from "@/utils/constants";
import { Kind } from "@/utils/constants";
import { sendMessage } from "@/utils/messaging";
import { Settings, setValue } from "@/utils/settings";
import { applyLemmyMoreChildren } from "@/utils/tools/thread-tools";
import type { Post, SelectOption, Thread, User } from "@/utils/types/elements";
import type { GetCommentsRequest } from "@/utils/types/network-requests";
import type { FetchResponse } from "@/utils/types/network-responses";
import type { Site } from "@/utils/types/site";

interface LoadCommentsParams {
	sortOption: SelectOption<CommentSort>;
	threadOverride?: Thread | undefined;
}

type ThreadStoreGet = () => ThreadStore;

type ThreadStoreSet = (
	partial:
		| Partial<ThreadStore>
		| ThreadStore
		| ((state: ThreadStore) => Partial<ThreadStore> | ThreadStore),
) => void;

type ThreadStoreActions = ReturnType<typeof createThreadActions> &
	ReturnType<typeof createThreadLoadActions> &
	ReturnType<typeof createThreadSelectionActions>;

interface ThreadStoreState extends InitialiseThreadStoreParams {
	commentSort?: SelectOption<CommentSort> | undefined;
	errorMessage: string;
	isBanned: boolean;
	isCollapsed: boolean;
	isHidden: boolean;
	isLoading: boolean;
	selectedThreadId?: string | undefined;
	selectedThreadSort?: SelectOption<ThreadSort> | undefined;
	unsortedThreads?: Thread[] | undefined;
	user?: User | undefined;
}

type ThreadStore = ThreadStoreActions & ThreadStoreState;

const initialThreadStoreState = {
	errorMessage: "",
	isBanned: false,
	isCollapsed: false,
	isHidden: false,
	isLoading: true,
} satisfies ThreadStoreState;

interface ReplaceCommentInThreadParams {
	post: Post;
	thread: Thread;
}

function replaceCommentInThread({
	post,
	thread,
}: ReplaceCommentInThreadParams): Thread {
	if (post.kind === Kind.THREAD) {
		return post;
	}

	const replaceReplies = (
		replies: Thread["replies"],
	): [Thread["replies"], boolean] => {
		let changed = false;

		const nextReplies = replies.map((reply) => {
			if (reply.kind !== Kind.COMMENT) {
				return reply;
			}

			if (reply.fullId === post.fullId) {
				changed = true;

				return post;
			}

			const [childReplies, childChanged] = replaceReplies(reply.replies);

			if (!childChanged) {
				return reply;
			}

			changed = true;

			return { ...reply, replies: childReplies };
		});

		return changed ? [nextReplies, true] : [replies, false];
	};

	const [replies, changed] = replaceReplies(thread.replies);

	if (!changed) {
		return thread;
	}

	return {
		...thread,
		replies,
	};
}

interface LoadThreadCommentsParams extends LoadCommentsParams {
	get: ThreadStoreGet;
	set: ThreadStoreSet;
}

async function loadThreadComments({
	get,
	set,
	sortOption,
	threadOverride,
}: LoadThreadCommentsParams) {
	const thread = threadOverride ?? get().thread;

	if (!thread) {
		return;
	}

	set({
		commentSort: sortOption,
		isHidden: true,
	});

	const nextThread = structuredClone(thread);

	nextThread.replies = [];
	nextThread.page = 1;

	get().handleThreadChange(nextThread);

	const request: GetCommentsRequest = {
		sort: sortOption.id,
		thread: nextThread,
	};

	const response = await sendMessage("getComments", request);

	if (!response.success) {
		set({ isHidden: false });

		return;
	}

	nextThread.replies = response.value.replies;

	get().handleThreadChange(applyLemmyMoreChildren(nextThread));
	set({
		isBanned: response.value.isBanned ?? false,
		isHidden: false,
		user: response.value.user,
	});
}

function createThreadActions(set: ThreadStoreSet, get: ThreadStoreGet) {
	return {
		emitThreadChange: () => {
			const { handleThreadChange, thread } = get();

			if (thread) {
				handleThreadChange({ ...thread });
			}
		},
		handlePostUpdate: (post: Post) => {
			const { handleThreadChange, thread } = get();

			if (thread) {
				handleThreadChange(replaceCommentInThread({ post, thread }));
			}
		},
		handleThreadChange: (thread: Thread) => {
			set({ thread });
			get().onThreadChange?.(thread);
		},
		loadComments: async (params: LoadCommentsParams) => {
			await loadThreadComments({ ...params, get, set });
		},
		setActiveThread: (params: InitialiseThreadStoreParams) => {
			set({
				...params,
				commentSort: undefined,
				isBanned: false,
				isHidden: false,
				user: undefined,
			});
		},
	};
}

function createThreadSelectionActions(set: ThreadStoreSet) {
	return {
		handleCollapseToggle: () => {
			set(({ isCollapsed }) => ({ isCollapsed: !isCollapsed }));
		},
		handleSortSelect: (selectedThreadSort: SelectOption<ThreadSort>) => {
			set({ selectedThreadSort });
			setValue(Settings.LASTSORT, selectedThreadSort.id);
		},
		handleThreadSelect: (thread: SelectOption<string>) => {
			set({ selectedThreadId: thread.id });
		},
		handleThreadUpdate: (nextThread: Thread) => {
			set(({ unsortedThreads }) => ({
				unsortedThreads: unsortedThreads?.map((thread) =>
					thread.fullId === nextThread.fullId ? nextThread : thread,
				),
			}));
		},
	};
}

function createThreadLoadActions(set: ThreadStoreSet) {
	return {
		handleThreadsLoadFailure: (
			response: FetchResponse<Thread[]> & {
				errorMessage: string;
			},
		) => {
			set({
				errorMessage: response.errorMessage,
				isLoading: false,
			});
		},
		handleThreadsLoadStart: () => {
			set({
				commentSort: undefined,
				errorMessage: "",
				isBanned: false,
				isHidden: false,
				isLoading: true,
				selectedThreadId: undefined,
				thread: undefined,
				unsortedThreads: undefined,
				user: undefined,
			});
		},
		handleThreadsLoadSuccess: (unsortedThreads?: Thread[]) => {
			set({
				errorMessage: "",
				isLoading: false,
				unsortedThreads,
			});
		},
	};
}

const useThreadStore = create<ThreadStore>()((set, get) => ({
	...initialThreadStoreState,
	...createThreadActions(set, get),
	...createThreadLoadActions(set),
	...createThreadSelectionActions(set),
}));

interface InitialiseThreadStoreParams {
	onThreadChange?: ((thread: Thread) => void) | undefined;
	site?: Site | undefined;
	thread?: Thread | undefined;
}

function initialiseThreadStore(params: InitialiseThreadStoreParams) {
	const {
		onThreadChange: newOnThreadChange,
		site: newSite,
		thread: newThread,
	} = params;

	const { onThreadChange, setActiveThread, site, thread } =
		useThreadStore.getState();

	if (newSite === site && newThread?.fullId === thread?.fullId) {
		if (newOnThreadChange !== onThreadChange) {
			useThreadStore.setState({ onThreadChange: newOnThreadChange });
		}

		return;
	}

	setActiveThread(params);
}

function useCurrentThread() {
	return useThreadStore(({ thread }) => thread);
}

function useCurrentSite() {
	return useThreadStore(({ site }) => site);
}

function useCanVote() {
	return useThreadStore(
		({ thread, user }) => !thread?.archived && !user?.isSuspended,
	);
}

function useCanPost() {
	const canVote = useCanVote();

	return useThreadStore(
		({ isBanned, thread }) => canVote && !(isBanned || thread?.locked),
	);
}

export {
	useThreadStore,
	initialiseThreadStore,
	useCurrentThread,
	useCurrentSite,
	useCanVote,
	useCanPost,
};
