import { useCallback, useState } from "react";
import { Button, Input, TextField } from "react-aria-components";

import { lemmyLogin as lemmyLoginStyles } from "@/components/common/variants/popup-variants";
import { sendMessage } from "@/utils/messaging";
import { Settings, setValue } from "@/utils/settings";

type UseLemmyLogin = ReturnType<typeof useLemmyLogin>;

type UseLemmyLoggedOutHandlers = ReturnType<typeof useLemmyLoggedOutHandlers>;

const styles = lemmyLoginStyles();
const buttonClassName = styles.button();
const errorClassName = styles.error();
const fieldClassName = styles.field();
const formRowClassName = styles.formRow();
const inputClassName = styles.input();
const labelClassName = styles.label();
const loggedInRowClassName = styles.loggedInRow();
const loginFormClassName = styles.loginForm();
const usernameClassName = styles.username();

interface LemmyLoginFieldProps {
	onChange: (value: string) => void;
	placeholder: string;
	type: "password" | "text";
	value: string;
}

function LemmyLoginField({
	onChange,
	placeholder,
	type,
	value,
}: LemmyLoginFieldProps) {
	return (
		<TextField
			className={fieldClassName}
			onChange={onChange}
			type={type}
			value={value}
		>
			<Input className={inputClassName} placeholder={placeholder} />
		</TextField>
	);
}

interface LemmyLoginFormProps {
	lemmyLoggedOutHandlers: UseLemmyLoggedOutHandlers;
	lemmyLogin: UseLemmyLogin;
}

function LemmyLoginForm({
	lemmyLoggedOutHandlers,
	lemmyLogin,
}: LemmyLoginFormProps) {
	const {
		handleLogin,
		handlePasswordChange,
		handleTotpChange,
		handleUsernameChange,
	} = lemmyLoggedOutHandlers;
	const { isLoggingIn, passwordValue, totpValue, usernameValue } = lemmyLogin;

	const loginLabel = isLoggingIn ? "..." : i18n.t("login");

	return (
		<div className={loginFormClassName}>
			<span className={labelClassName}>{i18n.t("loginToLemmy")}</span>
			<LemmyLoginField
				onChange={handleUsernameChange}
				placeholder={i18n.t("username")}
				type="text"
				value={usernameValue}
			/>
			<LemmyLoginField
				onChange={handlePasswordChange}
				placeholder={i18n.t("password")}
				type="password"
				value={passwordValue}
			/>
			<div className={formRowClassName}>
				<LemmyLoginField
					onChange={handleTotpChange}
					placeholder={i18n.t("twoFactorAuth")}
					type="text"
					value={totpValue}
				/>
				<Button className={buttonClassName} onPress={handleLogin}>
					{loginLabel}
				</Button>
			</div>
		</div>
	);
}

type SubmitLemmyLoginParams = LemmyLoggedOutProps;

async function submitLemmyLogin({
	lemmyLogin,
	onUsernameChange,
}: SubmitLemmyLoginParams) {
	const { isLoggingIn, passwordValue, setters, totpValue, usernameValue } =
		lemmyLogin;
	const { setErrorMessage, setIsLoggingIn } = setters;

	if (isLoggingIn) {
		return;
	}

	setIsLoggingIn(true);
	setErrorMessage("");

	const response = await sendMessage("lemmyLogin", {
		password: passwordValue,
		totp_2fa_token: totpValue,
		username_or_email: usernameValue,
	});

	if (!response.success) {
		setErrorMessage(response.errorMessage);
		setIsLoggingIn(false);
		return;
	}

	setValue(Settings.LEMMYTOKEN, response.value);
	setValue(Settings.LEMMYUSERNAME, usernameValue);

	onUsernameChange(usernameValue);

	setIsLoggingIn(false);
}

type UseLemmyLoggedOutHandlersParams = LemmyLoggedOutProps;

function useLemmyLoggedOutHandlers(params: UseLemmyLoggedOutHandlersParams) {
	const { setPasswordValue, setTotpValue, setUsernameValue } =
		params.lemmyLogin.setters;

	const handleLogin = () => {
		void submitLemmyLogin(params);
	};

	const handlePasswordChange = (value: string) => {
		setPasswordValue(value);
	};

	const handleTotpChange = (value: string) => {
		setTotpValue(value);
	};

	const handleUsernameChange = (value: string) => {
		setUsernameValue(value);
	};

	return {
		handleLogin,
		handlePasswordChange,
		handleTotpChange,
		handleUsernameChange,
	};
}

interface LemmyLoggedOutProps {
	lemmyLogin: UseLemmyLogin;
	onUsernameChange: LemmyLoginProps["onUsernameChange"];
}

function LemmyLoggedOut(params: LemmyLoggedOutProps) {
	const { lemmyLogin } = params;

	const lemmyLoggedOutHandlers = useLemmyLoggedOutHandlers(params);

	return (
		<>
			<LemmyLoginForm
				lemmyLoggedOutHandlers={lemmyLoggedOutHandlers}
				lemmyLogin={lemmyLogin}
			/>
			<span className={errorClassName}>{lemmyLogin.errorMessage}</span>
		</>
	);
}

function useLemmyLogin(onUsernameChange: LemmyLoginProps["onUsernameChange"]) {
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [passwordValue, setPasswordValue] = useState("");
	const [totpValue, setTotpValue] = useState("");
	const [usernameValue, setUsernameValue] = useState("");

	const handleLogout = useCallback(() => {
		setValue(Settings.LEMMYTOKEN, undefined);
		setValue(Settings.LEMMYUSERNAME, undefined);

		onUsernameChange("");
	}, [onUsernameChange]);

	const setters = {
		setErrorMessage,
		setIsLoggingIn,
		setPasswordValue,
		setTotpValue,
		setUsernameValue,
	};

	return {
		errorMessage,
		handleLogout,
		isLoggingIn,
		passwordValue,
		setters,
		totpValue,
		usernameValue,
	};
}

interface LemmyLoginProps {
	onUsernameChange: (username: string) => void;
	username: string;
}

function LemmyLogin({ onUsernameChange, username }: LemmyLoginProps) {
	const lemmyLogin = useLemmyLogin(onUsernameChange);

	if (username) {
		return (
			<div className={loggedInRowClassName}>
				<span className={usernameClassName}>
					{i18n.t("loggedIn", [username])}
				</span>
				<Button className={buttonClassName} onPress={lemmyLogin.handleLogout}>
					{i18n.t("logout")}
				</Button>
			</div>
		);
	}

	return (
		<LemmyLoggedOut
			lemmyLogin={lemmyLogin}
			onUsernameChange={onUsernameChange}
		/>
	);
}

export { LemmyLogin };
