import ReactDOM from "react-dom";
import React from "react";
import MainContainer from "./view/Main";

// Entry point of the application.

function renderFromURLHash() {
	const h = window.location.hash.slice(1) || null;
	const el = React.createElement(MainContainer, {urlHash: h});
	const container = document.getElementById("main-container");
	if (container) {
		ReactDOM.unmountComponentAtNode(container);
		ReactDOM.render(el, container);
	}
}

document.addEventListener("DOMContentLoaded", function() {
	renderFromURLHash();

	window.addEventListener("hashchange", function() {
		renderFromURLHash();
	});
});
