import { Button } from "react-aria-components";

import { ExternalLink } from "@/components/common/external-link";
import { threadSummary as threadSummaryStyles } from "@/components/common/variants/thread-variants";
import { HtmlContent } from "@/components/content/posts/html-content";
import { Votes } from "@/components/content/posts/votes";
import { numberToHms, timestampToRelativeTime } from "@/utils/tools/time-tools";
import type { Thread } from "@/utils/types/elements";

const styles = threadSummaryStyles();
const authorLinkClassName = styles.authorLink();
const communityLinkClassName = styles.communityLink();
const contentClassName = styles.content();
const htmlClassName = styles.html();
const rowClassName = styles.row();
const taglineClassName = styles.tagline();
const timestampButtonClassName = styles.timestampButton();
const titleClassName = styles.title();
const titleLinkClassName = styles.titleLink();
const voteCellClassName = styles.voteCell();

interface ThreadTimestampLinkProps {
	linkedTimestamp: number;
	onTimestampClick: ThreadSummaryProps["onTimestampClick"];
}

function ThreadTimestampLinkProps({
	linkedTimestamp,
	onTimestampClick,
}: ThreadTimestampLinkProps) {
	return (
		<>
			{" "}
			<span> -- </span>
			<Button className={timestampButtonClassName} onPress={onTimestampClick}>
				{numberToHms(linkedTimestamp)}
			</Button>
		</>
	);
}

interface ThreadTitleProps {
	threadSummaryProps: ThreadSummaryProps;
}

function ThreadTitle({ threadSummaryProps }: ThreadTitleProps) {
	const { onTimestampClick, thread } = threadSummaryProps;
	const { link, linkedTimestamp, plainTitle } = thread;

	return (
		<span className={titleClassName}>
			<ExternalLink className={titleLinkClassName} href={link}>
				{plainTitle}
			</ExternalLink>
			{linkedTimestamp !== undefined && (
				<ThreadTimestampLinkProps
					linkedTimestamp={linkedTimestamp}
					onTimestampClick={onTimestampClick}
				/>
			)}
		</span>
	);
}

interface ThreadTaglineProps {
	thread: Thread;
}

function ThreadTagline({ thread }: ThreadTaglineProps) {
	const { author, authorLink, community, communityLink, createdTimestamp } =
		thread;
	const submittedRelativeTime = timestampToRelativeTime(createdTimestamp);

	return (
		<p className={taglineClassName}>
			{i18n.t("tagline.submitted")} {submittedRelativeTime}{" "}
			{i18n.t("tagline.by")}{" "}
			<ExternalLink className={authorLinkClassName} href={authorLink}>
				{author}
			</ExternalLink>{" "}
			{i18n.t("tagline.to")}{" "}
			<ExternalLink className={communityLinkClassName} href={communityLink}>
				{community}
			</ExternalLink>
		</p>
	);
}

interface ThreadSummaryProps {
	onTimestampClick: () => void;
	thread: Thread;
}

function ThreadSummary(props: ThreadSummaryProps) {
	const { thread } = props;

	return (
		<div className={rowClassName}>
			<div className={voteCellClassName}>
				<Votes element={thread} />
			</div>
			<div className={contentClassName}>
				<ThreadTitle threadSummaryProps={props} />
				<ThreadTagline thread={thread} />
				{thread.selftext_html && (
					<HtmlContent className={htmlClassName} html={thread.selftext_html} />
				)}
			</div>
		</div>
	);
}

export { ThreadSummary };
