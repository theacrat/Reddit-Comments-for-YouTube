import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { UNSAFE_PortalProvider as PortalProvider } from "react-aria";
import { Button } from "react-aria-components";

import { popupShell } from "@/components/common/variants/popup-variants";
import { Settings, getValue } from "@/utils/settings";

import { PopupSettings } from "./popup-settings";
import { PopupThreads } from "./popup-threads";

const styles = popupShell();
const rootClassName = styles.root();
const toggleClassName = styles.toggle();

function usePopup() {
	const [portalContainer, setPortalContainer] = useState<
		HTMLElement | undefined
	>(undefined);
	const [showingThreads, setShowingThreads] = useState(false);
	const [threadsOptionEnabled, setThreadsOptionEnabled] = useState(false);

	const portalContainerRef = useRef<HTMLElement | undefined>(undefined);

	const setPortalContainerRef = useCallback((node: HTMLElement | null) => {
		const container = node ?? undefined;

		portalContainerRef.current = container;
		setPortalContainer(container);
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadPopup() {
			const value = await getValue(Settings.SEARCHALLSITES);

			if (!cancelled) {
				setThreadsOptionEnabled(value);
				setShowingThreads(value);
			}
		}

		void loadPopup();

		return () => {
			cancelled = true;
		};
	}, []);

	const toggleThreadsView = () => {
		setShowingThreads((value) => !value);
	};

	return {
		portalContainer,
		setPortalContainerRef,
		showingThreads,
		threadsOptionEnabled,
		toggleThreadsView,
	};
}

interface PopupToggleProps {
	popup: ReturnType<typeof usePopup>;
}

function PopupToggle({ popup }: PopupToggleProps) {
	const { showingThreads, toggleThreadsView } = popup;

	const labelKey = showingThreads ? "settings" : "threads";

	return (
		<Button className={toggleClassName} onPress={toggleThreadsView}>
			{i18n.t(`popupTabs.${labelKey}`)}
		</Button>
	);
}

interface PopupPortalProps {
	children: ReactNode;
	container: HTMLElement;
}

function PopupPortal({ children, container }: PopupPortalProps) {
	const getPortalContainer = useCallback(() => container, [container]);

	return (
		<PortalProvider getContainer={getPortalContainer}>
			{children}
		</PortalProvider>
	);
}

function Popup() {
	const popup = usePopup();
	const {
		portalContainer,
		setPortalContainerRef,
		showingThreads,
		threadsOptionEnabled,
	} = popup;

	return (
		<main
			className={rootClassName}
			data-theme="popup"
			ref={setPortalContainerRef}
		>
			{portalContainer && (
				<PopupPortal container={portalContainer}>
					{threadsOptionEnabled && <PopupToggle popup={popup} />}

					{showingThreads ? <PopupThreads /> : <PopupSettings />}
				</PopupPortal>
			)}
		</main>
	);
}

export { Popup };
