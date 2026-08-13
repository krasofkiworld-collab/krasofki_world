// Hard cap on how many units of one product/variant a single order can
// contain — stops one buyer from wiping out the whole stock in one go,
// regardless of how much is actually left on the shelf.
export const MAX_QTY_PER_ITEM = 5;
