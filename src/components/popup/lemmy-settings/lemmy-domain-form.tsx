import type { KeyboardEvent } from "react";
import { useCallback } from "react";
import { Button, Input, TextField } from "react-aria-components";

import { lemmyDomainForm } from "@/components/common/variants/popup-variants";

const styles = lemmyDomainForm();
const buttonClassName = styles.button();
const errorClassName = styles.error();
const formRowClassName = styles.formRow();

interface LemmyDomainFormProps {
	errorMessage: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	value: string;
}

function LemmyDomainForm({
	errorMessage,
	onChange,
	onSubmit,
	value,
}: LemmyDomainFormProps) {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key !== "Enter") {
				return;
			}

			event.preventDefault();
			onSubmit();
		},
		[onSubmit],
	);

	return (
		<>
			<TextField className={formRowClassName} onChange={onChange} value={value}>
				<Input onKeyDown={handleKeyDown} placeholder={i18n.t("instance")} />
				<Button className={buttonClassName} onPress={onSubmit}>
					{i18n.t("popupButtons.set")}
				</Button>
			</TextField>
			<span className={errorClassName}>{errorMessage}</span>
		</>
	);
}

export { LemmyDomainForm };
