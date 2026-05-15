import { tv } from "tailwind-variants/lite";

import { textBase } from "@/components/common/variants/text-variants";

const commentAuthorLink = tv({
	base: "mr-[5px] font-bold",
	defaultVariants: {
		state: "default",
	},
	variants: {
		distinguishedPoster: {
			admin: "bg-[#FF0011]",
			moderator: "bg-[#228822]",
			op: "bg-[#0055DF]",
		},
		state: {
			collapsed: "text-secondary italic",
			default: "text-link no-underline hover:underline",
			distinguished: "rounded-sm p-0.5 text-white no-underline hover:underline",
		},
	},
});

const externalLink = tv({
	defaultVariants: {
		tone: "link",
		treatment: "default",
	},
	extend: textBase,
	variants: {
		treatment: {
			continueThread:
				"m-0 ml-[3px] overflow-hidden border-0 bg-transparent px-[4px] text-left font-[inherit] text-[12px] leading-[inherit] no-underline hover:underline",
			default: "",
			tagline:
				"text-secondary m-0 border-0 bg-transparent p-0 text-left font-[inherit] text-[10px] font-bold no-underline hover:underline",
		},
		underline: {
			hover: "no-underline hover:underline",
			none: "no-underline",
		},
	},
});

export { commentAuthorLink, externalLink };
