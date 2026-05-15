import { useEffect, useRef, useState } from "react";
import { Button } from "react-aria-components";

import { popupThreads as popupThreadsStyles } from "@/components/common/variants/popup-variants";
import { ExternalComments } from "@/components/content/external-comments";
import type { Thread } from "@/utils/types/elements";
import type { Site } from "@/utils/types/site";

interface PopupDict {
	site: Site;
	threads: Thread[];
}

interface PopupMessage {
	dict?: PopupDict;
	id?: string;
	tab?: number;
}

const styles = popupThreadsStyles();
const buttonClassName = styles.button();
const centeredTextClassName = styles.centeredText();
const panelClassName = styles.panel();
const promptClassName = styles.prompt();

function handleRequestTabsPermission() {
	void browser.permissions.request({ permissions: ["tabs"] });
}

function PermissionRequest() {
	return (
		<div className={panelClassName}>
			<div className={promptClassName}>
				<span className={centeredTextClassName}>
					{i18n.t("tabsExplanation")}
				</span>
				<Button
					className={buttonClassName}
					onClick={handleRequestTabsPermission}
				>
					{i18n.t("request")}
				</Button>
			</div>
		</div>
	);
}

function LoadingThreads() {
	return (
		<div className={panelClassName}>
			<span className={centeredTextClassName}>{i18n.t("loadingThreads")}</span>
		</div>
	);
}

function usePopupThreads() {
	const [dict, setDict] = useState<PopupDict | undefined>();
	const [hasPerm, setHasPerm] = useState(false);

	const activeTabIdRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		let cancelled = false;

		function onMessage(data: PopupMessage) {
			if (
				data.dict?.threads &&
				data.id === "DICTRESPONSE" &&
				data.tab === activeTabIdRef.current
			) {
				setDict(data.dict);
			}
		}

		async function loadThreads() {
			const permission = await browser.permissions.contains({
				permissions: ["tabs"],
			});

			if (cancelled) {
				return;
			}

			setHasPerm(permission);

			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});

			const tabId = tab?.id;

			if (tabId === undefined) {
				return;
			}

			activeTabIdRef.current = tabId;

			browser.runtime.onMessage.addListener(onMessage);

			await browser.runtime.sendMessage({
				id: "DICTREQUEST",
				tab: tabId,
			});
		}

		void loadThreads();

		return () => {
			cancelled = true;
			browser.runtime.onMessage.removeListener(onMessage);
		};
	}, []);

	return { dict, hasPerm };
}

interface PopupThreadBodyProps {
	dict: PopupDict | undefined;
}

function PopupThreadBody({ dict }: PopupThreadBodyProps) {
	if (!dict) {
		return <LoadingThreads />;
	}

	return (
		<div className={panelClassName}>
			<ExternalComments
				site={dict.site}
				threads={dict.threads}
				videoId=""
				youtubeId=""
			/>
		</div>
	);
}

function PopupThreads() {
	const { dict, hasPerm } = usePopupThreads();

	return hasPerm ? <PopupThreadBody dict={dict} /> : <PermissionRequest />;
}

export { PopupThreads };
