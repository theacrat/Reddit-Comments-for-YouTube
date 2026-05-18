import { useEffect, useLayoutEffect, useRef } from "react";

import type { SelectOption } from "@/utils/types/elements";

interface RootScrollStyles {
	overflow: string;
	paddingRight: string;
	scrollbarGutter: string;
}

function createMeasureNode(buttonStyles: CSSStyleDeclaration) {
	const measure = document.createElement("span");

	measure.style.position = "absolute";
	measure.style.visibility = "hidden";
	measure.style.whiteSpace = "pre";
	measure.style.font = buttonStyles.font;
	measure.style.letterSpacing = buttonStyles.letterSpacing;
	measure.style.textTransform = buttonStyles.textTransform;
	measure.style.fontKerning = buttonStyles.fontKerning;
	measure.style.fontFeatureSettings = buttonStyles.fontFeatureSettings;
	measure.style.fontVariationSettings = buttonStyles.fontVariationSettings;

	return measure;
}

interface MeasureOptionTextWidthParams {
	buttonStyles: CSSStyleDeclaration;
	options: UseButtonWidthParams["options"];
}

function measureOptionTextWidth({
	buttonStyles,
	options,
}: MeasureOptionTextWidthParams) {
	const measure = createMeasureNode(buttonStyles);

	document.body.append(measure);

	let textWidth = 0;

	for (const option of options) {
		measure.textContent = option.title;
		textWidth = Math.max(textWidth, measure.getBoundingClientRect().width);
	}

	measure.remove();

	return textWidth;
}

interface GetMeasuredButtonWidthParams {
	button: HTMLButtonElement;
	options: UseButtonWidthParams["options"];
}

function getMeasuredButtonWidth({
	button,
	options,
}: GetMeasuredButtonWidthParams) {
	const arrow = button.querySelector<HTMLElement>("[data-select-arrow]");
	const arrowWidth = arrow?.getBoundingClientRect().width ?? 0;

	const buttonStyles = getComputedStyle(button);
	const borderWidth =
		Number.parseFloat(buttonStyles.borderLeftWidth) +
		Number.parseFloat(buttonStyles.borderRightWidth);
	const gap = Number.parseFloat(
		buttonStyles.columnGap || buttonStyles.gap || "0",
	);
	const horizontalPadding =
		Number.parseFloat(buttonStyles.paddingLeft) +
		Number.parseFloat(buttonStyles.paddingRight);

	const textWidth = measureOptionTextWidth({ buttonStyles, options });

	return Math.ceil(
		arrowWidth + borderWidth + gap + horizontalPadding + textWidth,
	);
}

function getRootScrollStyles(): RootScrollStyles {
	const { style } = document.documentElement;

	return {
		overflow: style.overflow,
		paddingRight: style.paddingRight,
		scrollbarGutter: style.scrollbarGutter,
	};
}

function isInShadowRoot(element: Element) {
	return element.getRootNode() instanceof ShadowRoot;
}

function restoreRootScrollStyles(styles: RootScrollStyles) {
	const { style } = document.documentElement;

	style.overflow = styles.overflow;
	style.paddingRight = styles.paddingRight;
	style.scrollbarGutter = styles.scrollbarGutter;
}

type UseInitialButtonWidthParams = UseButtonWidthParams;

function useInitialButtonWidth({
	buttonRef,
	buttonWidth,
	isFullWidth,
	options,
	setButtonWidth,
}: UseInitialButtonWidthParams) {
	useLayoutEffect(() => {
		if (!buttonRef.current || buttonWidth !== 0 || isFullWidth) {
			return;
		}

		setButtonWidth(
			getMeasuredButtonWidth({ button: buttonRef.current, options }),
		);
	}, [buttonRef, buttonWidth, isFullWidth, options, setButtonWidth]);
}

type UseObservedButtonWidthParams = UseButtonWidthParams;

function useObservedButtonWidth({
	buttonRef,
	isFullWidth,
	observerRef,
	options,
	setButtonWidth,
}: UseObservedButtonWidthParams) {
	useEffect(() => {
		observerRef.current?.disconnect();

		let observer: ResizeObserver | undefined;
		const node = buttonRef.current;

		if (isFullWidth || !node) {
			observerRef.current = undefined;
		} else {
			const updateWidth = () => {
				setButtonWidth(getMeasuredButtonWidth({ button: node, options }));
			};

			observer = new ResizeObserver(updateWidth);
			observer.observe(node);
			observerRef.current = observer;

			updateWidth();
		}

		return () => {
			observer?.disconnect();

			if (observerRef.current === observer) {
				observerRef.current = undefined;
			}
		};
	}, [buttonRef, isFullWidth, observerRef, options, setButtonWidth]);
}

interface UseButtonWidthParams {
	buttonRef: React.RefObject<HTMLButtonElement | undefined>;
	buttonWidth: number;
	isFullWidth?: boolean | undefined;
	observerRef: React.RefObject<ResizeObserver | undefined>;
	options: SelectOption<unknown>[];
	setButtonWidth: (value: number) => void;
}

function useButtonWidth(params: UseButtonWidthParams) {
	useInitialButtonWidth(params);
	useObservedButtonWidth(params);
}

interface UseShadowRootSelectScrollStylesParams {
	buttonRef: React.RefObject<HTMLButtonElement | undefined>;
	isOpen: boolean;
}

function useShadowRootSelectScrollStyles({
	buttonRef,
	isOpen,
}: UseShadowRootSelectScrollStylesParams) {
	const closedStylesRef = useRef<RootScrollStyles | undefined>(undefined);

	useLayoutEffect(() => {
		const button = buttonRef.current;

		if (!button || !isInShadowRoot(button)) {
			return;
		}

		if (!isOpen) {
			closedStylesRef.current = getRootScrollStyles();
			return;
		}

		const styles = closedStylesRef.current;

		if (!styles) {
			return;
		}

		const restore = () => {
			restoreRootScrollStyles(styles);
		};

		restore();

		const frame = requestAnimationFrame(restore);
		const timeout = setTimeout(restore, 0);

		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(timeout);
		};
	}, [buttonRef, isOpen]);
}

export { useButtonWidth, useShadowRootSelectScrollStyles };
