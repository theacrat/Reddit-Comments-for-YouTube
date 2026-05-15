import { tv } from "tailwind-variants/lite";

import {
	controlBase,
	layoutBase,
} from "@/components/common/variants/base-variants";
import {
	commentCollapseButton,
	taglineControl,
} from "@/components/common/variants/button-variants";
import {
	commentAuthorLink,
	externalLink,
} from "@/components/common/variants/link-variants";
import {
	dangerText,
	textBase,
} from "@/components/common/variants/text-variants";

const commentContentActions = tv({
	base: "gap-[8px] leading-[16px]",
	extend: layoutBase,
});

const commentContentHtml = tv({
	base: "reddit-comment",
	extend: textBase,
});

const commentTaglineRoot = tv({
	base: "m-0",
	extend: textBase,
});

const commentTreeBody = tv({
	base: "ml-[3px] grow",
	extend: textBase,
});

const moreChildrenButton = tv({
	base: "text-subtle ml-[3px] inline-block overflow-hidden border-0 bg-transparent px-[4px] text-[10px]",
	extend: controlBase,
});

const moreChildrenLoading = tv({
	base: "cursor-default",
	extend: dangerText,
});

const commentContent = tv({
	slots: {
		actionButton: taglineControl({ interactive: true }),
		actions: commentContentActions({
			items: "center",
		}),
		html: commentContentHtml({
			size: "14px",
			tone: "primary",
		}),
		permalink: externalLink({ treatment: "tagline" }),
	},
});

const commentOwnerButtons = tv({
	slots: {
		action: taglineControl({ interactive: true }),
		confirmation: dangerText(),
	},
});

const commentTaglineBlock = tv({
	defaultVariants: {
		authorState: "default",
	},
	slots: {
		author: commentAuthorLink(),
		collapseButton: commentCollapseButton(),
		controversial: dangerText(),
		deletedAuthor: "mr-[5px]",
		meta: textBase({
			display: "inlineBlock",
			tone: "secondary",
		}),
		root: commentTaglineRoot({
			size: "11px",
			tone: "secondary",
		}),
		score: textBase({ tone: "primary" }),
	},
	variants: {
		authorState: {
			default: {},
			distinguished: {
				author: commentAuthorLink({ state: "distinguished" }),
			},
		},
		collapsed: {
			false: {
				collapseButton: commentCollapseButton({ collapsed: false }),
			},
			true: {
				author: commentAuthorLink({ state: "collapsed" }),
				collapseButton: commentCollapseButton({ collapsed: true }),
				deletedAuthor: "text-secondary italic",
				meta: "italic",
				score: "text-secondary italic",
			},
		},
		distinguishedPoster: {
			admin: {
				author: commentAuthorLink({ distinguishedPoster: "admin" }),
			},
			moderator: {
				author: commentAuthorLink({ distinguishedPoster: "moderator" }),
			},
			op: {
				author: commentAuthorLink({ distinguishedPoster: "op" }),
			},
		},
	},
});

const commentTree = tv({
	slots: {
		body: commentTreeBody({
			overflow: "ellipsis",
		}),
		childrenBlock:
			"border-l-separator my-[10px] ml-[15px] border-0 border-l border-dotted",
		contentWrapper: "",
		replyWrapper: "",
		root: "ml-[10px]",
		voteCell: "float-left mr-[7px]",
	},
	variants: {
		collapsed: {
			true: {
				contentWrapper: "hidden",
				replyWrapper: "hidden",
				voteCell: "ml-[15px] h-px",
			},
		},
		hidden: {
			true: {
				root: "hidden",
			},
		},
	},
});

const moreChildren = tv({
	slots: {
		button: moreChildrenButton(),
		continueThreadLink: externalLink({ treatment: "continueThread" }),
		label: textBase({ weight: "bold" }),
		loadControl: "cursor-pointer hover:underline",
		loading: moreChildrenLoading(),
	},
});

export {
	commentContent,
	commentOwnerButtons,
	commentTaglineBlock,
	commentTree,
	moreChildren,
};
