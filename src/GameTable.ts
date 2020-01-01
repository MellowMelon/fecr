import {GameData} from "./types";

// This file is a manual bulk import of the data directory with game JSONs.

const gameTable: {[id: string]: GameData} = {};

import Game3H from "../data/3h.json";
gameTable[Game3H.id] = Game3H as any;
import GameEchoes from "../data/echoes.json";
gameTable[GameEchoes.id] = GameEchoes as any;
import GameFates from "../data/fates.json";
gameTable[GameFates.id] = GameFates as any;

export default gameTable;
