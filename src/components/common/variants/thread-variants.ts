import { tv } from "tailwind-variants/lite";

import { layoutBase } from "@/components/common/variants/base-variants";
import {
	transparentButton,
	voteButton,
} from "@/components/common/variants/button-variants";
import { externalLink } from "@/components/common/variants/link-variants";
import {
	noticeText,
	textBase,
} from "@/components/common/variants/text-variants";

const externalCommentsBody = tv({
	variants: {
		collapsed: {
			true: "h-0 overflow-hidden",
		},
	},
});

const externalCommentsContainer = tv({
	base: "reddit-comments relative w-full leading-tight",
	defaultVariants: {
		tone: "primary",
	},
	extend: textBase,
	variants: {
		popup: {
			false: "my-[20px]",
		},
	},
});

const threadContainerRoot = tv({
	base: "mx-[5px] my-[10px] gap-[10px]",
	extend: layoutBase,
});

const threadHeaderBar = tv({
	base: "text-header mb-[10px]",
	extend: layoutBase,
});

const threadScore = tv({
	defaultVariants: {
		align: "center",
		display: "block",
		size: "13px",
		tone: "secondary",
		weight: "bold",
	},
	extend: textBase,
});

const threadSummaryHtml = tv({
	base: "reddit-comment",
	extend: textBase,
});

const threadSummaryRow = tv({
	base: "box-border gap-[7px]",
	extend: layoutBase,
});

const threadSummaryTagline = tv({
	base: "m-0",
	extend: textBase,
});

const threadSummaryTitle = tv({
	base: "mb-[3px]",
	extend: textBase,
});

const threadContainer = tv({
	slots: {
		notice: noticeText(),
		root: threadContainerRoot({
			direction: "column",
		}),
		sortRow: layoutBase({ items: "center" }),
		summaryWrapper: "",
	},
	variants: {
		hidden: {
			true: {
				summaryWrapper: "hidden",
			},
		},
	},
});

const threadHeader = tv({
	slots: {
		bar: threadHeaderBar({
			items: "center",
			justify: "between",
		}),
		controls: layoutBase({
			items: "center",
			justify: "end",
			width: "full",
		}),
		count: textBase({
			align: "center",
			font: "header",
			tone: "header",
			width: "full",
		}),
		text: textBase({
			font: "header",
			tone: "header",
			width: "full",
		}),
		toggle: transparentButton(),
	},
});

const threadSummary = tv({
	slots: {
		authorLink: externalLink({ underline: "hover" }),
		communityLink: externalLink({ underline: "hover" }),
		content: layoutBase({ direction: "column" }),
		html: threadSummaryHtml({
			size: "14px",
			tone: "primary",
		}),
		row: threadSummaryRow({
			width: "full",
		}),
		separator: textBase({
			tone: "primary",
		}),
		tagline: threadSummaryTagline({
			size: "12.5px",
			tone: "secondary",
		}),
		timestampButton: transparentButton({
			textSize: "inherit",
			underline: "none",
		}),
		title: threadSummaryTitle({
			overflow: "hidden",
			size: "17px",
			tone: "link",
		}),
		titleLink: externalLink({ underline: "none" }),
		voteCell: "w-[6.1ex] shrink-0 font-bold",
	},
});

const voteControls = tv({
	slots: {
		button: voteButton(),
		score: threadScore(),
	},
	variants: {
		position: {
			downActive: {
				button: voteButton({ position: "downActive" }),
			},
			downInactive: {
				button: voteButton({ position: "downInactive" }),
			},
			upActive: {
				button: voteButton({ position: "upActive" }),
			},
			upInactive: {
				button: voteButton({ position: "upInactive" }),
			},
		},
	},
});

export {
	externalCommentsBody,
	externalCommentsContainer,
	threadContainer,
	threadHeader,
	threadScore,
	threadSummary,
	voteControls,
};
