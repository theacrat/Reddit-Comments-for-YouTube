import { tv } from "tailwind-variants/lite";

import { layoutBase } from "@/components/common/variants/base-variants";
import { interactableButton } from "@/components/common/variants/button-variants";

const textBase = tv({
	variants: {
		align: {
			center: "text-center",
			left: "text-left",
		},
		display: {
			block: "block",
			inlineBlock: "inline-block",
		},
		font: {
			header: "font-header",
			notice: "font-notice",
		},
		overflow: {
			ellipsis: "overflow-hidden text-ellipsis",
			hidden: "overflow-hidden",
		},
		size: {
			"11px": "text-[11px]",
			"12.5px": "text-[12.5px]",
			"12px": "text-[12px]",
			"13px": "text-[13px]",
			"14px": "text-[14px]",
			"17px": "text-[17px]",
			base: "text-base",
			inherit: "",
			lg: "text-lg",
			sm: "text-sm",
			standard: "text-standard",
			xs: "text-xs",
		},
		tone: {
			danger: "text-[#CC0000]",
			header: "text-header",
			link: "text-link",
			primary: "text-primary",
			secondary: "text-secondary",
		},
		weight: {
			bold: "font-bold",
		},
		width: {
			full: "w-full",
		},
	},
});

const commentTextArea = tv({
	base: "rounded-large bg-interactable block h-[100px] w-[500px] [border-width:var(--interactable-border-width)] border-solid border-(--interactable-border)",
	extend: textBase,
});

const dangerText = tv({
	defaultVariants: {
		size: "inherit",
		tone: "danger",
	},
	extend: textBase,
});

const growEllipsisText = tv({
	base: "grow",
	defaultVariants: {
		overflow: "ellipsis",
		size: "sm",
	},
	extend: textBase,
});

const growInlineText = tv({
	base: "inline-block grow",
});

const noticeText = tv({
	defaultVariants: {
		align: "center",
		display: "inlineBlock",
		font: "notice",
		size: "standard",
		width: "full",
	},
	extend: textBase,
});

const settingLabel = tv({
	defaultVariants: {
		size: "sm",
	},
	extend: textBase,
});

const textBoxContainer = tv({
	base: "gap-[5px]",
	extend: layoutBase,
});

const textBoxFooter = tv({
	base: "mb-[5px] gap-[5px]",
	extend: layoutBase,
});

const textBox = tv({
	slots: {
		container: textBoxContainer({
			direction: "column",
		}),
		error: dangerText(),
		footer: textBoxFooter({
			items: "center",
		}),
		footerButton: interactableButton({ padding: "compact" }),
		status: textBase({ tone: "secondary" }),
		textArea: commentTextArea({
			size: "14px",
			tone: "primary",
		}),
	},
});

export {
	dangerText,
	growEllipsisText,
	growInlineText,
	noticeText,
	settingLabel,
	textBase,
	textBox,
};
