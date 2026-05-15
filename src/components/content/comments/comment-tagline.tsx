import { Button } from "react-aria-components";

import { ExternalLink } from "@/components/common/external-link";
import { commentTaglineBlock } from "@/components/common/variants/comment-variants";
import { getScoreString } from "@/utils/tools/string-tools";
import { timestampToRelativeTime } from "@/utils/tools/time-tools";
import type { Comment } from "@/utils/types/elements";

import type { CommentComponent } from "./comment-container-hooks";

const styles = commentTaglineBlock();
const controversialClassName = styles.controversial();
const taglineClassName = styles.root();

function getAuthorState(comment: Comment) {
	if (comment.distinguishedPoster) {
		return "distinguished";
	}

	return "default";
}

interface AuthorProps {
	commentTaglineProps: CommentTaglineProps;
}

function Author({ commentTaglineProps }: AuthorProps) {
	const { comment, commentComponent } = commentTaglineProps;
	const { author, authorLink } = comment;
	const { isCollapsed } = commentComponent;

	const deletedAuthorClassName = styles.deletedAuthor({
		collapsed: isCollapsed,
	});

	if (author === "[deleted]") {
		return (
			<span className={deletedAuthorClassName}>
				<em>[deleted]</em>
			</span>
		);
	}

	const authorClassName = styles.author({
		authorState: getAuthorState(comment),
		collapsed: commentComponent.isCollapsed,
		distinguishedPoster: comment.distinguishedPoster,
	});

	return (
		<ExternalLink className={authorClassName} href={authorLink}>
			{author}
		</ExternalLink>
	);
}

function getEditedTimestampText(comment: Comment) {
	if (!comment.editedTimestamp) {
		return;
	}

	return i18n.t("tagline.commentEdited", [
		timestampToRelativeTime(comment.editedTimestamp),
	]);
}

interface AuthorProps {
	commentTaglineProps: CommentTaglineProps;
}

function Meta({ commentTaglineProps }: AuthorProps) {
	const { commentComponent, comment } = commentTaglineProps;
	const { isCollapsed } = commentComponent;
	const { controversial, locked, stickied, createdTimestamp } = comment;

	const score = getScoreString(comment);
	const editedTimestamp = getEditedTimestampText(comment);
	const createdRelativeTime = timestampToRelativeTime(createdTimestamp);

	const metaClassName = styles.meta({ collapsed: isCollapsed });
	const scoreClassName = styles.score({ collapsed: isCollapsed });

	return (
		<div className={metaClassName}>
			<span className={scoreClassName}>{score}</span>
			{controversial && <sup className={controversialClassName}>†</sup>}{" "}
			<span>{createdRelativeTime}</span>
			{editedTimestamp && <span title={editedTimestamp}>*</span>}
			{locked && <span>🔒</span>}
			{stickied && <span>{i18n.t("tagline.stickiedComment")}</span>}
		</div>
	);
}

interface CommentTaglineProps {
	comment: Comment;
	commentComponent: CommentComponent;
}

function CommentTagline(commentTaglineProps: CommentTaglineProps) {
	const { isCollapsed, handleCollapsedToggle } =
		commentTaglineProps.commentComponent;

	const collapseButtonClassName = styles.collapseButton({
		collapsed: isCollapsed,
	});

	return (
		<div className={taglineClassName}>
			<Button
				className={collapseButtonClassName}
				onPress={handleCollapsedToggle}
			>
				[{isCollapsed ? "＋" : "－"}]
			</Button>{" "}
			<Author commentTaglineProps={commentTaglineProps} />
			<Meta commentTaglineProps={commentTaglineProps} />
		</div>
	);
}

export { CommentTagline };
