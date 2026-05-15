import { Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Input,
	Label,
	Tag,
	TagGroup,
	TagList,
	TextField,
} from "react-aria-components";
import type { Key } from "react-aria-components";

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

interface RemoveEntriesSequentiallyParams {
	keys: Key[];
	name: Settings;
}

async function removeEntriesSequentially({
	keys,
	name,
}: RemoveEntriesSequentiallyParams): Promise<string[]> {
	const [key, ...remainingKeys] = keys;

	if (key === undefined) {
		const value = await getValue(name);
		return Array.isArray(value) ? value : [];
	}

	await removeFromArray(name, String(key));
	return removeEntriesSequentially({ keys: remainingKeys, name });
}

interface ListInputProps {
	listSetting: ListSetting;
}

function ListInput({ listSetting }: ListInputProps) {
	const { inputValue, handleAddEntry, handleInputChange } = listSetting;

	return (
		<TextField
			className={formRowClassName}
			onChange={handleInputChange}
			value={inputValue}
		>
			<Input />
			<Button className={addButtonClassName} onPress={handleAddEntry}>
				{i18n.t("popupButtons.add")}
			</Button>
		</TextField>
	);
}

interface ListEntriesProps {
	entries: ListSetting["entries"];
}

function RemoveButton() {
	return (
		<Button className={removeButtonClassName} slot="remove">
			<Trash className={removeIconClassName} />
		</Button>
	);
}

function ListEntries({ entries }: ListEntriesProps) {
	const items = useMemo(
		() => entries.map((entry) => ({ id: entry, name: entry })),
		[entries],
	);

	return (
		<TagList className={tagListClassName} items={items}>
			{(entry) => (
				<Tag className={tagClassName} id={entry.id} textValue={entry.name}>
					<span className={textClassName}>{entry.name}</span>
					<RemoveButton />
				</Tag>
			)}
		</TagList>
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

	const handleRemoveEntries = (keys: Set<Key>) => {
		void (async () => {
			const nextEntries = await removeEntriesSequentially({
				keys: [...keys],
				name,
			});

			setEntries(nextEntries);
		})();
	};

	return {
		entries,
		errorMessage,
		handleAddEntry,
		handleInputChange,
		handleRemoveEntries,
		inputValue,
	};
}

interface ListSettingProps {
	setting: Extract<SettingEntry, { type: "array" }>;
}

function ListSetting({ setting }: ListSettingProps) {
	const listSetting = useListSetting(setting.name);

	const { errorMessage, entries, handleRemoveEntries } = listSetting;

	return (
		<TagGroup className={rootClassName} onRemove={handleRemoveEntries}>
			<Label className={labelClassName}>{setting.label}</Label>
			<ListInput listSetting={listSetting} />
			<span className={errorClassName} slot="errorMessage">
				{errorMessage}
			</span>
			<ListEntries entries={entries} />
		</TagGroup>
	);
}

export { ListSetting };
