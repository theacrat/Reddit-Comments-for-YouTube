const HMS_SECONDS_REGEX = /\d*(?=s)/;
const HMS_MINUTES_REGEX = /\d*(?=m)/;
const HMS_HOURS_REGEX = /\d*(?=h)/;
const HMS_TIMESTAMP_REGEX = /[hms]/;

function colonToNumber(timestamp: string) {
	const sections = timestamp.split(":").toReversed();
	if (sections.length > 3) {
		throw new Error("Invalid timestamp: too many sections.");
	}

	const seconds = Number(sections[0]);
	const minutes = Number(sections[1] ?? 0) * 60;
	const hours = Number(sections[2] ?? 0) * 3600;

	return seconds + minutes + hours;
}

function hmsToNumber(timestamp: string) {
	const secondsMatch = HMS_SECONDS_REGEX.exec(timestamp);
	const minutesMatch = HMS_MINUTES_REGEX.exec(timestamp);
	const hoursMatch = HMS_HOURS_REGEX.exec(timestamp);

	const seconds = secondsMatch ? Number.parseInt(secondsMatch[0], 10) : 0;
	const minutes = minutesMatch ? Number.parseInt(minutesMatch[0], 10) * 60 : 0;
	const hours = hoursMatch ? Number.parseInt(hoursMatch[0], 10) * 3600 : 0;

	return seconds + minutes + hours;
}

function numberToHms(timestamp: number) {
	const hours = Math.trunc(timestamp / 3600);

	const remaining = timestamp % 3600;

	const minutes = Math.trunc(remaining / 60);
	const seconds = Math.trunc(remaining % 60);

	return `${hours > 0 ? `${hours}:${`0${minutes}`.slice(-2)}` : minutes}:${`0${seconds}`.slice(-2)}`;
}
function parseTimestamp(timestamp: string) {
	const parsed = Number(timestamp);
	if (!Number.isNaN(parsed)) {
		return parsed;
	}

	if (timestamp.includes(":")) {
		return colonToNumber(timestamp);
	}

	if (HMS_TIMESTAMP_REGEX.test(timestamp)) {
		return hmsToNumber(timestamp);
	}

	throw new Error("Invalid timestamp: unsupported format.");
}
function timestampToRelativeTime(timestamp: number) {
	const currentTime = Math.floor(Date.now() / 1000);
	const difference = currentTime - timestamp;

	if (difference < 10) {
		return i18n.t("time.justNow");
	} else if (difference < 60) {
		return i18n.t("time.seconds", [difference]);
	} else if (difference < 3600) {
		return i18n.t("time.minutes", Math.floor(difference / 60));
	} else if (difference < 86_400) {
		return i18n.t("time.hours", Math.floor(difference / 3600));
	} else if (difference < 2_678_400) {
		return i18n.t("time.days", Math.floor(difference / 86_400));
	} else if (difference < 31_536_000) {
		return i18n.t("time.months", Math.floor(difference / 2_678_400));
	}

	return i18n.t("time.years", Math.floor(difference / 31_536_000));
}

function lemmyTimestampToEpoch(timestamp: string) {
	const utcTime = timestamp.endsWith("Z") ? timestamp : `${timestamp}+00:00`;
	return Math.trunc(Date.parse(utcTime) / 1000);
}

export {
	lemmyTimestampToEpoch,
	numberToHms,
	parseTimestamp,
	timestampToRelativeTime,
};
