import { useCallback, useEffect, useRef } from "react";

interface HtmlContentProps {
	className?: string;
	html: string;
}

function isElement(value: EventTarget | null): value is Element {
	return value instanceof Element;
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

		function handleClick(event: MouseEvent) {
			if (!isElement(event.target)) {
				return;
			}

			const timestampButton = event.target.closest<HTMLButtonElement>(
				"button[data-timestamp-seconds]",
			);

			if (timestampButton && container?.contains(timestampButton)) {
				const seconds = Number(timestampButton.dataset["timestampSeconds"]);

				if (Number.isFinite(seconds)) {
					document.dispatchEvent(
						new CustomEvent("timestampClicked", {
							detail: { time: seconds },
						}),
					);
				}

				return;
			}

			const spoilerButton = event.target.closest<HTMLButtonElement>(
				"button[data-reddit-spoiler-button]",
			);

			if (spoilerButton && container?.contains(spoilerButton)) {
				spoilerButton.replaceWith(...spoilerButton.childNodes);

				event.preventDefault();

				return;
			}
		}

		container.addEventListener("click", handleClick);

		return () => {
			container.removeEventListener("click", handleClick);
		};
	}, []);

	return <div ref={setContainerRef} className={className} />;
}

export { HtmlContent };
