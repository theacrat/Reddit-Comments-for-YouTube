import { Settings, settingDefs } from "./definitions";

type StorageLocation = "local" | "sync";

interface BaseSettingDef {
	children?: string[];
	displayInList: boolean;
	label: string;
	storage?: StorageLocation;
}

interface ArraySettingDef extends BaseSettingDef {
	defaultValue: string[];
	type: "array";
	validator: (value: string) => {
		errorMessage: string;
		value: string;
	};
}

interface BooleanSettingDef extends BaseSettingDef {
	defaultValue: boolean;
	type: "boolean";
}

interface OptionSettingDef extends BaseSettingDef {
	defaultValue: string;
	options: string[];
	type: "option";
}

interface StringSettingDef extends BaseSettingDef {
	defaultValue: string;
	type: "string";
}

type SettingDef =
	| ArraySettingDef
	| BooleanSettingDef
	| OptionSettingDef
	| StringSettingDef;

type DefToValue<D extends SettingDef> = D extends {
	type: "boolean";
}
	? boolean
	: D extends {
				type: "array";
		  }
		? string[]
		: string;

type SettingEntry = SettingDef & {
	name: Settings;
};

type SettingValueMap = {
	[Key in Settings]: DefToValue<(typeof settingDefs)[Key]>;
};

type SettingsOfType<T> = {
	[Key in Settings]: SettingValueMap[Key] extends T ? Key : never;
}[Settings];

function asDef(name: Settings): SettingDef {
	return settingDefs[name] as SettingDef;
}

function storageKey(name: Settings): `local:${Settings}` | `sync:${Settings}` {
	const location = asDef(name).storage ?? "sync";
	return `${location}:${name}`;
}

async function getValue(name: SettingsOfType<boolean>): Promise<boolean>;
async function getValue(name: SettingsOfType<string[]>): Promise<string[]>;
async function getValue(name: SettingsOfType<string>): Promise<string>;
async function getValue(name: Settings): Promise<boolean | string | string[]>;
async function getValue(name: Settings): Promise<boolean | string | string[]> {
	const stored = await storage.getItem<boolean | string | string[]>(
		storageKey(name),
	);

	return stored ?? settingDefs[name].defaultValue;
}

function setValue(
	name: SettingsOfType<boolean>,
	value: boolean | undefined,
): void;
function setValue(
	name: SettingsOfType<string[]>,
	value: string[] | undefined,
): void;
function setValue(
	name: SettingsOfType<string>,
	value: string | undefined,
): void;
function setValue(
	name: Settings,
	value: boolean | string | string[] | undefined,
): void;
function setValue(
	name: Settings,
	value: boolean | string | string[] | undefined,
): void {
	void storage.setItem(storageKey(name), value);
}

async function setValueAsync(
	name: SettingsOfType<boolean>,
	value: boolean | undefined,
): Promise<void>;
async function setValueAsync(
	name: SettingsOfType<string[]>,
	value: string[] | undefined,
): Promise<void>;
async function setValueAsync(
	name: SettingsOfType<string>,
	value: string | undefined,
): Promise<void>;
async function setValueAsync(
	name: Settings,
	value: boolean | string | string[] | undefined,
): Promise<void>;
async function setValueAsync(
	name: Settings,
	value: boolean | string | string[] | undefined,
): Promise<void> {
	await storage.setItem(storageKey(name), value);
}

async function addToArray(
	name: Settings,
	value: string,
): Promise<string[] | string> {
	const settingDef = settingDefs[name];
	if (settingDef.type !== "array") {
		throw new Error(`${name} is not an array setting`);
	}

	const stored = await storage.getItem<string[]>(storageKey(name));
	const current = stored ?? settingDef.defaultValue;

	if (current.includes(value)) {
		return i18n.t("duplicateEntry");
	}

	const result = settingDef.validator(value);

	if (result.errorMessage) {
		return result.errorMessage;
	}

	current.push(result.value);
	setValue(name, current);

	return current;
}

async function removeFromArray(
	name: Settings,
	value: string,
): Promise<string[]> {
	const stored = await storage.getItem<string[]>(storageKey(name));
	const filtered = (stored ?? []).filter((entry) => entry !== value);

	setValue(name, filtered);

	return filtered;
}

const settingTypeOrder: Record<SettingDef["type"], number> = {
	array: 2,
	boolean: 0,
	option: 1,
	string: 3,
};

function toEntry(name: Settings) {
	return { ...asDef(name), name } satisfies SettingEntry;
}

function bySettingType(leftEntry: SettingEntry, rightEntry: SettingEntry) {
	return settingTypeOrder[leftEntry.type] - settingTypeOrder[rightEntry.type];
}

function getDisplaySettings() {
	const allChildren = new Set(
		Object.values(Settings).flatMap((name) => asDef(name).children ?? []),
	);

	return Object.values(Settings)
		.filter((name) => {
			const settingDef = asDef(name);
			return settingDef.displayInList && !allChildren.has(name);
		})
		.map<SettingEntry>((name) => toEntry(name))
		.toSorted(bySettingType);
}

function isSettingName(name: string): name is Settings {
	return name in settingDefs;
}

function getChildren(name: Settings): SettingEntry[] {
	return (asDef(name).children ?? [])
		.filter((child) => isSettingName(child))
		.map((child) => toEntry(child))
		.toSorted(bySettingType);
}

export {
	getValue,
	setValue,
	setValueAsync,
	addToArray,
	removeFromArray,
	getDisplaySettings,
	getChildren,
};

export type { SettingDef, SettingEntry };
