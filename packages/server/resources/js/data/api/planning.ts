import type { ApiCategory } from './types';

export const planningCategory: ApiCategory = {
  id: 'planning-agent',
  title: 'Planning Agent',
  description: 'AI-powered conversational agent for project planning and task decomposition.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/projects/{id}/planning/context',
      description: 'Get the current planning context snapshot (backlog, epics, velocity).',
      response: `{
  "success": true,
  "data": {
    "project_id": "...",
    "backlog_size": 24,
    "active_sprint": { "id": "...", "name": "Sprint 15" },
    "velocity_avg": 18,
    "suggested_capacity": 21,
    "unestimated_tasks": 5
  }
}`,
    },
    {
      method: 'POST',
      path: '/api/projects/{id}/planning/execute',
      description: 'Trigger a planning run. Analyses backlog and suggests epic grouping, story points, and sprint scope.',
      body: `{
  "goal": "Prepare Sprint 16 focused on mobile features",
  "constraints": { "max_story_points": 21 }
}`,
      response: `{
  "success": true,
  "data": {
    "suggestions": [
      { "task_id": "...", "suggested_story_points": 5, "suggested_epic": "epic-mobile" },
      { "task_id": "...", "suggested_story_points": 3, "suggested_sprint": "sprint-2026-w17" }
    ],
    "summary": "Recommended 7 tasks totaling 19 story points for Sprint 16."
  }
}`,
    },
    {
      method: 'POST',
      path: '/api/projects/{id}/planning/chat',
      description: 'Conversational interface to the Planning Agent. Send a natural language message and receive structured suggestions.',
      body: `{
  "message": "Break down the authentication epic into smaller tasks"
}`,
      response: `{
  "success": true,
  "data": {
    "reply": "I suggest splitting the authentication epic into 4 tasks: ...",
    "actions": [
      { "type": "create_task", "title": "Implement OAuth2 login flow", "story_points": 5 },
      { "type": "create_task", "title": "Add MFA support", "story_points": 8 }
    ]
  }
}`,
    },
  ],
};
