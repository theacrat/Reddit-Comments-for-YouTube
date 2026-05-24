import { useCallback, useEffect, useRef } from "react";

interface HtmlContentProps {
	className?: string;
	html: string;
}

function isElement(value: EventTarget | null): value is Element {
	return value instanceof Element;
}

function isTriggerKey(event: KeyboardEvent) {
	return event.key === "Enter" || event.key === " ";
}

function triggerInlineButton(
	eventTarget: EventTarget | null,
	container: HTMLElement,
): boolean {
	if (!isElement(eventTarget)) {
		return false;
	}

	const spoilerButton = eventTarget.closest<HTMLSpanElement>(
		'span[role="button"][data-reddit-spoiler-button]',
	);

	if (spoilerButton && container.contains(spoilerButton)) {
		spoilerButton.replaceWith(...spoilerButton.childNodes);

		return true;
	}

	const timestampButton = eventTarget.closest<HTMLSpanElement>(
		'span[role="button"][data-timestamp-seconds]',
	);

	if (timestampButton && container.contains(timestampButton)) {
		const seconds = Number(timestampButton.dataset["timestampSeconds"]);

		if (Number.isFinite(seconds)) {
			document.dispatchEvent(
				new CustomEvent("timestampClicked", {
					detail: { time: seconds },
				}),
			);
		}

		return true;
	}

	return false;
}

function HtmlContent({ className, html }: HtmlContentProps) {
	const containerRef = useRef<HTMLDivElement | undefined>(undefined);

	const setContainerRef = useCallback((node: HTMLDivElement | null) => {
		containerRef.current = node ?? undefined;
	}, []);

	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.innerHTML = html;
		}
	}, [html]);

	useEffect(() => {
		const container = containerRef.current;

		if (!container) {
			return;
		}

		const htmlContainer = container;

		function handleClick(event: MouseEvent) {
			triggerInlineButton(event.target, htmlContainer);
		}

		function handleKeydown(event: KeyboardEvent) {
			if (!isTriggerKey(event)) {
				return;
			}

			const triggerResult = triggerInlineButton(event.target, htmlContainer);

			if (triggerResult) {
				event.preventDefault();
			}
		}

		container.addEventListener("click", handleClick);
		container.addEventListener("keydown", handleKeydown);

		return () => {
			container.removeEventListener("click", handleClick);
			container.removeEventListener("keydown", handleKeydown);
		};
	}, []);

	return <div ref={setContainerRef} className={className} />;
}

export { HtmlContent };
