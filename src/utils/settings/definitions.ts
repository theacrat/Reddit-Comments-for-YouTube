import {
	LemmyCommentSort,
	RedditCommentSort,
	ThreadSort,
} from "@/utils/constants";

import type { SettingDef } from "./settings";

const COMMUNITY_BLACKLIST_ENTRY_REGEX = /^[\w-@.]{3,}/;

const Settings = {
	CHILDRENHIDDENDEFAULT: "childrenHiddenDefault",
	COLLAPSEONLOAD: "collapseOnLoad",
	COMMUNITYBLACKLIST: "communityBlacklist",
	DEFAULTSORT: "defaultSort",
	DEFAULTSORTLEMMY: "defaultSortLemmy",
	ENABLENEBULA: "enableNebula",
	ENABLEYOUTUBE: "enableYouTube",
	INCLUDENSFW: "includeNSFW",
	LASTSORT: "lastSort",
	LEMMYDOMAIN: "lemmyDomain",
	LEMMYPENDINGDOMAIN: "lemmyPendingDomain",
	LEMMYPENDINGORIGIN: "lemmyPendingOrigin",
	LEMMYTOKEN: "lemmyToken",
	LEMMYUSERNAME: "lemmyUsername",
	MATCHTOYOUTUBE: "matchToYouTube",
	SEARCHALLSITES: "searchAllSites",
	SHOWREDDITRESULTS: "showRedditResults",
} as const;

type Settings = (typeof Settings)[keyof typeof Settings];

const settingDefs = {
	childrenHiddenDefault: {
		defaultValue: false,
		displayInList: true,
		label: i18n.t("settings.childrenHiddenDefault"),
		type: "boolean",
	},
	collapseOnLoad: {
		defaultValue: false,
		displayInList: true,
		label: i18n.t("settings.collapseOnLoad"),
		type: "boolean",
	},
	communityBlacklist: {
		defaultValue: [],
		displayInList: true,
		label: i18n.t("settings.communityBlacklist"),
		type: "array",
		validator: (value: string) => {
			const splitValue = value
				.trim()
				.toLowerCase()
				.split("/")
				.pop()
				?.split("!")
				.pop();

			if (!splitValue) {
				return { errorMessage: i18n.t("invalidSubreddit"), value: "" };
			}

			if (!COMMUNITY_BLACKLIST_ENTRY_REGEX.test(splitValue)) {
				return { errorMessage: i18n.t("invalidSubreddit"), value };
			}

			const prefixedValue = splitValue.includes("@")
				? `!${splitValue}`
				: `r/${splitValue}`;

			return { errorMessage: "", value: prefixedValue };
		},
	},
	defaultSort: {
		defaultValue: RedditCommentSort.TOP,
		displayInList: true,
		label: i18n.t("settings.defaultSort"),
		options: Object.values(RedditCommentSort),
		type: "option",
	},
	defaultSortLemmy: {
		defaultValue: LemmyCommentSort.TOP,
		displayInList: false,
		label: i18n.t("settings.defaultSortLemmy"),
		options: Object.values(LemmyCommentSort),
		type: "option",
	},
	enableNebula: {
		children: [Settings.MATCHTOYOUTUBE],
		defaultValue: true,
		displayInList: true,
		label: i18n.t("settings.enableNebula"),
		type: "boolean",
	},
	enableYouTube: {
		defaultValue: true,
		displayInList: true,
		label: i18n.t("settings.enableYouTube"),
		type: "boolean",
	},
	includeNSFW: {
		defaultValue: false,
		displayInList: true,
		label: i18n.t("settings.includeNSFW"),
		type: "boolean",
	},
	lastSort: {
		defaultValue: ThreadSort.COMMENTS,
		displayInList: false,
		label: i18n.t("settings.lastSort"),
		options: Object.values(ThreadSort),
		storage: "local",
		type: "option",
	},
	lemmyDomain: {
		defaultValue: "",
		displayInList: false,
		label: i18n.t("settings.lemmyDomain"),
		storage: "local",
		type: "string",
	},
	lemmyPendingDomain: {
		defaultValue: "",
		displayInList: false,
		label: i18n.t("settings.lemmyDomain"),
		storage: "local",
		type: "string",
	},
	lemmyPendingOrigin: {
		defaultValue: "",
		displayInList: false,
		label: i18n.t("settings.lemmyDomain"),
		storage: "local",
		type: "string",
	},
	lemmyToken: {
		defaultValue: "",
		displayInList: false,
		label: i18n.t("settings.lemmyToken"),
		storage: "local",
		type: "string",
	},
	lemmyUsername: {
		defaultValue: "",
		displayInList: false,
		label: i18n.t("settings.lemmyUsername"),
		storage: "local",
		type: "string",
	},
	matchToYouTube: {
		defaultValue: true,
		displayInList: true,
		label: i18n.t("settings.matchToYouTube"),
		type: "boolean",
	},
	searchAllSites: {
		defaultValue: false,
		displayInList: true,
		label: i18n.t("settings.searchAllSites"),
		type: "boolean",
	},
	showRedditResults: {
		defaultValue: true,
		displayInList: true,
		label: i18n.t("settings.showRedditResults"),
		type: "boolean",
	},
} satisfies Record<Settings, SettingDef>;

export { Settings, settingDefs };
