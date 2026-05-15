import { useCallback } from "react";
import { Button } from "react-aria-components";
import type { PressEvent } from "react-aria-components";

import { ExternalLink } from "@/components/common/external-link";
import { commentContent } from "@/components/common/variants/comment-variants";
import { HtmlContent } from "@/components/content/posts/html-content";
import { TextBox } from "@/components/content/posts/textbox";
import { useCanPost, useThreadStore } from "@/components/content/thread-store";
import { Kind } from "@/utils/constants";
import type { Comment, Post } from "@/utils/types/elements";

import type { CommentComponent } from "./comment-container-hooks";
import { OwnerButtons } from "./owner-buttons";

const styles = commentContent();
const actionButtonClassName = styles.actionButton();
const actionsClassName = styles.actions();
const htmlClassName = styles.html();
const permalinkClassName = styles.permalink();

interface ReplyButtonProps {
	onReplyStart: () => void;
}

function ReplyButton({ onReplyStart }: ReplyButtonProps) {
	return (
		<Button className={actionButtonClassName} onPress={onReplyStart}>
			{i18n.t("commentButtons.reply")}
		</Button>
	);
}

interface ToggleButtonProps {
	areChildrenHidden: boolean;
	onChildrenToggle: (event: PressEvent) => void;
}

function ToggleButton({
	areChildrenHidden,
	onChildrenToggle,
}: ToggleButtonProps) {
	const labelKey = areChildrenHidden ? "show" : "hide";

	return (
		<Button className={actionButtonClassName} onPress={onChildrenToggle}>
			{i18n.t(`commentButtons.childComments.${labelKey}`)}
		</Button>
	);
}

interface ButtonsProps {
	commentContentProps: CommentContentProps;
}

function Buttons({ commentContentProps }: ButtonsProps) {
	const { comment, commentComponent } = commentContentProps;
	const { authorLink, link, locked, replies } = comment;
	const {
		areChildrenHidden,
		handleChildrenToggle,
		handleEditStart,
		handleReplyStart,
	} = commentComponent;

	const canPost = useCanPost();

	const emitThreadChange = useThreadStore((state) => state.emitThreadChange);
	const username = useThreadStore((state) => state.user?.username);

	const hasChildComments = replies.some((reply) => reply.kind === Kind.COMMENT);

	return (
		<div className={actionsClassName}>
			<ExternalLink className={permalinkClassName} href={link}>
				{i18n.t("commentButtons.permalink")}
			</ExternalLink>

			{canPost && !locked && <ReplyButton onReplyStart={handleReplyStart} />}

			{authorLink === username && (
				<OwnerButtons
					comment={comment}
					onCommentDeleted={emitThreadChange}
					onEditStart={handleEditStart}
				/>
			)}

			{hasChildComments && (
				<ToggleButton
					areChildrenHidden={areChildrenHidden}
					onChildrenToggle={handleChildrenToggle}
				/>
			)}
		</div>
	);
}

interface DisplayProps {
	commentContentProps: CommentContentProps;
}

function Display({ commentContentProps }: DisplayProps) {
	const { comment } = commentContentProps;
	const html = comment.bodyHtml ?? "";

	return (
		<>
			<HtmlContent className={htmlClassName} html={html} />
			<Buttons commentContentProps={commentContentProps} />
		</>
	);
}

interface CommentContentProps {
	comment: Comment;
	commentComponent: CommentComponent;
}

function CommentContent(props: CommentContentProps) {
	const { comment, commentComponent } = props;
	const { isEditing, handleEditEnd } = commentComponent;

	const handlePostUpdate = useThreadStore((state) => state.handlePostUpdate);

	const handleEditSave = useCallback(
		(parentElement: Post) => {
			handlePostUpdate(parentElement);
			handleEditEnd();
		},
		[handleEditEnd, handlePostUpdate],
	);

	if (isEditing) {
		return (
			<TextBox
				onCommentCancel={handleEditEnd}
				onCommentSave={handleEditSave}
				parentElement={comment}
				startingValue={comment.body}
			/>
		);
	}

	return <Display commentContentProps={props} />;
}

export { CommentContent };
