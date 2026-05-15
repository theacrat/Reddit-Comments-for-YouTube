import React from "react";
import ReactDOM from "react-dom/client";

import "@/assets/css/threads.css";
import "@/assets/css/popup.css";
import "@/assets/css/app.css";
import { Popup } from "@/components/popup/popup";

// oxlint-disable-next-line typescript/no-non-null-assertion
ReactDOM.createRoot(document.querySelector("#root")!).render(
	<React.StrictMode>
		<Popup />
	</React.StrictMode>,
);
