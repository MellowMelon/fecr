# fecr

This is the repository for the [Fire Emblem Character
Reports](https://pmmellowmelon.com/fecr/). If you are interested in
contributing, read on.

## Setup

- Make sure you have node and npm installed locally.
- Clone this repository.
- `npm install`.
- To verify everything is working, `npm run check`. It should pass.

While developing, you can keep `npm run watch` going in a terminal to
automatically rebuild the JS in the src directory.

Run `npm run check` before any commit and make sure it passes.

## Organization

The project is coded in Typescript. The final product is a built Javascript file
wrapped by a small HTML file, together with some assets. There is no server-side
code.

The **public** folder contains the files actually served on the website.

The **src** folder contains the source files for the built Javascript. Most of
the math is done in `src/CharAdvance.ts`.

The **data** folder contains JSONs corresponding to each game. The format of
these files is described by the `GameData` type in `src/types.ts`.

The **tools** folder contains scripts used to create the JSONs in the data
directory.

The **test** folder contains some automated tests. There is not full coverage,
but some trickier computations are covered here.

## Adding a new game

This is a quick and not comprehensive overview of the steps involved in getting
this tool to support a new game.

- Create a `grabXData.js` script in tools, based on the existing ones. It
  should spit JSON to stdout. Add a line to `rerun.sh`. Commit the output JSON.
- Add an import for your new file in `src/GameTable.ts`.
- If your JSON needed to add extra fields or features, update the `GameData`
  type or its constituents in `src/types.ts`.
- Make sure your game displays only the relevant items in the report details.
  Edit the logic in `getReportDetailsRows` of `src/CharReport.ts` if it does
  not.
- Go through `src/HelpTable.ts`. Add appropriate versions of each entry for
  your game, e.g. listing example sources of stat boosts in the
  `histIntro_boost` fragment.
- Add new test cases for your game to `test/_CharSerializeCases.ts`, which are
  regression tests for the URL hashes. Confirm manually that each hash you add
  loads correctly on a refresh.

If you need to update the math, edit `src/CharAdvance.ts`. You should add new
tests to `test/CharAdvance.ts` and make sure the old ones still pass.

## License

MIT
