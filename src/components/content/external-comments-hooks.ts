import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { RefCallback, RefObject } from "react";

import { SiteId, ThreadSort } from "@/utils/constants";
import { sendMessage } from "@/utils/messaging";
import { getValue, Settings } from "@/utils/settings";
import { isThreadSort } from "@/utils/tools/thread-tools";
import type { Site } from "@/utils/types/site";

import type { ExternalCommentsProps } from "./external-comments";
import type { ExternalCommentsState } from "./external-comments-state";
import { useExternalCommentsState } from "./external-comments-state";
import {
	useCurrentSite,
	useCurrentThread,
	initialiseThreadStore,
} from "./thread-store";

type ExternalComments = ReturnType<typeof useExternalComments>;

function buildThreadSortOptions() {
	return Object.values(ThreadSort).map((option) => ({
		id: option,
		title: i18n.t(`threadSortOptions.${option}`),
	}));
}

interface FetchThreadsParams {
	externalCommentsState: ExternalCommentsState;
	targetKey: string;
	targetRef: RefObject<string | undefined>;
	useExternalCommentsParams: UseExternalCommentsParams;
}

async function fetchThreads({
	externalCommentsState,
	targetKey,
	targetRef,
	useExternalCommentsParams,
}: FetchThreadsParams) {
	const { site, videoId, youtubeId } = useExternalCommentsParams;
	const { handleThreadsLoadFailure, handleThreadsLoadSuccess } =
		externalCommentsState;

	const response = await sendMessage("getThreads", {
		site,
		url: videoId,
		youtubeId,
	});

	if (targetRef.current !== targetKey) {
		return;
	}

	if (!response.success) {
		handleThreadsLoadFailure(response);
		return;
	}

	handleThreadsLoadSuccess(response.value);
}

function useIsPopup(site: Site) {
	return site.id === SiteId.POPUP;
}

interface UseInitialExternalCommentsStateParams {
	isPopup: boolean;
	externalCommentsState: ExternalCommentsState;
	sortOptions: ReturnType<typeof buildThreadSortOptions>;
}

function useInitialExternalCommentsState({
	externalCommentsState,
	isPopup,
	sortOptions,
}: UseInitialExternalCommentsStateParams) {
	const { handleSortSelect, handleCollapseToggle } = externalCommentsState;

	useEffect(() => {
		let cancelled = false;

		void (async () => {
			const collapseOnLoad = await getValue(Settings.COLLAPSEONLOAD);

			if (cancelled) {
				return;
			}

			if (collapseOnLoad && !isPopup) {
				handleCollapseToggle();
			}

			const lastSort = await getValue(Settings.LASTSORT);

			if (cancelled) {
				return;
			}

			const lastSortOption = isThreadSort(lastSort)
				? sortOptions.find((option) => option.id === lastSort)
				: undefined;

			if (lastSortOption) {
				handleSortSelect(lastSortOption);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [handleSortSelect, handleCollapseToggle, isPopup, sortOptions]);
}

interface UseActiveThreadInitialiserParams {
	externalCommentsState: ExternalCommentsState;
	site: UseExternalCommentsParams["site"];
}

function useActiveThreadInitialiser({
	site,
	externalCommentsState,
}: UseActiveThreadInitialiserParams) {
	const { selectedThread, handleThreadUpdate } = externalCommentsState;

	const currentSite = useCurrentSite();
	const currentThreadId = useCurrentThread()?.fullId;

	useLayoutEffect(() => {
		if (!selectedThread) {
			return;
		}

		initialiseThreadStore({
			onThreadChange: handleThreadUpdate,
			site,
			thread: selectedThread,
		});
	}, [handleThreadUpdate, selectedThread, site]);

	return site === currentSite && selectedThread?.fullId === currentThreadId;
}

interface UseThreadLoaderParams {
	externalCommentsState: ExternalCommentsState;
	useExternalCommentsParams: UseExternalCommentsParams;
}

function useThreadLoader({
	externalCommentsState,
	useExternalCommentsParams,
}: UseThreadLoaderParams) {
	const { handleThreadsLoadSuccess, selectedSort } = externalCommentsState;

	const currentTargetRef = useRef<string | undefined>(undefined);
	const externalCommentsStateRef = useRef(externalCommentsState);
	const loadedTargetRef = useRef<string | undefined>(undefined);
	const loadingTargetRef = useRef<string | undefined>(undefined);

	externalCommentsStateRef.current = externalCommentsState;

	useEffect(() => {
		const { site, threads, videoId, youtubeId } = useExternalCommentsParams;
		const targetKey = `${site.id}:${videoId}:${youtubeId ?? "<pending>"}`;

		currentTargetRef.current = targetKey;

		if (threads) {
			loadingTargetRef.current = undefined;
			handleThreadsLoadSuccess(threads);
			return;
		}

		if (loadingTargetRef.current !== targetKey) {
			loadingTargetRef.current = targetKey;
			externalCommentsStateRef.current.handleThreadsLoadStart();
		}

		if (!selectedSort || youtubeId === undefined) {
			return;
		}

		if (loadedTargetRef.current === targetKey) {
			return;
		}

		loadedTargetRef.current = targetKey;

		void fetchThreads({
			externalCommentsState: externalCommentsStateRef.current,
			targetKey,
			targetRef: currentTargetRef,
			useExternalCommentsParams,
		});
	}, [handleThreadsLoadSuccess, selectedSort, useExternalCommentsParams]);
}

type UseExternalCommentsParams = ExternalCommentsProps;

function useExternalComments(params: UseExternalCommentsParams) {
	const { site } = params;

	const [portalContainer, setPortalContainer] = useState<
		HTMLDivElement | undefined
	>(undefined);

	const containerRef = useRef<HTMLDivElement | undefined>(undefined);

	const setContainerRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
		const container = node ?? undefined;

		containerRef.current = container;
		setPortalContainer(container);
	}, []);

	const isPopup = useIsPopup(site);
	const externalCommentsState = useExternalCommentsState();
	const isThreadContainerReady = useActiveThreadInitialiser({
		externalCommentsState,
		site,
	});

	const sortOptions = useMemo(buildThreadSortOptions, []);

	useInitialExternalCommentsState({
		externalCommentsState,
		isPopup,
		sortOptions,
	});

	useThreadLoader({
		externalCommentsState,
		useExternalCommentsParams: params,
	});

	return {
		containerRef,
		externalCommentsState,
		isPopup,
		isThreadContainerReady,
		portalContainer,
		setContainerRef,
		sortOptions,
	};
}

export { useExternalComments };
export type { ExternalComments, UseExternalCommentsParams };
