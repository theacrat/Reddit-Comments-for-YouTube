import { tv } from "tailwind-variants/lite";

import {
	iconBase,
	layoutBase,
} from "@/components/common/variants/base-variants";
import { interactableButton } from "@/components/common/variants/button-variants";
import { textBase } from "@/components/common/variants/text-variants";

const selectContainer = tv({
	base: "relative inline-flex items-center gap-[5px]",
	extend: textBase,
});

const selectItem = tv({
	base: "bg-option hover:bg-hover focus:bg-hover m-0 shrink-0 cursor-pointer border-0 border-t-0 p-[5px] font-[inherit] text-[length:inherit] leading-[inherit] whitespace-pre last:border-b-0 focus:outline-0",
	extend: textBase,
});

const selectPopover = tv({
	base: "text-standard text-primary bg-select box-content max-h-[40vh] cursor-pointer overflow-auto [border-width:var(--interactable-border-width)] border-solid border-(--interactable-border)",
	extend: layoutBase,
});

const selectTriggerButton = tv({
	base: "text-standard box-border flex items-center justify-between gap-[5px]",
	extend: interactableButton,
});

const selectValue = tv({
	base: "whitespace-pre",
	extend: textBase,
});

const customSelect = tv({
	slots: {
		button: selectTriggerButton(),
		container: selectContainer({
			size: "inherit",
			tone: "primary",
		}),
		icon: iconBase(),
		item: selectItem({
			align: "left",
			overflow: "ellipsis",
			tone: "primary",
		}),
		label: "text-[length:inherit] leading-[inherit]",
		popover: selectPopover({
			direction: "column",
		}),
		value: selectValue({
			overflow: "ellipsis",
		}),
	},
	variants: {
		fullWidth: {
			false: {
				container: "max-w-fit",
			},
			true: {
				button: "w-full",
				container: "w-full",
				value: "grow",
			},
		},
		measured: {
			false: {
				popover: "w-(--trigger-width)",
			},
		},
		placement: {
			bottom: {
				popover: "rounded-b-small border-t-0",
			},
			top: {
				popover: "rounded-t-small border-b-0",
			},
		},
		triggerPlacement: {
			bottom: {
				button: "rounded-b-none",
			},
			top: {
				button: "rounded-t-none",
			},
		},
	},
});

export { customSelect };
