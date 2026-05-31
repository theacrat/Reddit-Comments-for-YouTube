import { tv } from "tailwind-variants/lite";

import {
	iconBase,
	layoutBase,
} from "@/components/common/variants/base-variants";
import {
	styledButton,
	transparentButton,
} from "@/components/common/variants/button-variants";
import { externalLink } from "@/components/common/variants/link-variants";
import {
	dangerText,
	textBase,
} from "@/components/common/variants/text-variants";

const checkboxSettingRow = tv({
	base: "cursor-pointer gap-1",
	extend: layoutBase,
});

const lemmyLoggedInRow = tv({
	base: "my-2",
	defaultVariants: {
		items: "center",
		width: "full",
	},
	extend: layoutBase,
});

const lemmyLoginForm = tv({
	base: "my-2 gap-2",
	defaultVariants: {
		direction: "column",
		width: "full",
	},
	extend: layoutBase,
});

const listSettingContainer = tv({
	base: "gap-1 py-[20px]",
	defaultVariants: {
		direction: "column",
		items: "start",
		justify: "start",
		width: "full",
	},
	extend: layoutBase,
});

const listSettingTag = tv({
	base: "rounded-small gap-1 data-focus-visible:outline",
	extend: layoutBase,
});

const listSettingTagList = tv({
	base: "m-0 list-none gap-1 p-0",
	extend: layoutBase,
});

const listSettingText = tv({
	base: "grow",
	extend: textBase,
});

const popupFormRow = tv({
	base: "gap-2",
	defaultVariants: {
		width: "full",
	},
	extend: layoutBase,
});

const popupRoot = tv({
	base: "relative box-border max-h-[600px] gap-4 overflow-y-auto p-8",
	defaultVariants: {
		direction: "column",
		items: "end",
	},
	extend: layoutBase,
});

const popupSettingsPanel = tv({
	base: "w-80 leading-normal",
});

const popupTextColumn = tv({
	defaultVariants: {
		direction: "column",
		textAlign: "center",
	},
	extend: layoutBase,
});

const popupThreadPrompt = tv({
	base: "gap-2",
	extend: layoutBase,
});

const popupTitle = tv({
	base: "mb-3",
	defaultVariants: {
		size: "lg",
		weight: "bold",
	},
	extend: textBase,
});

const settingContainer = tv({
	base: "gap-1",
	defaultVariants: {
		direction: "column",
		items: "start",
		justify: "start",
		textAlign: "left",
	},
	extend: layoutBase,
});

const settingSelect = tv({
	base: "gap-1 py-[10px]",
	defaultVariants: {
		items: "center",
		justify: "start",
	},
	extend: layoutBase,
});

const checkboxSetting = tv({
	slots: {
		checkIcon: "absolute inset-0 h-full w-full",
		indicator:
			"bg-interactable relative mt-[0.25em] inline-block h-[13px] w-[13px] shrink-0 self-start rounded-sm [border-width:var(--interactable-border-width)] border-solid border-(--interactable-border)",
		row: checkboxSettingRow({
			items: "start",
			justify: "start",
		}),
	},
});

const dropdownSetting = tv({
	slots: {
		select: settingSelect(),
	},
});

const lemmyDomainForm = tv({
	slots: {
		button: styledButton(),
		error: dangerText(),
		formRow: popupFormRow(),
	},
});

const lemmyLogin = tv({
	slots: {
		button: styledButton(),
		error: dangerText(),
		field: "w-full",
		formRow: popupFormRow(),
		input: "box-border w-full",
		label: textBase({ size: "sm" }),
		loggedInRow: lemmyLoggedInRow(),
		loginForm: lemmyLoginForm(),
		username: "inline-block grow",
	},
});

const lemmySettings = tv({
	slots: {
		root: listSettingContainer(),
		title: textBase({ size: "base" }),
	},
});

const listSetting = tv({
	slots: {
		addButton: styledButton(),
		error: dangerText(),
		formRow: popupFormRow(),
		label: textBase({ size: "sm" }),
		removeButton: styledButton({ treatment: "shrink" }),
		removeIcon: iconBase(),
		root: listSettingContainer(),
		tag: listSettingTag({
			items: "center",
			width: "full",
		}),
		tagList: listSettingTagList({
			direction: "column",
			width: "full",
		}),
		text: listSettingText({
			overflow: "ellipsis",
			size: "sm",
		}),
	},
});

const popupSettings = tv({
	slots: {
		link: externalLink(),
		panel: popupSettingsPanel(),
		settingContainer: settingContainer(),
		textColumn: popupTextColumn(),
		title: popupTitle(),
	},
});

const popupShell = tv({
	slots: {
		root: popupRoot(),
		toggle: transparentButton({ textSize: "standard" }),
	},
});

const popupThreads = tv({
	slots: {
		button: styledButton({ treatment: "autoWidth" }),
		centeredText: textBase({
			align: "center",
			display: "block",
			size: "standard",
		}),
		panel: "w-[36rem]",
		prompt: popupThreadPrompt({
			direction: "column",
			items: "center",
			justify: "center",
			textAlign: "center",
		}),
	},
});

export {
	checkboxSetting,
	dropdownSetting,
	lemmyDomainForm,
	lemmyLogin,
	lemmySettings,
	listSetting,
	popupSettings,
	popupShell,
	popupThreads,
};
