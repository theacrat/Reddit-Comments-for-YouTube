import { tv } from "tailwind-variants/lite";

const controlBase = tv({
	base: "m-0 cursor-pointer text-left font-[inherit] leading-[inherit] no-underline disabled:cursor-default",
});

const iconBase = tv({
	base: "text-arrow text-primary size-[2.5em] shrink-0",
});

const layoutBase = tv({
	base: "flex",
	defaultVariants: {
		direction: "row",
	},
	variants: {
		direction: {
			column: "flex-col",
			row: "",
			rowReverse: "flex-row-reverse",
		},
		items: {
			center: "items-center",
			end: "items-end",
			start: "items-start",
		},
		justify: {
			between: "justify-between",
			center: "justify-center",
			end: "justify-end",
			start: "justify-start",
		},
		textAlign: {
			center: "text-center",
			left: "text-left",
		},
		width: {
			full: "w-full",
		},
	},
});

const transparentControlBase = tv({
	base: "border-0 bg-transparent p-0",
	extend: controlBase,
});

export { controlBase, iconBase, layoutBase, transparentControlBase };
