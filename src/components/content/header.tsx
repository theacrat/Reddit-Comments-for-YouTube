import { Button } from "react-aria-components";

import { CustomSelect } from "@/components/common/custom-select";
import { threadHeader as threadHeaderStyles } from "@/components/common/variants/thread-variants";
import type {
	ExternalComments,
	useExternalComments,
} from "@/components/content/external-comments-hooks";

const styles = threadHeaderStyles();
const barClassName = styles.bar();
const controlsClassName = styles.controls();
const countClassName = styles.count();
const textClassName = styles.text();
const toggleButtonClassName = styles.toggle();

interface HeaderToggleProps {
	externalCommentsState: ExternalComments["externalCommentsState"];
}

function HeaderToggle({ externalCommentsState }: HeaderToggleProps) {
	const { isCollapsed, handleCollapseToggle } = externalCommentsState;

	const symbol = isCollapsed ? "＋" : "－";

	return (
		<Button className={toggleButtonClassName} onPress={handleCollapseToggle}>
			[{symbol}]
		</Button>
	);
}

interface SortControlsProps {
	externalComments: ExternalComments;
}

function SortControls({ externalComments }: SortControlsProps) {
	const { externalCommentsState, sortOptions } = externalComments;
	const { handleSortSelect, selectedSort } = externalCommentsState;

	return (
		<CustomSelect
			label={i18n.t("threadSort")}
			onSelect={handleSortSelect}
			options={sortOptions}
			selectedOption={selectedSort}
		/>
	);
}

interface HeaderProps {
	externalComments: ReturnType<typeof useExternalComments>;
}

function Header({ externalComments }: HeaderProps) {
	const { isPopup, externalCommentsState } = externalComments;
	const { selectedSort, threadCount } = externalCommentsState;

	return (
		<div className={barClassName}>
			<span className={textClassName}>
				{!isPopup && (
					<HeaderToggle externalCommentsState={externalCommentsState} />
				)}{" "}
				{i18n.t("header")}
			</span>
			<span className={countClassName}>{threadCount}</span>
			<div className={controlsClassName}>
				{selectedSort && <SortControls externalComments={externalComments} />}
			</div>
		</div>
	);
}

export { Header };
