import type { Post } from "@/utils/types/elements";

const NON_ALPHANUMERIC_REGEX = /[^a-zA-Z0-9]+/g;
const REPEATED_WHITESPACE_REGEX = /\s{2,}/g;

function cleanString(string: string) {
	return string
		.replaceAll(NON_ALPHANUMERIC_REGEX, " ")
		.replaceAll(REPEATED_WHITESPACE_REGEX, " ")
		.toLowerCase();
}

function getScoreString(element: Post) {
	if (element.kind === Kind.COMMENT && element.scoreHidden) {
		return i18n.t("tagline.commentScoreHidden");
	}

	const score = element.score + element.userVote;
	const scoreString =
		score < 9999
			? score.toString()
			: i18n.t("tagline.commentThousandUnit", [
					(score / 1000).toFixed(score > 99_999 ? 0 : 1),
				]);

	if (element.kind === Kind.THREAD) {
		return scoreString;
	}

	return i18n.t("tagline.commentPoints", score);
}

export { cleanString, getScoreString };
