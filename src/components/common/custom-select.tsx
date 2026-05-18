import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import type { PlacementAxis } from "react-aria";
import {
	Button,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	Select,
	SelectValue,
} from "react-aria-components";
import type { Key, PopoverRenderProps } from "react-aria-components";

import { customSelect as customSelectStyles } from "@/components/common/variants/select-variants";
import type { SelectOption } from "@/utils/types/elements";

import {
	useButtonWidth,
	useShadowRootSelectScrollStyles,
} from "./custom-select-hooks";

type PopoverClassNameParams = Exclude<
	Exclude<ComponentProps<typeof Popover>["className"], string>,
	undefined
>;

type PopoverPlacementAxis = Extract<PlacementAxis, "bottom" | "top">;

function getPlacementAxis(
	placement: PlacementAxis | null | undefined,
): PopoverPlacementAxis {
	return placement === "top" ? "top" : "bottom";
}

interface SelectTriggerButtonProps<T extends Key> {
	selectContentProps: SelectContentProps<T>;
}

function SelectTriggerButton<T extends Key>({
	selectContentProps,
}: SelectTriggerButtonProps<T>) {
	const { customSelect, customSelectProps, isOpen } = selectContentProps;
	const { measuredStyle, placement, setButtonRef } = customSelect;
	const { isFullWidth, selectedOption } = customSelectProps;

	const styles = customSelectStyles({
		fullWidth: isFullWidth,
		placement,
		triggerPlacement: isOpen ? placement : undefined,
	});
	const buttonClassName = styles.button();
	const valueClassName = styles.value();
	const iconClassName = styles.icon();

	return (
		<Button
			className={buttonClassName}
			ref={setButtonRef}
			style={measuredStyle}
		>
			<SelectValue className={valueClassName}>
				{(value) => value.selectedText || selectedOption?.title}
			</SelectValue>
			<ChevronDown
				aria-hidden="true"
				className={iconClassName}
				data-select-arrow
			/>
		</Button>
	);
}

interface PlacementReporterParams {
	onPlacementChange: (placement: PopoverPlacementAxis) => void;
	newPlacement: PopoverPlacementAxis;
}

function PlacementReporter({
	onPlacementChange,
	newPlacement,
}: PlacementReporterParams): ReactNode {
	useEffect(() => {
		onPlacementChange(newPlacement);
	}, [onPlacementChange, newPlacement]);

	return;
}

interface SelectOptionsListProps<T extends Key> {
	itemClassName: string;
	options: CustomSelectProps<T>["options"];
}

function SelectOptionsList<T extends Key>({
	itemClassName,
	options,
}: SelectOptionsListProps<T>) {
	return (
		<ListBox items={options}>
			{(option) => (
				<ListBoxItem
					className={itemClassName}
					id={option.id}
					textValue={option.title}
				>
					{option.title}
				</ListBoxItem>
			)}
		</ListBox>
	);
}

interface OptionListProps<T extends Key> {
	selectContentProps: SelectContentProps<T>;
}

function OptionList<T extends Key>({ selectContentProps }: OptionListProps<T>) {
	const { customSelect, customSelectProps } = selectContentProps;
	const { measuredStyle, setPlacement } = customSelect;
	const { options } = customSelectProps;

	const styles = customSelectStyles({
		measured: Boolean(measuredStyle.width),
	});
	const itemClassName = styles.item();

	const popoverClassName = useCallback<PopoverClassNameParams>(
		({ placement }) => {
			const normalisedPlacement = getPlacementAxis(placement);

			setPlacement(normalisedPlacement);

			return styles.popover({
				placement: normalisedPlacement,
			});
		},
		[setPlacement, styles],
	);

	const children = ({ placement }: PopoverRenderProps) => (
		<>
			<PlacementReporter
				onPlacementChange={setPlacement}
				newPlacement={getPlacementAxis(placement)}
			/>
			<SelectOptionsList itemClassName={itemClassName} options={options} />
		</>
	);

	return (
		<Popover
			className={popoverClassName}
			containerPadding={0}
			offset={0}
			style={measuredStyle}
		>
			{children}
		</Popover>
	);
}

interface SelectContentProps<T extends Key> {
	customSelect: ReturnType<typeof useCustomSelect<T>>;
	customSelectProps: CustomSelectProps<T>;
	isOpen: boolean;
	labelClassName: string;
}

function SelectContent<T extends Key>(props: SelectContentProps<T>) {
	const { customSelect, customSelectProps, isOpen, labelClassName } = props;
	const { buttonRef } = customSelect;
	const { label } = customSelectProps;

	useShadowRootSelectScrollStyles({ buttonRef, isOpen });

	return (
		<>
			{label && <Label className={labelClassName}>{label}</Label>}

			<SelectTriggerButton selectContentProps={props} />
			<OptionList selectContentProps={props} />
		</>
	);
}

type UseCustomSelectParams<T extends Key> = CustomSelectProps<T>;

function useCustomSelect<T extends Key>({
	isFullWidth,
	onSelect,
	options,
}: UseCustomSelectParams<T>) {
	const [buttonWidth, setButtonWidth] = useState(0);
	const [placement, setPlacement] = useState<PopoverPlacementAxis>(
		getPlacementAxis(undefined),
	);

	const buttonRef = useRef<HTMLButtonElement | undefined>(undefined);
	const observerRef = useRef<ResizeObserver | undefined>(undefined);

	const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
		buttonRef.current = node ?? undefined;
	}, []);

	useButtonWidth({
		buttonRef,
		buttonWidth,
		isFullWidth,
		observerRef,
		options,
		setButtonWidth,
	});

	const handleSelectChange = (key: Key | null) => {
		if (key === null) {
			return;
		}

		const found = options.find((option) => option.id === key);
		if (found) {
			onSelect(found);
		}
	};

	const isMeasured = buttonWidth > 0 && !isFullWidth;

	const measuredStyle: React.CSSProperties = useMemo(
		() => (isMeasured ? { width: `${buttonWidth}px` } : {}),
		[buttonWidth, isMeasured],
	);

	return {
		buttonRef,
		handleSelectChange,
		measuredStyle,
		placement,
		setButtonRef,
		setPlacement,
	};
}

interface CustomSelectProps<T extends Key> {
	className?: string | undefined;
	isFullWidth?: boolean | undefined;
	label?: ReactNode;
	onSelect: (option: SelectOption<T>) => void;
	options: SelectOption<T>[];
	selectedOption?: SelectOption<T> | undefined;
}

function CustomSelect<T extends Key>(props: CustomSelectProps<T>) {
	const { className, isFullWidth, selectedOption } = props;

	const customSelect = useCustomSelect(props);
	const { handleSelectChange } = customSelect;

	const styles = customSelectStyles({ fullWidth: isFullWidth });
	const containerClassName = [styles.container(), className]
		.filter(Boolean)
		.join(" ");

	const children = (select: { isOpen: boolean }) => (
		<SelectContent
			customSelect={customSelect}
			customSelectProps={props}
			isOpen={select.isOpen}
			labelClassName={styles.label()}
		/>
	);

	if (selectedOption === undefined) {
		return (
			<Select className={containerClassName} onChange={handleSelectChange}>
				{children}
			</Select>
		);
	}

	return (
		<Select
			className={containerClassName}
			onChange={handleSelectChange}
			value={selectedOption.id}
		>
			{children}
		</Select>
	);
}

export { CustomSelect };
