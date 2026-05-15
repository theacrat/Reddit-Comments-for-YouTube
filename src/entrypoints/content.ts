import { enableShadowDOM } from "react-stately/private/flags/flags";

import { getSite } from "@/utils/types/site";

import { createThreadRoot } from "./content/render";
import { setup } from "./content/setup";
import type { ContentState } from "./content/setup";

import contentCss from "@/assets/css/content.css?inline";

enableShadowDOM();

interface UrlChangedMessage {
	hasUrlChanged?: boolean;
}

export default defineContentScript({
	async main(ctx) {
		const site = getSite(globalThis.location.hostname);

		if (!site) {
			return;
		}

		const state: ContentState = {
			currentRoot: undefined,
			lastVideoId: undefined,
			shadowUi: undefined,
		};

		state.shadowUi = await createShadowRootUi(ctx, {
			css: contentCss,
			name: "rcfy-root",
			onMount(uiContainer) {
				const root = createThreadRoot(uiContainer);
				state.currentRoot = root;
				return root;
			},
			onRemove(root) {
				root?.unmount();
				state.currentRoot = undefined;
			},
			position: "inline",
		});

		for (const eventName of site.eventListeners) {
			document.addEventListener(eventName, () => {
				void setup({ site, state });
			});
		}

		browser.runtime.onMessage.addListener((data: UrlChangedMessage) => {
			if (data.hasUrlChanged) {
				void setup({ site, state });
			}
		});

		void setup({ site, state });

		ctx.onInvalidated(() => {
			state.shadowUi?.remove();
		});
	},
	matches: ["*://nebula.tv/*", "*://www.youtube.com/*"],
	runAt: "document_start",
});
