import { useCallback, useState } from "react";
import { Button } from "react-aria-components";

import { commentOwnerButtons } from "@/components/common/variants/comment-variants";
import { sendMessage } from "@/utils/messaging";
import type { Comment } from "@/utils/types/elements";
import type { DeleteRequest } from "@/utils/types/network-requests";

const styles = commentOwnerButtons();
const confirmTextClassName = styles.confirmation();
const deleteControlClassName = styles.action();

interface DeleteConfirmationButtonsProps {
	deleteButtons: ReturnType<typeof useDeleteButtons>;
}

function DeleteConfirmationButtonsProps({
	deleteButtons,
}: DeleteConfirmationButtonsProps) {
	const { handleCancelDelete, handleConfirmDelete } = deleteButtons;

	return (
		<span className={confirmTextClassName}>
			{i18n.t("commentButtons.confirmDelete")}{" "}
			<Button className={deleteControlClassName} onPress={handleConfirmDelete}>
				{i18n.t("commentButtons.yes")}
			</Button>{" "}
			/{" "}
			<Button className={deleteControlClassName} onPress={handleCancelDelete}>
				{i18n.t("commentButtons.no")}
			</Button>
		</span>
	);
}

type UseDeleteButtonsParams = OwnerButtonsProps;

function useDeleteButtons({
	comment,
	onCommentDeleted,
}: UseDeleteButtonsParams) {
	const [isDeleted, setIsDeleted] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleCancelDelete = () => {
		setIsDeleting(false);
	};

	const handleConfirmDelete = useCallback(() => {
		const request: DeleteRequest = {
			id: comment.fullId,
			website: comment.website,
		};

		void sendMessage("deleteComment", request);

		setIsDeleted(true);
		onCommentDeleted();
	}, [comment.fullId, comment.website, onCommentDeleted]);

	const handleStartDelete = () => {
		setIsDeleting(true);
	};

	return {
		handleCancelDelete,
		handleConfirmDelete,
		handleStartDelete,
		isDeleted,
		isDeleting,
	};
}

interface DeleteButtonsProps {
	ownerButtonsProps: OwnerButtonsProps;
}

function DeleteButtons({ ownerButtonsProps }: DeleteButtonsProps) {
	const deleteButtons = useDeleteButtons(ownerButtonsProps);
	const { isDeleted, isDeleting, handleStartDelete } = deleteButtons;

	if (isDeleted) {
		return <span>{i18n.t("commentButtons.deleted")}</span>;
	}

	if (isDeleting) {
		return <DeleteConfirmationButtonsProps deleteButtons={deleteButtons} />;
	}

	return (
		<Button className={deleteControlClassName} onPress={handleStartDelete}>
			{i18n.t("commentButtons.delete")}
		</Button>
	);
}

interface OwnerButtonsProps {
	comment: Comment;
	onCommentDeleted: () => void;
	onEditStart: () => void;
}

function OwnerButtons(props: OwnerButtonsProps) {
	return (
		<>
			<Button className={deleteControlClassName} onPress={props.onEditStart}>
				{i18n.t("commentButtons.edit")}
			</Button>
			<DeleteButtons ownerButtonsProps={props} />
		</>
	);
}

export { OwnerButtons };
