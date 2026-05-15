import { useCallback } from "react";
import type { ReactNode } from "react";
import { UNSAFE_PortalProvider as PortalProvider } from "react-aria";

import { noticeText } from "@/components/common/variants/text-variants";
import {
	externalCommentsBody,
	externalCommentsContainer,
} from "@/components/common/variants/thread-variants";
import type { Thread } from "@/utils/types/elements";
import type { Site } from "@/utils/types/site";

import type { ExternalComments as ExternalCommentsHook } from "./external-comments-hooks";
import { useExternalComments } from "./external-comments-hooks";
import { Header } from "./header";
import { ThreadContainer } from "./threads/thread-container";
import { ThreadPicker } from "./threads/thread-picker";

const noticeClassName = noticeText();

interface ThreadBodyProps {
	externalComments: ExternalCommentsHook;
	site: Site;
}

function ThreadBody(props: ThreadBodyProps) {
	const { site, externalComments } = props;
	const { externalCommentsState, isThreadContainerReady } = externalComments;
	const { isCollapsed, errorMessage, selectedThread } = externalCommentsState;

	const bodyClassName = externalCommentsBody({ collapsed: isCollapsed });

	return (
		<div className={bodyClassName}>
			<ThreadPicker externalCommentsState={externalCommentsState} />

			{errorMessage && <span className={noticeClassName}>{errorMessage}</span>}

			{selectedThread !== undefined && isThreadContainerReady && (
				<ThreadContainer key={selectedThread.fullId} site={site} />
			)}
		</div>
	);
}

interface ExternalCommentsPortalProps {
	children: ReactNode;
	container: HTMLElement;
}

function ExternalCommentsPortal({
	children,
	container,
}: ExternalCommentsPortalProps) {
	const getPortalContainer = useCallback(() => container, [container]);

	return (
		<PortalProvider getContainer={getPortalContainer}>
			{children}
		</PortalProvider>
	);
}

interface ExternalCommentsProps {
	site: Site;
	videoId: string;
	youtubeId: string | undefined;
	threads?: Thread[] | undefined;
}

function ExternalComments(props: ExternalCommentsProps) {
	const { site } = props;

	const externalComments = useExternalComments(props);
	const { isPopup, portalContainer, setContainerRef } = externalComments;

	const containerClassName = externalCommentsContainer({ popup: isPopup });

	return (
		<div
			className={containerClassName}
			data-theme={site.id}
			ref={setContainerRef}
		>
			{portalContainer !== undefined && (
				<ExternalCommentsPortal container={portalContainer}>
					<Header externalComments={externalComments} />
					<ThreadBody externalComments={externalComments} site={site} />
				</ExternalCommentsPortal>
			)}
		</div>
	);
}

export { ExternalComments };
export type { ExternalCommentsProps };
