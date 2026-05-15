import { SiteId } from "@/utils/constants";

interface Site {
	anchorElement: string;
	anchorType: InsertPosition;
	canMatchYouTube: boolean;
	domains: string[];
	eventListeners: string[];
	id: SiteId;
	idRegex: RegExp;
	templates: string[];
	titleElement: string;
	usernameElement: string;
	videoElement: string;
}

const Sites: Site[] = [
	{
		anchorElement: "#comments",
		anchorType: "beforebegin",
		canMatchYouTube: false,
		domains: ["www.youtube.com", "youtu.be"],
		eventListeners: ["DOMContentLoaded", "spfdone", "yt-navigate-finish"],
		id: SiteId.YOUTUBE,
		idRegex: /(?<=v=|shorts\/)[a-zA-Z0-9\-_]*/,
		templates: [
			"https://www.youtube.com/watch?v=videoId",
			"https://youtu.be/videoId",
		],
		titleElement: "h1.ytd-watch-metadata yt-formatted-string",
		usernameElement: "yt-formatted-string.ytd-channel-name a",
		videoElement: ".video-stream",
	},
	{
		anchorElement: "[aria-label='video details'] section[aria-labelledby]",
		anchorType: "afterend",
		canMatchYouTube: true,
		domains: ["nebula.tv"],
		eventListeners: ["DOMContentLoaded"],
		id: SiteId.NEBULA,
		idRegex: /(?<=videos\/).*/,
		templates: ["https://nebula.tv/videos/videoId"],
		titleElement: "[aria-label='video details'] h1",
		usernameElement: "[aria-label='video details'] a:has(h2)",
		videoElement: "#video-player video",
	},
];

function getSite(domain: string) {
	return Sites.find(({ domains }) => domains.includes(domain));
}

function getSiteById(id: SiteId) {
	return Sites.find((site) => site.id === id);
}

function getPopupSite(url: URL) {
	const domain = url.hostname;
	const site = getSite(domain);

	if (site && url.href.match(site.idRegex)) {
		return site;
	}

	const popupSite: Site = {
		anchorElement: "",
		anchorType: "beforeend",
		canMatchYouTube: false,
		domains: [domain],
		eventListeners: [],
		id: SiteId.POPUP,
		idRegex: /.*/,
		templates: [`https://${domain}/videoId`],
		titleElement: "",
		usernameElement: "",
		videoElement: "",
	};

	return popupSite;
}

export { getSite, getSiteById, getPopupSite };
export type { Site };
