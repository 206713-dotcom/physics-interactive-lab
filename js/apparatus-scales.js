// A fixed visual transfer curve keeps small extensions visible while fitting
// the largest setups on the same bench. Graphs and readings still use metres.
export const springTravel = extension => extension / (extension + 0.2);
export const wireTravel = extension => extension / (extension + 0.0004);
