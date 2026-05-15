import { useCallback, useEffect, useMemo, useState } from "react";

import { lemmySettings as lemmySettingsStyles } from "@/components/common/variants/popup-variants";
import { DropdownSetting } from "@/components/popup/settings/dropdown-setting";
import {
	getValue,
	Settings,
	settingDefs,
	setValueAsync,
} from "@/utils/settings";
import {
	clearPendingLemmyDomain,
	parseLemmyDomain,
	promoteLemmyDomain,
	promotePendingLemmyDomain,
} from "@/utils/tools/lemmy-domain-tools";

import { LemmyDomainForm } from "./lemmy-domain-form";
import { LemmyLogin } from "./lemmy-login";

type LemmySettingsHook = ReturnType<typeof useLemmySettings>;

const styles = lemmySettingsStyles();
const rootClassName = styles.root();
const titleClassName = styles.title();

function useLemmySettings() {
	const [domain, setDomain] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [inputValue, setInputValue] = useState("");
	const [username, setUsername] = useState("");

	useEffect(() => {
		async function loadValues() {
			const [promotedDomain, savedDomain, savedUsername] = await Promise.all([
				promotePendingLemmyDomain(),
				getValue(Settings.LEMMYDOMAIN),
				getValue(Settings.LEMMYUSERNAME),
			]);

			const activeDomain = promotedDomain || savedDomain;

			setDomain(activeDomain);
			setInputValue(activeDomain);
			setUsername(promotedDomain ? "" : savedUsername);
		}

		void loadValues();
	}, []);

	const setters = {
		setDomain,
		setErrorMessage,
		setInputValue,
		setUsername,
	};

	return {
		domain,
		errorMessage,
		inputValue,
		setters,
		username,
	};
}

interface ValidateLemmyDomainParams {
	inputValue: string;
	setters: LemmySettingsHook["setters"];
}

async function validateLemmyDomain({
	inputValue,
	setters,
}: ValidateLemmyDomainParams) {
	const { setErrorMessage } = setters;

	const permission = parseLemmyDomain(inputValue);

	if (!permission) {
		setErrorMessage("Invalid domain.");
		return;
	}

	const pendingDomainUpdates = Promise.all([
		setValueAsync(Settings.LEMMYPENDINGDOMAIN, permission.host),
		setValueAsync(Settings.LEMMYPENDINGORIGIN, permission.origin),
	]);

	const result = await browser.permissions.request({
		origins: [permission.origin],
	});

	await pendingDomainUpdates;

	if (!result) {
		clearPendingLemmyDomain();
		setErrorMessage("Permission required to access Lemmy.");

		return;
	}

	return permission.host;
}

async function updateLemmyDomain({
	domain,
	inputValue,
	setters,
}: LemmySettingsHook) {
	const { setDomain, setErrorMessage, setInputValue, setUsername } = setters;

	setErrorMessage("");

	if (domain === inputValue) {
		return;
	}

	const host = inputValue
		? await validateLemmyDomain({ inputValue, setters })
		: "";

	if (host === undefined) {
		return;
	}

	promoteLemmyDomain(host);

	setDomain(host);
	setInputValue(host);
	setUsername("");
}

function DefaultSortLemmySetting() {
	const defaultSortLemmy = settingDefs[Settings.DEFAULTSORTLEMMY];

	const defaultSortSetting = useMemo(
		() => ({
			...defaultSortLemmy,
			name: Settings.DEFAULTSORTLEMMY,
		}),
		[defaultSortLemmy],
	);

	return (
		<DropdownSetting
			key={defaultSortSetting.name}
			setting={defaultSortSetting}
		/>
	);
}

function LemmySettings() {
	const state = useLemmySettings();

	const handleDomainSubmit = useCallback(() => {
		void updateLemmyDomain(state);
	}, [state]);

	const handleInputChange = useCallback(
		(value: string) => {
			state.setters.setInputValue(value);
		},
		[state],
	);

	const handleUsernameChange = useCallback(
		(value: string) => {
			state.setters.setUsername(value);
		},
		[state],
	);

	return (
		<div className={rootClassName}>
			<span className={titleClassName}>Lemmy</span>
			<LemmyDomainForm
				errorMessage={state.errorMessage}
				onChange={handleInputChange}
				onSubmit={handleDomainSubmit}
				value={state.inputValue}
			/>
			{Boolean(state.domain) && (
				<>
					<LemmyLogin
						onUsernameChange={handleUsernameChange}
						username={state.username}
					/>
					<DefaultSortLemmySetting />
				</>
			)}
		</div>
	);
}

export { LemmySettings };
