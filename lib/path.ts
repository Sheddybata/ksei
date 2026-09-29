export const PASS_MARK = 70;

export type GateSubmission = {
  score: number | null;
  maxScore: number | null;
};

export type PathModuleInput = {
  id: string;
  order: number;
  title: string;
};

export type PathGateInput = {
  id: string;
  gateOrder: number | null;
  submission: GateSubmission | null;
};

export type PathStep = {
  id: string;
  order: number;
  title: string;
  unlocked: boolean;
  lockReason: string | null;
  completed: boolean;
  stepDone: boolean;
  gate: {
    id: string;
    passed: boolean;
    percent: number | null;
    open: boolean;
  } | null;
};

export function percentOf(submission: GateSubmission | null | undefined) {
  if (!submission || submission.score == null || !submission.maxScore) return null;
  return Math.round((submission.score / submission.maxScore) * 100);
}

export function passedGate(submission: GateSubmission | null | undefined) {
  const percent = percentOf(submission);
  return percent != null && percent >= PASS_MARK;
}

export function buildPath(modules: PathModuleInput[], gates: PathGateInput[], completedIds: Set<string>): PathStep[] {
  const ordered = [...modules].sort((a, b) => a.order - b.order);
  const checkpoints = gates.filter((gate) => gate.gateOrder != null);

  return ordered.map((module, index) => {
    const previous = ordered[index - 1];
    const previousGate = previous ? checkpoints.find((gate) => gate.gateOrder === previous.order) : undefined;
    let unlocked = true;
    let lockReason: string | null = null;

    if (previous && !completedIds.has(previous.id)) {
      unlocked = false;
      lockReason = `Finish module ${previous.order} to open this one.`;
    } else if (previous && previousGate && !passedGate(previousGate.submission)) {
      unlocked = false;
      lockReason = `Pass the module ${previous.order} test to open this one.`;
    }

    const completed = completedIds.has(module.id);
    const checkpoint = checkpoints.find((gate) => gate.gateOrder === module.order);
    const gate = checkpoint
      ? {
          id: checkpoint.id,
          passed: passedGate(checkpoint.submission),
          percent: percentOf(checkpoint.submission),
          open: completed,
        }
      : null;

    return {
      id: module.id,
      order: module.order,
      title: module.title,
      unlocked,
      lockReason,
      completed,
      stepDone: completed && (gate ? gate.passed : true),
      gate,
    };
  });
}

export function pathProgress(steps: { stepDone: boolean }[]) {
  if (!steps.length) return 0;
  return Math.round((steps.filter((step) => step.stepDone).length / steps.length) * 100);
}

export function currentStep(steps: PathStep[]) {
  return steps.find((step) => step.unlocked && !step.stepDone) ?? steps.find((step) => step.unlocked) ?? steps[0] ?? null;
}
