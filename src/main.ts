import ReactDOM from "react-dom";
import React from "react";
import MainContainer from "./MainContainer";
import game from "../data/3h.json";

document.addEventListener("DOMContentLoaded", function() {
	const initialHash = window.location.hash.slice(1);
	ReactDOM.render(
		React.createElement(MainContainer, {game: game as any, initialHash}),
		document.getElementById("main-container")
	);
});
