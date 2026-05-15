import { tv } from "tailwind-variants/lite";

import {
	controlBase,
	transparentControlBase,
} from "@/components/common/variants/base-variants";

const commentCollapseButton = tv({
	base: "text-[length:inherit] leading-[inherit]",
	extend: transparentControlBase,
	variants: {
		collapsed: {
			false: "text-link",
			true: "text-secondary",
		},
	},
});

const interactableButton = tv({
	base: "rounded-small bg-interactable text-primary [border-width:var(--interactable-border-width)] border-solid border-(--interactable-border)",
	defaultVariants: {
		padding: "standard",
	},
	extend: controlBase,
	variants: {
		padding: {
			compact: "p-[3px]",
			standard: "p-[5px]",
		},
	},
});

const styledButton = tv({
	base: "cursor-pointer rounded-lg border border-transparent bg-[#1A1A1A] font-medium transition-colors duration-25 hover:border-[#646CFF]",
	defaultVariants: {
		size: "default",
	},
	variants: {
		size: {
			default: "px-4 py-2",
		},
		treatment: {
			autoWidth: "w-auto",
			shrink: "shrink-0",
		},
	},
});

const taglineControl = tv({
	base: "text-secondary text-[10px] leading-[16px] font-bold hover:underline",
	extend: transparentControlBase,
	variants: {
		interactive: {
			true: "cursor-pointer disabled:cursor-default",
		},
	},
});

const transparentButton = tv({
	defaultVariants: {
		tone: "link",
		underline: "hover",
	},
	extend: transparentControlBase,
	variants: {
		textSize: {
			inherit: "text-[length:inherit]",
			standard: "text-standard",
		},
		tone: {
			link: "text-link",
			secondary: "text-secondary",
		},
		underline: {
			hover: "hover:underline",
			none: "",
		},
	},
});

const voteButton = tv({
	base: "mx-auto mt-[2px] block h-[14px] w-[15px] bg-(image:--arrows) bg-no-repeat text-inherit disabled:invisible",
	extend: transparentControlBase,
	variants: {
		position: {
			downActive: "bg-bottom-left",
			downInactive: "bg-bottom-right",
			upActive: "bg-top-left",
			upInactive: "bg-top-right",
		},
	},
});

export {
	commentCollapseButton,
	interactableButton,
	styledButton,
	taglineControl,
	transparentButton,
	voteButton,
};
