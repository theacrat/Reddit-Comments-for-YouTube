import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Checkbox } from "react-aria-components";

import { checkboxSetting as checkboxSettingStyles } from "@/components/common/variants/popup-variants";
import { getValue, setValue } from "@/utils/settings";
import type { SettingEntry, Settings } from "@/utils/settings";

const styles = checkboxSettingStyles();
const checkIconClassName = styles.checkIcon();
const indicatorClassName = styles.indicator();
const rowClassName = styles.row();

function useCheckboxSetting(name: Settings) {
	const [isEnabled, setIsEnabled] = useState(false);

	useEffect(() => {
		async function loadValue() {
			const value = await getValue(name);
			if (typeof value === "boolean") {
				setIsEnabled(value);
			}
		}

		void loadValue();
	}, [name]);

	const handleChange = (nextValue: boolean) => {
		setIsEnabled(nextValue);
		setValue(name, nextValue);
	};

	return { handleChange, isEnabled };
}

interface CheckboxIndicatorProps {
	isSelected: boolean;
}

function CheckboxIndicator({ isSelected }: CheckboxIndicatorProps) {
	return (
		<span aria-hidden="true" className={indicatorClassName}>
			{isSelected && <Check className={checkIconClassName} strokeWidth={3} />}
		</span>
	);
}

interface CheckboxLabelProps {
	isSelected: boolean;
	label: string;
}

function CheckboxLabel({ isSelected, label }: CheckboxLabelProps) {
	return (
		<>
			<CheckboxIndicator isSelected={isSelected} />
			<span>{label}</span>
		</>
	);
}

interface CheckboxSettingProps {
	children?: ReactNode;
	setting: Extract<SettingEntry, { type: "boolean" }>;
}

function CheckboxSetting({ children, setting }: CheckboxSettingProps) {
	const { label, name } = setting;

	const { handleChange, isEnabled } = useCheckboxSetting(name);

	return (
		<>
			<Checkbox
				className={rowClassName}
				isSelected={isEnabled}
				onChange={handleChange}
			>
				{({ isSelected }) => (
					<CheckboxLabel isSelected={isSelected} label={label} />
				)}
			</Checkbox>
			{isEnabled && children}
		</>
	);
}

export { CheckboxSetting };
