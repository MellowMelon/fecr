import _ from "lodash";
import React from "react";
import {CharacterName, Team, GameData} from "./common";
import {doesCharHaveData} from "./CharUtils";

type Props = {
	game: GameData;
	team: Team;
	currName: CharacterName;
	setName: (name: CharacterName) => void;
};

const CharacterSelector: React.FunctionComponent<Props> = function(
	props: Props
) {
	const {chars, id} = props.game;

	const buttons = Object.keys(chars).map(name => {
		const hasData = doesCharHaveData(props.game, props.team[name]);
		const src = "images/chars/" + id + "-" + name.toLowerCase() + ".jpg";
		let className = "charnamesel-button";
		className += name === props.currName ? " selected" : "";
		className += hasData ? "" : " no-data";
		return (
			<div key={name} className={className} onClick={() => props.setName(name)}>
				<img src={src} title={name} />
			</div>
		);
	});

	return <div className="charnamesel">{buttons}</div>;
};
export default CharacterSelector;
