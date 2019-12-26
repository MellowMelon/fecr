import {GameData} from "./types";

const gameTable: {[id: string]: GameData} = {};

import Game3H from "../data/3h.json";
gameTable[Game3H.id] = Game3H as any;
import GameEchoes from "../data/echoes.json";
gameTable[GameEchoes.id] = GameEchoes as any;

export default gameTable;
