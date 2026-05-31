import { Trash } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Button, Input, TextField } from "react-aria-components";

import { listSetting as listSettingStyles } from "@/components/common/variants/popup-variants";
import { addToArray, getValue, removeFromArray } from "@/utils/settings";
import type { SettingEntry, Settings } from "@/utils/settings";

type ListSetting = ReturnType<typeof useListSetting>;

const styles = listSettingStyles();
const addButtonClassName = styles.addButton();
const errorClassName = styles.error();
const formRowClassName = styles.formRow();
const labelClassName = styles.label();
const removeIconClassName = styles.removeIcon();
const removeButtonClassName = styles.removeButton();
const rootClassName = styles.root();
const tagClassName = styles.tag();
const tagListClassName = styles.tagList();
const textClassName = styles.text();

interface ListInputProps {
	listSetting: ListSetting;
}

function ListInput({ listSetting }: ListInputProps) {
	const { inputValue, handleAddEntry, handleInputChange } = listSetting;

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key !== "Enter") {
				return;
			}

			event.preventDefault();
			handleAddEntry();
		},
		[handleAddEntry],
	);

	return (
		<TextField
			className={formRowClassName}
			onChange={handleInputChange}
			value={inputValue}
		>
			<Input onKeyDown={handleKeyDown} />
			<Button className={addButtonClassName} onPress={handleAddEntry}>
				{i18n.t("popupButtons.add")}
			</Button>
		</TextField>
	);
}

interface RemoveButtonProps {
	entry: string;
	onRemove: (entry: string) => void;
}

function RemoveButton({ entry, onRemove }: RemoveButtonProps) {
	const handlePress = useCallback(() => {
		onRemove(entry);
	}, [entry, onRemove]);

	return (
		<Button
			aria-label={`Remove ${entry}`}
			className={removeButtonClassName}
			onPress={handlePress}
		>
			<Trash className={removeIconClassName} />
		</Button>
	);
}

interface ListEntriesProps {
	entries: ListSetting["entries"];
	onRemoveEntry: ListSetting["handleRemoveEntry"];
}

function ListEntries({ entries, onRemoveEntry }: ListEntriesProps) {
	return (
		<ul className={tagListClassName}>
			{entries.map((entry) => (
				<li className={tagClassName} key={entry}>
					<span className={textClassName}>{entry}</span>
					<RemoveButton entry={entry} onRemove={onRemoveEntry} />
				</li>
			))}
		</ul>
	);
}

function useListSetting(name: Settings) {
	const [entries, setEntries] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		void (async () => {
			const storedValue = await getValue(name);
			if (Array.isArray(storedValue)) {
				setEntries(storedValue);
			}
		})();
	}, [name]);

	const handleInputChange = (value: string) => {
		setInputValue(value);
	};

	const handleAddEntry = () => {
		void (async () => {
			const result = await addToArray(name, inputValue);
			if (typeof result === "string") {
				setErrorMessage(result);
				return;
			}

			setErrorMessage("");
			setEntries(result);
			setInputValue("");
		})();
	};

	const handleRemoveEntry = (entry: string) => {
		void (async () => {
			const nextEntries = await removeFromArray(name, entry);
			setEntries(nextEntries);
		})();
	};

	return {
		entries,
		errorMessage,
		handleAddEntry,
		handleInputChange,
		handleRemoveEntry,
		inputValue,
	};
}

interface ListSettingProps {
	setting: Extract<SettingEntry, { type: "array" }>;
}

function ListSetting({ setting }: ListSettingProps) {
	const listSetting = useListSetting(setting.name);

	const { errorMessage, entries, handleRemoveEntry } = listSetting;

	return (
		<div className={rootClassName}>
			<span className={labelClassName}>{setting.label}</span>
			<ListInput listSetting={listSetting} />
			<span className={errorClassName}>{errorMessage}</span>
			<ListEntries entries={entries} onRemoveEntry={handleRemoveEntry} />
		</div>
	);
}

export { ListSetting };
