import { useState } from "react";
import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { Button, TextArea } from "react-aria-components";

import { textBox as textBoxStyles } from "@/components/common/variants/text-variants";
import { Kind } from "@/utils/constants";
import { sendMessage } from "@/utils/messaging";
import type { Post } from "@/utils/types/elements";
import type { CommentRequest } from "@/utils/types/network-requests";

const styles = textBoxStyles();
const containerClassName = styles.container();
const errorClassName = styles.error();
const footerButtonClassName = styles.footerButton();
const footerClassName = styles.footer();
const statusClassName = styles.status();
const textAreaClassName = styles.textArea();

const footerButtonStyle = { fontSize: "revert" } as const;

function stopHostKeyboardShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
	event.stopPropagation();
	event.nativeEvent.stopImmediatePropagation();
}

interface SaveCommentParams {
	setErrorMessage: Dispatch<SetStateAction<string>>;
	setTextAreaValue: Dispatch<SetStateAction<string>>;
	textAreaValue: string;
	textBoxProps: TextBoxProps;
}

async function saveComment({
	setErrorMessage,
	setTextAreaValue,
	textAreaValue,
	textBoxProps,
}: SaveCommentParams) {
	const { onCommentSave, parentElement, startingValue } = textBoxProps;
	const { fullId, kind, website } = parentElement;

	const request: CommentRequest = {
		id: fullId,
		isEdit: Boolean(startingValue),
		text: textAreaValue,
		threadId: kind === Kind.COMMENT ? parentElement.thread : fullId,
		website,
	};

	const response = await sendMessage("comment", request);

	if (!response.success) {
		setErrorMessage(response.errorMessage);
		return;
	}

	const nextParent: Post =
		startingValue && parentElement.kind === Kind.COMMENT
			? {
					...parentElement,
					body: response.value.body,
					bodyHtml: response.value.bodyHtml,
					editedTimestamp: response.value.editedTimestamp,
				}
			: {
					...parentElement,
					replies: [response.value, ...parentElement.replies],
				};

	if (startingValue === undefined) {
		setTextAreaValue("");
	}

	onCommentSave(nextParent);
}

interface CancelButtonProps {
	onCancel: () => void;
}

function CancelButton({ onCancel }: CancelButtonProps) {
	return (
		<Button
			className={footerButtonClassName}
			onPress={onCancel}
			style={footerButtonStyle}
		>
			{i18n.t("cancel")}
		</Button>
	);
}

interface TextBoxFooterProps {
	textBox: ReturnType<typeof useTextBox>;
	textBoxProps: TextBoxProps;
}

function TextBoxFooter({ textBox, textBoxProps }: TextBoxFooterProps) {
	const { errorMessage, handleSaveComment, isSubmitting } = textBox;
	const { parentElement, onCommentCancel } = textBoxProps;

	const showCancel = parentElement.kind === Kind.COMMENT;

	return (
		<div className={footerClassName}>
			<Button
				className={footerButtonClassName}
				isDisabled={isSubmitting}
				onPress={handleSaveComment}
				style={footerButtonStyle}
			>
				{i18n.t("save")}
			</Button>

			{showCancel && onCommentCancel && (
				<CancelButton onCancel={onCommentCancel} />
			)}

			{isSubmitting && (
				<span className={statusClassName}>{i18n.t("submitting")}</span>
			)}

			<span className={errorClassName}>{errorMessage}</span>
		</div>
	);
}

type UseTextBoxParams = TextBoxProps;

function useTextBox(params: UseTextBoxParams) {
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [textAreaValue, setTextAreaValue] = useState(
		params.startingValue ?? "",
	);

	const submitComment = async () => {
		if (isSubmitting) {
			return;
		}

		setErrorMessage("");
		setIsSubmitting(true);

		await saveComment({
			setErrorMessage,
			setTextAreaValue,
			textAreaValue,
			textBoxProps: params,
		});

		setIsSubmitting(false);
	};

	const handleCtrlEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		stopHostKeyboardShortcut(event);

		if (event.ctrlKey && event.key === "Enter") {
			event.preventDefault();

			void submitComment();
		}
	};

	const handleSaveComment = () => {
		void submitComment();
	};

	const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setTextAreaValue(event.target.value);
	};

	return {
		errorMessage,
		handleCtrlEnter,
		handleSaveComment,
		handleTextChange,
		isSubmitting,
		textAreaValue,
	};
}

interface TextBoxProps {
	onCommentCancel?: (() => void) | undefined;
	onCommentSave: (parentElement: Post) => void;
	parentElement: Post;
	startingValue?: string | undefined;
}

function TextBox(props: TextBoxProps) {
	const textBox = useTextBox(props);
	const { handleCtrlEnter, handleTextChange, textAreaValue } = textBox;

	return (
		<div className={containerClassName}>
			<TextArea
				className={textAreaClassName}
				onChange={handleTextChange}
				onKeyDown={handleCtrlEnter}
				onKeyUp={stopHostKeyboardShortcut}
				value={textAreaValue}
			/>
			<TextBoxFooter textBox={textBox} textBoxProps={props} />
		</div>
	);
}

export { TextBox };
