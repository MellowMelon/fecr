import ReactDOM from "react-dom";
import React from "react";
import MainContainer from "./MainContainer";
import game from "../data/3h.json";

document.addEventListener("DOMContentLoaded", function() {
	ReactDOM.render(
		React.createElement(MainContainer, {game: game as any}),
		document.getElementById("main-container")
	);
});
