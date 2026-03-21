const DEFAULT_SCENARIO = {
  scenarioId: 'team_conflict',
  scenarioTitle: 'Team Conflict',
}

const SCENARIO_MAP = {
  'first-interview': { scenarioId: 'job_interview', scenarioTitle: 'Job Interview' },
  'follow-up': { scenarioId: 'job_interview', scenarioTitle: 'Job Interview' },
  'ask-help': { scenarioId: 'team_conflict', scenarioTitle: 'Team Conflict' },
  'deadline-extend': { scenarioId: 'team_conflict', scenarioTitle: 'Team Conflict' },
  'small-talk': { scenarioId: 'team_conflict', scenarioTitle: 'Team Conflict' },
  lunch: { scenarioId: 'team_conflict', scenarioTitle: 'Team Conflict' },
  'team-meeting': { scenarioId: 'team_conflict', scenarioTitle: 'Team Conflict' },
  disagreement: { scenarioId: 'team_conflict', scenarioTitle: 'Team Conflict' },
  'pass-boss': { scenarioId: 'team_conflict', scenarioTitle: 'Team Conflict' },
  'forgotten-name': { scenarioId: 'team_conflict', scenarioTitle: 'Team Conflict' },
}

export function mapFrontendScenarioToApi(frontendScenario) {
  if (!frontendScenario) return DEFAULT_SCENARIO
  const mapped = SCENARIO_MAP[frontendScenario.id] || DEFAULT_SCENARIO

  // Use the specific scenario title from the frontend (e.g. "Passing your boss in the corridor")
  // so the AI generates context-appropriate responses, rather than the generic category title.
  return {
    scenarioId: frontendScenario.apiScenarioId || mapped.scenarioId,
    scenarioTitle: frontendScenario.title || frontendScenario.apiScenarioTitle || mapped.scenarioTitle,
  }
}
