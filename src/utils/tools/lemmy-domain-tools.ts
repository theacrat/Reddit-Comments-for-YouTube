import { getValue, Settings, setValue } from "@/utils/settings";

const URL_PROTOCOL_REGEX = /^https?:\/\//;

interface LemmyDomainPermission {
	host: string;
	origin: string;
}

function parseLemmyDomain(inputValue: string) {
	const url = URL.parse(
		"*",
		URL_PROTOCOL_REGEX.test(inputValue) ? inputValue : `https://${inputValue}`,
	);

	if (!url) {
		return;
	}

	return {
		host: url.host,
		origin: url.toString(),
	} satisfies LemmyDomainPermission;
}

function clearPendingLemmyDomain() {
	setValue(Settings.LEMMYPENDINGDOMAIN, undefined);
	setValue(Settings.LEMMYPENDINGORIGIN, undefined);
}

function promoteLemmyDomain(host: string | undefined) {
	setValue(Settings.LEMMYDOMAIN, host);
	setValue(Settings.LEMMYTOKEN, undefined);
	setValue(Settings.LEMMYUSERNAME, undefined);

	clearPendingLemmyDomain();
}

async function promotePendingLemmyDomain() {
	const [host, origin] = await Promise.all([
		getValue(Settings.LEMMYPENDINGDOMAIN),
		getValue(Settings.LEMMYPENDINGORIGIN),
	]);

	if (!host || !origin) {
		return "";
	}

	const hasPermission = await browser.permissions.contains({
		origins: [origin],
	});

	if (!hasPermission) {
		return "";
	}

	promoteLemmyDomain(host);

	return host;
}

export {
	clearPendingLemmyDomain,
	parseLemmyDomain,
	promoteLemmyDomain,
	promotePendingLemmyDomain,
};

export type { LemmyDomainPermission };
