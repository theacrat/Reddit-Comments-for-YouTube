import { createContext, memo, useContext } from "react";
import type { ReactNode } from "react";

import { commentTree } from "@/components/common/variants/comment-variants";
import { TextBox } from "@/components/content/posts/textbox";
import { Votes } from "@/components/content/posts/votes";
import { Kind } from "@/utils/constants";
import type { Replies, Comment } from "@/utils/types/elements";

import { useCommentComponent } from "./comment-container-hooks";
import type { CommentComponent } from "./comment-container-hooks";
import { CommentContent } from "./comment-content";
import { CommentTagline } from "./comment-tagline";
import { MoreChildren } from "./more-children";

const CommentParentStateContext = createContext<CommentComponent | undefined>(
	undefined,
);

interface CommentBodyProps {
	bodyProps: CommentBlockProps;
}

function CommentBody({ bodyProps }: CommentBodyProps) {
	const { comment, commentComponent, styles } = bodyProps;

	const bodyClassName = styles.body();
	const contentWrapperClassName = styles.contentWrapper();

	return (
		<div className={bodyClassName}>
			<CommentTagline comment={comment} commentComponent={commentComponent} />
			<div className={contentWrapperClassName}>
				<CommentContent comment={comment} commentComponent={commentComponent} />
			</div>
		</div>
	);
}

interface CommentBlockProps {
	comment: Comment;
	commentComponent: CommentComponent;
	styles: ReturnType<typeof commentTree>;
}

function CommentBlock(props: CommentBlockProps) {
	const { commentComponent, comment, styles } = props;

	const voteCellClassName = styles.voteCell();

	return (
		<div>
			<div className={voteCellClassName}>
				{!commentComponent.isCollapsed && <Votes element={comment} />}
			</div>{" "}
			<CommentBody bodyProps={props} />
		</div>
	);
}

interface ReplyBoxProps {
	bodyProps: CommentBlockProps;
}

function ReplyBox({ bodyProps }: ReplyBoxProps) {
	const { comment, commentComponent, styles } = bodyProps;
	const { handleCommentSave, handleCommentCancel } = commentComponent;

	const replyWrapperClassName = styles.replyWrapper();

	return (
		<div className={replyWrapperClassName}>
			<TextBox
				onCommentCancel={handleCommentCancel}
				onCommentSave={handleCommentSave}
				parentElement={comment}
			/>
		</div>
	);
}

interface ChildrenBlockProps extends CommentBlockProps {
	children?: ReactNode | undefined;
}

function ChildrenBlock({ children, ...props }: ChildrenBlockProps) {
	const { commentComponent, styles } = props;
	const { isReplying } = commentComponent;

	const childrenBlockClassName = styles.childrenBlock();

	return (
		<div className={childrenBlockClassName}>
			{isReplying && <ReplyBox bodyProps={props} />}

			<CommentParentStateContext.Provider value={commentComponent}>
				{children}
			</CommentParentStateContext.Provider>
		</div>
	);
}

interface CommentComponentProps {
	children?: ReactNode | undefined;
	comment: Comment;
}

const CommentComponent = memo(function CommentComponent({
	children,
	comment,
}: CommentComponentProps) {
	const commentComponent = useCommentComponent(comment);
	const { isCollapsed } = commentComponent;

	const styles = commentTree({ collapsed: isCollapsed });

	return (
		<div>
			<CommentBlock
				comment={comment}
				commentComponent={commentComponent}
				styles={styles}
			/>
			<ChildrenBlock
				comment={comment}
				commentComponent={commentComponent}
				styles={styles}
			>
				{children}
			</ChildrenBlock>
		</div>
	);
});

interface CommentContainerProps {
	replies: Replies;
}

function CommentContainer({ replies }: CommentContainerProps) {
	const parentState = useContext(CommentParentStateContext);

	const isHidden = Boolean(
		parentState && (parentState.isCollapsed || parentState.areChildrenHidden),
	);

	const styles = commentTree({ hidden: isHidden });
	const rootClassName = styles.root();

	return (
		<div className={rootClassName}>
			{replies.map((reply) =>
				reply.kind === Kind.COMMENT ? (
					<CommentComponent comment={reply} key={reply.fullId}>
						<CommentContainer replies={reply.replies} />
					</CommentComponent>
				) : (
					<MoreChildren
						comments={replies}
						key={`${reply.parent}-${reply.count}-${reply.page ?? 0}`}
						moreChildren={reply}
					/>
				),
			)}
		</div>
	);
}

export { CommentContainer };
