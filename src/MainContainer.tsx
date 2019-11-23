import _ from "lodash";
import React, {useState} from "react";
import {
	Stat,
	History,
	CharacterName,
	CharacterClass,
	Character,
	Team,
	GameData,
} from "./common";
import {createCharacter} from "./CharUtils";

import CharacterSelector from "./CharacterSelector";
import CharacterEditor from "./CharacterEditor";
import CharacterPanel from "./CharacterPanel";

type Props = {
	game: GameData;
};

const MainContainer: React.FunctionComponent<Props> = function(props: Props) {
	const {game} = props;
	const firstName = Object.keys(game.chars)[0];
	const [editing, setEditing] = useState<boolean>(true);
	const [team, setTeam] = useState<Team>({});
	const [selName, setSelName] = useState<CharacterName>(firstName);

	const currChar: Character = team[selName] || createCharacter(game, selName);

	function handleSetCharName(name: CharacterName) {
		if (selName === name) return;
		setSelName(name);
	}

	function updateCurrChar(f: (c: Character) => Character | void) {
		let newChar = _.clone(currChar);
		newChar = f(newChar) || newChar;
		setTeam({
			...team,
			[selName]: newChar,
		});
	}

	function handleSetBaseCustom(custom: boolean) {
		updateCurrChar((newChar: Character) => {
			if (!custom) {
				delete newChar.baseLevel;
				delete newChar.baseClass;
				delete newChar.baseStats;
			} else {
				const gameChar = game.chars[selName];
				newChar.baseLevel = newChar.baseLevel || gameChar.baseLevel;
				newChar.baseClass = newChar.baseClass || gameChar.baseClass;
				newChar.baseStats = newChar.baseStats || gameChar.baseStats;
			}
		});
	}

	function handleSetBaseLevel(level: number) {
		updateCurrChar((newChar: Character) => {
			newChar.baseLevel = level;
		});
	}

	function handleSetBaseClass(charClass: CharacterClass) {
		updateCurrChar((newChar: Character) => {
			newChar.baseClass = charClass;
		});
	}

	function handleSetBaseStat(name: Stat, val: number) {
		updateCurrChar((newChar: Character) => {
			const newStats = _.clone(newChar.baseStats) || {};
			newStats[name] = val;
			newChar.baseStats = newStats;
		});
	}

	function handleSetCharHistory(history: History) {
		updateCurrChar((newChar: Character) => {
			newChar.history = history;
		});
	}

	const editingButton = (
		<button className="edit-toggle" onClick={() => setEditing(!editing)}>
			{editing ? "Show Character Report" : "Edit Character"}
		</button>
	);

	const charEditor = (
		<CharacterEditor
			game={game}
			char={currChar}
			setBaseCustom={handleSetBaseCustom}
			setBaseClass={handleSetBaseClass}
			setBaseLevel={handleSetBaseLevel}
			setBaseStat={handleSetBaseStat}
			setHistory={handleSetCharHistory}
		/>
	);

	const charPanel = <CharacterPanel game={game} char={currChar} />;

	return (
		<div>
			<CharacterSelector
				game={game}
				team={team}
				currName={selName}
				setName={handleSetCharName}
			/>
			<h1 className="char-name">{currChar.name}</h1>
			{editingButton}
			<div className="char-main-panel">
				{editing ? charEditor : null}
				{!editing ? charPanel : null}
			</div>
		</div>
	);
};
export default MainContainer;
