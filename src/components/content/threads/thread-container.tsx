import { CustomSelect } from "@/components/common/custom-select";
import { threadContainer as threadContainerStyles } from "@/components/common/variants/thread-variants";
import { CommentContainer } from "@/components/content/comments/comment-container";
import { TextBox } from "@/components/content/posts/textbox";
import { useCanPost, useThreadStore } from "@/components/content/thread-store";
import type { Site } from "@/utils/types/site";

import {
	useThreadTimestampClick,
	useThreadContainer,
} from "./thread-container-hooks";
import { ThreadSummary } from "./thread-summary";

type ThreadContainerState = NonNullable<ReturnType<typeof useThreadContainer>>;

interface ThreadContainerChildProps {
	styles: ReturnType<typeof threadContainerStyles>;
	threadContainer: ThreadContainerState;
}

interface ThreadContainerProps {
	site: Parameters<typeof useThreadContainer>[0];
}

type SortSelectorProps = ThreadContainerChildProps;

function SortSelector({ styles, threadContainer }: SortSelectorProps) {
	const sortRowClassName = styles.sortRow();

	return (
		<div className={sortRowClassName}>
			<CustomSelect
				label={i18n.t("sortedBy")}
				onSelect={threadContainer.handleSortChange}
				options={threadContainer.sortOptions}
				selectedOption={threadContainer.selectedSort}
			/>
		</div>
	);
}

type ThreadCommentsBlockProps = ThreadContainerChildProps;

function ThreadCommentsBlock({
	styles,
	threadContainer,
}: ThreadCommentsBlockProps) {
	const { isHidden, selectedSort, thread } = threadContainer;

	if (isHidden || !selectedSort) {
		const noticeClassName = styles.notice();

		return <span className={noticeClassName}>{i18n.t("loadingComments")}</span>;
	}

	return <CommentContainer replies={thread.replies} />;
}

interface ThreadSummaryBlockProps extends ThreadContainerChildProps {
	site: Site;
}

function ThreadSummaryBlock({
	site,
	styles,
	threadContainer,
}: ThreadSummaryBlockProps) {
	const { thread } = threadContainer;
	const handleTimestampClick = useThreadTimestampClick({ site, thread });

	const summaryWrapperClassName = styles.summaryWrapper();
	return (
		<div className={summaryWrapperClassName}>
			<ThreadSummary onTimestampClick={handleTimestampClick} thread={thread} />
		</div>
	);
}

interface ThreadComposerProps {
	threadContainer: ThreadContainerState;
}

function ThreadComposer({ threadContainer }: ThreadComposerProps) {
	const handlePostUpdate = useThreadStore((state) => state.handlePostUpdate);

	return (
		<TextBox
			onCommentSave={handlePostUpdate}
			parentElement={threadContainer.thread}
		/>
	);
}

function ThreadContainer({ site }: ThreadContainerProps) {
	const threadContainer = useThreadContainer(site);
	const canPost = useCanPost();

	if (!threadContainer) {
		return;
	}

	const { isHidden, selectedSort } = threadContainer;

	const showSortSelector = !isHidden && selectedSort;
	const showComposer = canPost && !isHidden;

	const styles = threadContainerStyles({ hidden: isHidden });
	const rootClassName = styles.root();

	return (
		<div className={rootClassName}>
			<ThreadSummaryBlock
				site={site}
				styles={styles}
				threadContainer={threadContainer}
			/>

			{showSortSelector && (
				<SortSelector styles={styles} threadContainer={threadContainer} />
			)}

			{showComposer && <ThreadComposer threadContainer={threadContainer} />}

			<div>
				<ThreadCommentsBlock
					styles={styles}
					threadContainer={threadContainer}
				/>
			</div>
		</div>
	);
}

export { ThreadContainer };
