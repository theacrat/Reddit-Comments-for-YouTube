import { useCallback, useEffect, useRef } from "react";

import {
	useCurrentThread,
	useThreadStore,
} from "@/components/content/thread-store";
import type { CommentSort } from "@/utils/constants";
import {
	getCommentSortOptions,
	getDefaultSort,
} from "@/utils/tools/thread-tools";
import type { SelectOption, Thread } from "@/utils/types/elements";
import type { Site } from "@/utils/types/site";

type ThreadState = ReturnType<typeof useThreadState>;

function useTimestampListener(site: Site) {
	useEffect(() => {
		function isTimestampEvent(event: Event): event is CustomEvent<{
			time?: number;
		}> {
			return event instanceof CustomEvent;
		}

		function goToTimestamp(event: Event) {
			if (!isTimestampEvent(event)) {
				return;
			}

			const { detail } = event;

			if (typeof detail?.time !== "number" || !Number.isFinite(detail.time)) {
				return;
			}

			window.scrollTo(0, 0);

			const videoElement = document.querySelector<HTMLVideoElement>(
				site.videoElement,
			);

			if (videoElement) {
				videoElement.focus();
				videoElement.currentTime = detail.time;
			}
		}

		document.addEventListener("timestampClicked", goToTimestamp);

		return () => {
			document.removeEventListener("timestampClicked", goToTimestamp);
		};
	}, [site.videoElement]);
}

interface UseThreadTimestampClickParams {
	site: Site;
	thread: Thread;
}

function useThreadTimestampClick({
	site,
	thread,
}: UseThreadTimestampClickParams) {
	return useCallback(() => {
		const videoElement = document.querySelector<HTMLVideoElement>(
			site.videoElement,
		);

		if (videoElement) {
			window.scrollTo(0, 0);

			videoElement.currentTime = thread.linkedTimestamp ?? 0;
		}
	}, [site.videoElement, thread.linkedTimestamp]);
}

function useThreadState() {
	const isHidden = useThreadStore((state) => state.isHidden);
	const loadComments = useThreadStore((state) => state.loadComments);
	const selectedSort = useThreadStore((state) => state.commentSort);

	const thread = useCurrentThread();

	const handleSortChange = useCallback(
		(option: SelectOption<CommentSort>) => {
			void loadComments({ sortOption: option });
		},
		[loadComments],
	);

	return {
		handleSortChange,
		isHidden,
		loadComments,
		selectedSort,
		thread,
	};
}

function useInitialSortLoader(
	sortOptions: SelectOption<CommentSort>[] | undefined,
	threadContainerState: ThreadState,
) {
	const { loadComments, thread } = threadContainerState;

	const loadedThreadIdRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		let cancelled = false;

		void (async () => {
			if (!sortOptions || !thread) {
				return;
			}

			if (loadedThreadIdRef.current === thread.fullId) {
				return;
			}

			loadedThreadIdRef.current = thread.fullId;

			const defaultSort = await getDefaultSort(thread);

			if (cancelled) {
				return;
			}

			const option = sortOptions.find(
				(entry) => entry.id.toLowerCase() === defaultSort.toLowerCase(),
			);

			if (!option) {
				return;
			}

			await loadComments({ sortOption: option, threadOverride: thread });
		})();

		return () => {
			cancelled = true;
		};
	}, [loadComments, sortOptions, thread]);
}

function useThreadContainer(site: Site) {
	useTimestampListener(site);

	const state = useThreadState();
	const { thread } = state;

	const sortOptions = thread
		? getCommentSortOptions(thread.website)
		: undefined;

	useInitialSortLoader(sortOptions, state);

	if (!thread || !sortOptions) {
		return;
	}

	return {
		handleSortChange: state.handleSortChange,
		isHidden: state.isHidden,
		selectedSort: state.selectedSort,
		sortOptions,
		thread,
	};
}

export { useThreadTimestampClick, useThreadContainer };
