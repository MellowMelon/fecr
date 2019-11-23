/**
 * This deals with numeric distributions only. Probability distributions (pd)
 * are objects where keys are numbers and the values are probabilities (so
 * values sum to 1). The objects are treated as immutable.
 */

import _ from "lodash";

export type ProbDist = {[outcome: number]: number};

const TOLERANCE = 0.000001;

/**
 * Constructor for a new probability distribution that always picks the passed
 * value.
 */
export function initAtValue(val: number): ProbDist {
	return {[val]: 1};
}

/**
 * Gets the minimum possible value in the probability distribution.
 */
export function getMin(pd: ProbDist): number {
	return Math.min(...Object.keys(pd).map(x => Number(x)));
}

/**
 * Gets the maximum possible value in the probability distribution.
 */
export function getMax(pd: ProbDist): number {
	return Math.max(...Object.keys(pd).map(x => Number(x)));
}

/**
 * Gets the maximum probability of taking a value in the distribution. The
 * value itself is not returned.
 */
export function getMaxDensity(pd: ProbDist): number {
	return Math.max(..._.values(pd));
}

/**
 * Gets the expected value (weighted average) of the distribution.
 */
export function getAverage(pd: ProbDist): number {
	let result = 0;
	for (const valStr in pd) {
		const val = Number(valStr);
		const p = pd[val];
		result += p * val;
	}
	return result;
}

/**
 * Gets the median value of the distribution; that is, the value at the 50th
 * percentile.
 */
export function getMedian(pd: ProbDist): number {
	const allVals: Array<number> = _.sortBy(Object.keys(pd).map(x => Number(x)));
	let totalP = 0;
	for (let i = 0; i < allVals.length; i += 1) {
		totalP += pd[allVals[i]];
		if (totalP > 0.5 - TOLERANCE && totalP < 0.5 + TOLERANCE) {
			return (allVals[i] + allVals[i + 1]) / 2;
		} else if (totalP > 0.5) {
			return allVals[i];
		}
	}
	// Should never get here.
	return allVals[allVals.length - 1];
}

/**
 * Gets the value at the given percentile of the distribution. The passed
 * percentile should be a number in 0-1.
 */
export function getValueAtPercentile(pd: ProbDist, perc: number): number {
	const minVal = getMin(pd);
	const maxVal = getMax(pd);
	if (perc <= 0) {
		return minVal;
	} else if (perc >= 1) {
		return maxVal;
	}
	let prevCumP = 0;
	let currCumP = 0;
	for (let i = minVal; i <= maxVal; i += 1) {
		prevCumP = currCumP;
		currCumP += pd[i];
		if (perc <= currCumP && perc > prevCumP) {
			return i + (perc - prevCumP) / (currCumP - prevCumP);
		}
	}
	return maxVal;
}

/**
 * Gets the range of percentiles for the given value. The returned percentiles
 * are the respective probabilities of getting a value less than and at most
 * the passed value.
 */
export function getPercentileRangeOfValue(
	pd: ProbDist,
	valToTest: number
): [number, number] {
	let [lo, hi] = [0, 0];
	for (const valStr in pd) {
		const val = Number(valStr);
		const p = pd[val];
		if (valToTest >= val) {
			hi += p;
		}
		if (valToTest > val) {
			lo += p;
		}
	}
	return [lo, hi];
}

/**
 * Modifies the distribution so that all values less than the passed minimum
 * now return that minimum instead.
 */
export function applyMin(pd: ProbDist, min: number): ProbDist {
	const newPD: ProbDist = {};
	for (const valStr in pd) {
		const val = Number(valStr);
		const p = pd[val];
		const newVal = Math.max(min, val);
		newPD[newVal] = (newPD[newVal] || 0) + p;
	}
	return newPD;
}

/**
 * Modifies the distribution so that all values greater than the passed maximum
 * now return that maximum instead.
 */
export function applyMax(pd: ProbDist, max: number): ProbDist {
	const newPD: ProbDist = {};
	for (const valStr in pd) {
		const val = Number(valStr);
		const p = pd[val];
		const newVal = Math.min(max, val);
		newPD[newVal] = (newPD[newVal] || 0) + p;
	}
	return newPD;
}

/**
 * Modifies the distribution so that all values are increased by the specified
 * amount. Optionally pass a stat cap. Increases should not go past the cap
 * without affecting stats already above it.
 */
export function applyIncrease(
	pd: ProbDist,
	inc: number,
	cap?: number
): ProbDist {
	return applyGrowthRate(pd, inc, cap);
}

/**
 * Applies a Fire Emblem style growth rate to a distribution. The distribution
 * has all values increased by the floor of the passed growth, and the
 * fractional part is the probability that the value should be increased by 1.
 * Optionally pass a stat cap. Growth should be 0 at or past that cap without
 * affecting stats already above it.
 */
export function applyGrowthRate(
	pd: ProbDist,
	growth: number,
	cap?: number
): ProbDist {
	const inc = Math.floor(growth);
	const chance = growth - inc;
	const newPD: ProbDist = {};
	for (const valStr in pd) {
		const val = Number(valStr);
		const p = pd[val];
		if (cap && val >= cap) {
			newPD[val] = (newPD[val] || 0) + p;
		} else if (cap && val + inc >= cap) {
			newPD[cap] = (newPD[cap] || 0) + p;
		} else {
			newPD[val + inc] = (newPD[val + inc] || 0) + p * (1 - chance);
			newPD[val + inc + 1] = (newPD[val + inc + 1] || 0) + p * chance;
		}
	}
	return newPD;
}
