import { useCallback } from "react";
import { Button } from "react-aria-components";

import { voteControls } from "@/components/common/variants/thread-variants";
import { useCanVote, useThreadStore } from "@/components/content/thread-store";
import { Kind } from "@/utils/constants";
import { sendMessage } from "@/utils/messaging";
import { getScoreString } from "@/utils/tools/string-tools";
import type { Post, UserVote } from "@/utils/types/elements";
import type { VoteRequest } from "@/utils/types/network-requests";

const voteStyles = voteControls();
const scoreClassName = voteStyles.score();

function getVotePosition(voteButtonProps: VoteButtonProps) {
	const { direction, element } = voteButtonProps;

	if (direction === 1) {
		return element.userVote === direction ? "upActive" : "upInactive";
	}

	return element.userVote === direction ? "downActive" : "downInactive";
}

function submitVote(voteButtonProps: VoteButtonProps) {
	const { direction, element, onVote } = voteButtonProps;

	const nextElement = {
		...element,
		userVote: direction === element.userVote ? 0 : direction,
	} satisfies Post;

	const request: VoteRequest = {
		id: nextElement.fullId,
		kind: nextElement.kind,
		vote: nextElement.userVote,
		website: nextElement.website,
	};

	void sendMessage("vote", request);

	onVote(nextElement);
}

interface VoteButtonProps extends VotesProps {
	direction: Exclude<UserVote, 0>;
	disabled: boolean;
	onVote: (element: Post) => void;
}

function VoteButton(props: VoteButtonProps) {
	const { direction, disabled } = props;

	const handlePress = useCallback(() => {
		submitVote(props);
	}, [props]);

	const buttonClassName = voteStyles.button({
		position: getVotePosition(props),
	});

	return (
		<Button
			aria-label={i18n.t(`vote`, direction)}
			className={buttonClassName}
			isDisabled={disabled}
			onPress={handlePress}
		/>
	);
}

interface VotesProps {
	element: Post;
}

function Votes({ element }: VotesProps) {
	const disabled = !useCanVote();
	const handleVote = useThreadStore((state) => state.handlePostUpdate);

	const scoreString = getScoreString(element);

	return (
		<>
			<VoteButton
				direction={1}
				disabled={disabled}
				element={element}
				onVote={handleVote}
			/>

			{element.kind === Kind.THREAD && (
				<span className={scoreClassName}>{scoreString}</span>
			)}

			<VoteButton
				direction={-1}
				disabled={disabled}
				element={element}
				onVote={handleVote}
			/>
		</>
	);
}

export { Votes };
