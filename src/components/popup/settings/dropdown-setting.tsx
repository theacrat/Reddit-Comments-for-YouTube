import { useEffect, useMemo, useState } from "react";

import { CustomSelect } from "@/components/common/custom-select";
import { dropdownSetting } from "@/components/common/variants/popup-variants";
import { getValue, setValue } from "@/utils/settings";
import type { SettingEntry, Settings } from "@/utils/settings";
import type { SelectOption } from "@/utils/types/elements";

const styles = dropdownSetting();
const selectClassName = styles.select();

function useDropdownSetting(name: Settings) {
	const [selectedValue, setSelectedValue] = useState("");

	useEffect(() => {
		async function loadValue() {
			const value = await getValue(name);

			if (typeof value === "string") {
				setSelectedValue(value);
			}
		}

		void loadValue();
	}, [name]);

	const handleChange = (option: SelectOption<string>) => {
		const nextValue = option.id;

		setSelectedValue(nextValue);
		setValue(name, nextValue);
	};

	return { handleChange, selectedValue };
}

interface DropdownSettingProps {
	setting: Extract<SettingEntry, { type: "option" }>;
}

function DropdownSetting({ setting }: DropdownSettingProps) {
	const { handleChange, selectedValue } = useDropdownSetting(setting.name);

	const options = useMemo(
		() =>
			setting.options.map((option) => ({
				id: option,
				title: option,
			})),
		[setting.options],
	);

	const selectedOption = options.find((option) => option.id === selectedValue);

	return (
		<CustomSelect
			className={selectClassName}
			label={setting.label}
			onSelect={handleChange}
			options={options}
			selectedOption={selectedOption}
		/>
	);
}

export { DropdownSetting };
