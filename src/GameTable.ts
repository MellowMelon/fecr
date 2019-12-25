import {GameData} from "./types";

import Game3H from "../data/3h.json";

const gameTable: {[id: string]: GameData} = {};
gameTable[Game3H.id] = Game3H as any;

export default gameTable;
