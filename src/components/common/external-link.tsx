import type { ReactNode } from "react";
import { Link } from "react-aria-components";

interface ExternalLinkProps {
	children: ReactNode;
	className: string;
	href: string;
}

function ExternalLink({ children, className, href }: ExternalLinkProps) {
	return (
		<Link className={className} href={href} rel="noreferrer" target="_blank">
			{children}
		</Link>
	);
}

export { ExternalLink };
