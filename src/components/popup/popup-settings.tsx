import { ExternalLink } from "@/components/common/external-link";
import { popupSettings as popupSettingsStyles } from "@/components/common/variants/popup-variants";
import { getChildren, getDisplaySettings } from "@/utils/settings";
import type { SettingEntry } from "@/utils/settings";

import { LemmySettings } from "./lemmy-settings/lemmy-settings";
import { CheckboxSetting } from "./settings/checkbox-setting";
import { DropdownSetting } from "./settings/dropdown-setting";
import { ListSetting } from "./settings/list-setting";

const styles = popupSettingsStyles();
const linkClassName = styles.link();
const panelClassName = styles.panel();
const settingContainerClassName = styles.settingContainer();
const textColumnClassName = styles.textColumn();
const titleClassName = styles.title();

interface SettingsContainerProps {
	settings: SettingEntry[];
}

function SettingContainer({ settings }: SettingsContainerProps) {
	return (
		<div className={settingContainerClassName}>
			{settings.map((setting) => {
				switch (setting.type) {
					case "array": {
						return <ListSetting key={setting.name} setting={setting} />;
					}

					case "boolean": {
						const showChildren = (setting.children?.length ?? 0) > 0;

						return (
							<CheckboxSetting key={setting.name} setting={setting}>
								{showChildren && (
									<SettingContainer settings={getChildren(setting.name)} />
								)}
							</CheckboxSetting>
						);
					}

					case "option": {
						return <DropdownSetting key={setting.name} setting={setting} />;
					}

					case "string": {
						return;
					}

					default: {
						return;
					}
				}
			})}
		</div>
	);
}

function PopupLinks() {
	return (
		<div className={textColumnClassName}>
			<ExternalLink
				className={linkClassName}
				href="https://github.com/theacrat/Reddit-Comments-for-YouTube"
			>
				GitHub
			</ExternalLink>
			<ExternalLink className={linkClassName} href="https://ko-fi.com/theacrat">
				support the developer
			</ExternalLink>
		</div>
	);
}

function PopupSettings() {
	const settings = getDisplaySettings();

	return (
		<div className={panelClassName}>
			<div className={textColumnClassName}>
				<span className={titleClassName}>{i18n.t("extensionName")}</span>
			</div>
			<SettingContainer settings={settings} />
			<LemmySettings />
			<PopupLinks />
		</div>
	);
}
export { PopupSettings };
