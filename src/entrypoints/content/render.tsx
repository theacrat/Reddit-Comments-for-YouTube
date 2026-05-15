import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import { ExternalComments } from "@/components/content/external-comments";
import type { Site } from "@/utils/types/site";

function createThreadRoot(ui: HTMLElement): Root {
	return createRoot(ui);
}

interface RenderSelectorParams {
	root: Root;
	site: Site;
	videoId: string;
	youtubeId: string | undefined;
}

function renderSelector({
	root,
	site,
	videoId,
	youtubeId,
}: RenderSelectorParams) {
	root.render(
		<ExternalComments site={site} videoId={videoId} youtubeId={youtubeId} />,
	);
}

export { createThreadRoot, renderSelector };
