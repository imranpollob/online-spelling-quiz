import wordPolicy from "./wordPolicy";
import createCurationPlanner from "./curationPlanCore.mjs";

const curationPlanner = createCurationPlanner(wordPolicy);
export const { buildCurationPlan } = curationPlanner;
export default curationPlanner;
