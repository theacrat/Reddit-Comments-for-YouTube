import { CustomSelect } from "@/components/common/custom-select";
import { noticeText } from "@/components/common/variants/text-variants";
import type { ExternalCommentsState } from "@/components/content/external-comments-state";

const noticeClassName = noticeText();

function useThreadPicker({ externalCommentsState }: ThreadPickerProps) {
	const { selectedThreadId, threads } = externalCommentsState;

	const threadOptions = useMemo(
		() =>
			threads?.map((thread) => ({
				id: thread.fullId,
				title: thread.title,
			})) ?? [],
		[threads],
	);

	const selectedThread = useMemo(
		() => threadOptions.find((option) => option.id === selectedThreadId),
		[threadOptions, selectedThreadId],
	);

	return { selectedThread, threadOptions };
}

interface ThreadPickerProps {
	externalCommentsState: ExternalCommentsState;
}

function ThreadPicker(props: ThreadPickerProps) {
	const { externalCommentsState } = props;
	const { handleThreadSelect, isLoading, threads } = externalCommentsState;
	const { selectedThread, threadOptions } = useThreadPicker(props);

	if (selectedThread) {
		return (
			<CustomSelect
				isFullWidth
				onSelect={handleThreadSelect}
				options={threadOptions}
				selectedOption={selectedThread}
			/>
		);
	}

	if (!isLoading && threads) {
		return <span className={noticeClassName}>{i18n.t("noThreads")}</span>;
	}

	return;
}

export { ThreadPicker };
