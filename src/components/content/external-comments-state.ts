import { useEffect, useMemo, useRef } from "react";

import { sortThreadList } from "@/utils/tools/thread-tools";
import type { Thread } from "@/utils/types/elements";

import { useThreadStore } from "./thread-store";

interface BuildThreadCountParams {
	errorMessage: string;
	threads?: Thread[] | undefined;
}

type ExternalCommentsState = ReturnType<typeof useExternalCommentsState>;

function buildThreadCount({ errorMessage, threads }: BuildThreadCountParams) {
	if (errorMessage) {
		return i18n.t("error");
	}

	if (threads) {
		return i18n.t("threadCount", threads.length);
	}

	return i18n.t("loadingThreads");
}

function useExternalCommentsValues() {
	return {
		errorMessage: useThreadStore(({ errorMessage }) => errorMessage),
		isCollapsed: useThreadStore(({ isCollapsed }) => isCollapsed),
		isLoading: useThreadStore(({ isLoading }) => isLoading),
		selectedSort: useThreadStore(
			({ selectedThreadSort }) => selectedThreadSort,
		),
		selectedThreadId: useThreadStore(
			({ selectedThreadId }) => selectedThreadId,
		),
		unsortedThreads: useThreadStore(({ unsortedThreads }) => unsortedThreads),
	};
}

function useExternalCommentsActions() {
	return {
		handleCollapseToggle: useThreadStore(
			({ handleCollapseToggle }) => handleCollapseToggle,
		),
		handleSortSelect: useThreadStore(
			({ handleSortSelect }) => handleSortSelect,
		),
		handleThreadSelect: useThreadStore(
			({ handleThreadSelect }) => handleThreadSelect,
		),
		handleThreadUpdate: useThreadStore(
			({ handleThreadUpdate }) => handleThreadUpdate,
		),
		handleThreadsLoadFailure: useThreadStore(
			({ handleThreadsLoadFailure }) => handleThreadsLoadFailure,
		),
		handleThreadsLoadStart: useThreadStore(
			({ handleThreadsLoadStart }) => handleThreadsLoadStart,
		),
		handleThreadsLoadSuccess: useThreadStore(
			({ handleThreadsLoadSuccess }) => handleThreadsLoadSuccess,
		),
	};
}

type UseSortedThreadsParams = ReturnType<typeof useExternalCommentsValues>;

function useSortedThreads({
	selectedSort,
	unsortedThreads,
}: UseSortedThreadsParams) {
	return useMemo(() => {
		if (!selectedSort || !unsortedThreads) {
			return unsortedThreads;
		}

		return sortThreadList({ sort: selectedSort.id, threads: unsortedThreads });
	}, [selectedSort, unsortedThreads]);
}

function useExternalCommentsState() {
	const actions = useExternalCommentsActions();
	const values = useExternalCommentsValues();
	const threads = useSortedThreads(values);

	const { handleThreadSelect } = actions;

	const selectedSortId = values.selectedSort?.id;
	const previousSortId = useRef(selectedSortId);

	const selectedThread = useMemo(
		() => threads?.find((thread) => thread.fullId === values.selectedThreadId),
		[threads, values.selectedThreadId],
	);

	const threadCount = useMemo(
		() => buildThreadCount({ errorMessage: values.errorMessage, threads }),
		[threads, values.errorMessage],
	);

	useEffect(() => {
		const sortChanged = previousSortId.current !== selectedSortId;

		previousSortId.current = selectedSortId;

		if (
			!sortChanged &&
			threads?.some((thread) => thread.fullId === values.selectedThreadId) &&
			values.selectedThreadId
		) {
			return;
		}

		const firstThread = threads?.[0];

		if (!firstThread) {
			return;
		}

		handleThreadSelect({
			id: firstThread.fullId,
			title: firstThread.title,
		});
	}, [handleThreadSelect, selectedSortId, threads, values.selectedThreadId]);

	return {
		...actions,
		...values,
		selectedThread,
		threadCount,
		threads,
	};
}

export { useExternalCommentsState };
export type { ExternalCommentsState };
