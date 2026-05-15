import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { useThreadStore } from "@/components/content/thread-store";
import { Kind } from "@/utils/constants";
import { Settings, getValue } from "@/utils/settings";
import type { Comment, Post } from "@/utils/types/elements";

type CommentComponent = ReturnType<typeof useCommentComponent>;

function toggleBoolean(value: boolean) {
	return !value;
}

interface UseBodyHandlersParams extends UseReplyBoxHandlersParams {
	setAreChildrenHidden: Dispatch<SetStateAction<boolean>>;
	setIsCollapsed: Dispatch<SetStateAction<boolean>>;
	setIsEditing: Dispatch<SetStateAction<boolean>>;
}

function useBodyHandlers({
	setAreChildrenHidden,
	setIsCollapsed,
	setIsEditing,
	setIsReplying,
}: UseBodyHandlersParams) {
	const handleCollapsedToggle = () => {
		setIsCollapsed(toggleBoolean);
	};

	const handleEditStart = () => {
		setIsEditing(true);
	};

	const handleEditEnd = () => {
		setIsEditing(false);
	};

	const handleReplyStart = () => {
		setIsReplying(true);
	};

	const handleChildrenToggle = () => {
		setAreChildrenHidden(toggleBoolean);
	};

	return {
		handleChildrenToggle,
		handleCollapsedToggle,
		handleEditEnd,
		handleEditStart,
		handleReplyStart,
	};
}

interface UseReplyBoxHandlersParams {
	setIsReplying: Dispatch<SetStateAction<boolean>>;
}

function useReplyBoxHandlers({ setIsReplying }: UseReplyBoxHandlersParams) {
	const handlePostUpdate = useThreadStore((state) => state.handlePostUpdate);

	const handleCommentCancel = () => {
		setIsReplying(false);
	};

	const handleCommentSave = (parentElement: Post) => {
		handlePostUpdate(parentElement);
		setIsReplying(false);
	};

	return { handleCommentCancel, handleCommentSave };
}

function useCommentComponent(comment: Comment) {
	const [areChildrenHidden, setAreChildrenHidden] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isReplying, setIsReplying] = useState(false);

	const bodyHandlers = useBodyHandlers({
		setAreChildrenHidden,
		setIsCollapsed,
		setIsEditing,
		setIsReplying,
	});

	const replyBoxHandlers = useReplyBoxHandlers({ setIsReplying });

	useEffect(() => {
		void (async () => {
			if (comment.parent.startsWith(Kind.THREAD)) {
				const hiddenDefault = await getValue(Settings.CHILDRENHIDDENDEFAULT);

				setAreChildrenHidden(hiddenDefault);
			}
		})();
	}, [comment.fullId, comment.parent]);

	return {
		...bodyHandlers,
		...replyBoxHandlers,
		areChildrenHidden,
		isCollapsed,
		isEditing,
		isReplying,
	};
}

export { useCommentComponent, useBodyHandlers, useReplyBoxHandlers };
export type { CommentComponent };
