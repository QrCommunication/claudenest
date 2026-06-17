/**
 * Pure-logic unit tests for the token-budget (projectsStore.fetchTokenBudget)
 * and epic-decompose (epicsStore.decomposeEpic + subscribeRealtime) flows.
 *
 * Runs in the node environment: the API client, the WebSocket service and
 * AsyncStorage (persist middleware) are mocked so only the store reducers are
 * exercised — fast and deterministic.
 */

import type { DecomposeEpicResponse, Epic, TokenBudget } from "@/types";

// ── Mocks (hoisted; vars must be `mock`-prefixed to satisfy jest) ────────────
const mockEpicsDecompose = jest.fn();
const mockEpicsList = jest.fn();
const mockTokenBudget = jest.fn();
const mockWsOn = jest.fn(() => () => {});

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

jest.mock("@/services/websocket", () => ({
  websocket: {
    on: (...args: unknown[]) => mockWsOn(...(args as [])),
    subscribeToProject: jest.fn(),
    unsubscribeFromProject: jest.fn(),
  },
}));

jest.mock("@/services/api", () => ({
  __esModule: true,
  epicsApi: {
    decompose: (...args: unknown[]) => mockEpicsDecompose(...args),
    list: (...args: unknown[]) => mockEpicsList(...args),
  },
  projectsApi: {
    tokenBudget: (...args: unknown[]) => mockTokenBudget(...args),
  },
  tasksApi: {},
  locksApi: {},
  orchestratorApi: {},
  getApiErrorCode: () => null,
}));

import { useEpicsStore } from "./epicsStore";
import { useProjectsStore } from "./projectsStore";

const PROJECT_ID = "11111111-1111-1111-1111-111111111111";

function makeEpic(over: Partial<Epic> = {}): Epic {
  return {
    id: "e1",
    project_id: PROJECT_ID,
    title: "Epic",
    description: null,
    color: "#a855f7",
    icon: null,
    status: "open",
    priority: "medium",
    sort_order: 0,
    tasks_count: 0,
    completed_tasks_count: 0,
    progress_percentage: 0,
    decomposition_status: null,
    decomposition_session_id: null,
    decomposition_error: null,
    decomposed_at: null,
    archived_at: null,
    is_archived: false,
    pr_url: null,
    pr_number: null,
    pr_state: null,
    pr_branch: null,
    has_pull_request: false,
    finalized_at: null,
    started_at: null,
    completed_at: null,
    created_at: "2026-06-16T00:00:00Z",
    updated_at: "2026-06-16T00:00:00Z",
    ...over,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useEpicsStore.setState({ epics: [], isLoading: false, error: null });
  useProjectsStore.setState({
    tokenBudget: null,
    isLoadingTokenBudget: false,
    error: null,
  });
});

// ── epicsStore.decomposeEpic ─────────────────────────────────────────────────
describe("epicsStore.decomposeEpic", () => {
  const form = {
    title: "Checkout",
    prd: "Build a checkout flow with cart, payment and confirmation.",
    credential_id: "cred-1",
  };

  const runningEpic = makeEpic({
    id: "epic-new",
    title: "Checkout",
    decomposition_status: "running",
  });

  const response: DecomposeEpicResponse = {
    epic: runningEpic,
    session_id: "sess-1",
    status: "decomposing",
    message: "Decomposition started",
  };

  it("adds the returned running epic to the board immediately", async () => {
    mockEpicsDecompose.mockResolvedValueOnce({ data: response });

    const result = await useEpicsStore
      .getState()
      .decomposeEpic(PROJECT_ID, form);

    expect(mockEpicsDecompose).toHaveBeenCalledWith(PROJECT_ID, form);
    expect(result).toEqual(response);
    const { epics, isLoading, error } = useEpicsStore.getState();
    expect(epics).toHaveLength(1);
    expect(epics[0]).toMatchObject({
      id: "epic-new",
      decomposition_status: "running",
    });
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it("updates in place (no duplicate) when a broadcast already raced the epic in", async () => {
    // The realtime `.epic.decomposition` signal added a stub first.
    useEpicsStore.setState({
      epics: [makeEpic({ id: "epic-new", decomposition_status: "pending" })],
    });
    mockEpicsDecompose.mockResolvedValueOnce({ data: response });

    await useEpicsStore.getState().decomposeEpic(PROJECT_ID, form);

    const { epics } = useEpicsStore.getState();
    expect(epics).toHaveLength(1);
    expect(epics[0].decomposition_status).toBe("running");
  });

  it("sets the error and rethrows on failure (loading reset)", async () => {
    mockEpicsDecompose.mockRejectedValueOnce(new Error("Machine offline"));

    await expect(
      useEpicsStore.getState().decomposeEpic(PROJECT_ID, form),
    ).rejects.toThrow("Machine offline");

    const { epics, isLoading, error } = useEpicsStore.getState();
    expect(epics).toHaveLength(0);
    expect(isLoading).toBe(false);
    expect(error).toBe("Machine offline");
  });
});

// ── epicsStore.subscribeRealtime (decomposition lifecycle) ───────────────────
describe("epicsStore.subscribeRealtime — decomposition", () => {
  // Pull the `epic:decomposition` handler registered with websocket.on().
  function decompositionHandler(): (raw: unknown) => void {
    const teardown = useEpicsStore.getState().subscribeRealtime(PROJECT_ID);
    const call = mockWsOn.mock.calls.find((c) => c[0] === "epic:decomposition");
    expect(call).toBeDefined();
    // Keep the teardown reachable for the caller via a side channel.
    (decompositionHandler as { _teardown?: () => void })._teardown = teardown;
    return call![1] as (raw: unknown) => void;
  }

  it("patches decomposition fields in place for the subscribed project", () => {
    useEpicsStore.setState({
      epics: [makeEpic({ id: "e1", decomposition_status: "pending" })],
    });
    const onDecomp = decompositionHandler();

    onDecomp({
      epic_id: "e1",
      project_id: PROJECT_ID,
      action: "running",
      decomposition_status: "running",
      decomposition_error: null,
      decomposition_completed_at: null,
      timestamp: "2026-06-16T00:00:01Z",
    });

    const epic = useEpicsStore.getState().epics[0];
    expect(epic.decomposition_status).toBe("running");
  });

  it("ignores a payload for another project", () => {
    useEpicsStore.setState({
      epics: [makeEpic({ id: "e1", decomposition_status: "pending" })],
    });
    const onDecomp = decompositionHandler();

    onDecomp({
      epic_id: "e1",
      project_id: "other-project",
      action: "running",
      decomposition_status: "running",
      decomposition_error: null,
      decomposition_completed_at: null,
      timestamp: "2026-06-16T00:00:01Z",
    });

    expect(useEpicsStore.getState().epics[0].decomposition_status).toBe(
      "pending",
    );
  });

  it("maps decomposition_completed_at to decomposed_at and refetches on completion", async () => {
    useEpicsStore.setState({
      epics: [makeEpic({ id: "e1", decomposition_status: "running" })],
    });
    // The refetch on completion pulls the epic now carrying its tasks.
    mockEpicsList.mockResolvedValueOnce({
      data: [
        makeEpic({
          id: "e1",
          decomposition_status: "completed",
          tasks_count: 5,
        }),
      ],
    });
    const onDecomp = decompositionHandler();

    onDecomp({
      epic_id: "e1",
      project_id: PROJECT_ID,
      action: "completed",
      decomposition_status: "completed",
      decomposition_error: null,
      decomposition_completed_at: "2026-06-16T00:05:00Z",
      timestamp: "2026-06-16T00:05:00Z",
    });

    // The in-place patch is synchronous (alias mapping)…
    expect(useEpicsStore.getState().epics[0].decomposed_at).toBe(
      "2026-06-16T00:05:00Z",
    );
    // …then the completion refetch runs.
    await Promise.resolve();
    await Promise.resolve();
    expect(mockEpicsList).toHaveBeenCalledWith(PROJECT_ID);
  });
});

// ── projectsStore.fetchTokenBudget ───────────────────────────────────────────
describe("projectsStore.fetchTokenBudget", () => {
  const budget: TokenBudget = {
    tokens: {
      used: 1200,
      max: 100000,
      percent: 1,
      limit_reached: false,
      input: 800,
      output: 400,
      session_total: 1200,
    },
    cost: {
      estimated_usd: 0.0123,
      currency: "USD",
      pricing_model: "claude-opus-4",
    },
    sessions_count: 3,
  };

  it("stores the budget and clears the loading flag on success", async () => {
    mockTokenBudget.mockResolvedValueOnce({ data: budget });

    const result = await useProjectsStore
      .getState()
      .fetchTokenBudget(PROJECT_ID);

    expect(mockTokenBudget).toHaveBeenCalledWith(PROJECT_ID);
    expect(result).toEqual(budget);
    const state = useProjectsStore.getState();
    expect(state.tokenBudget).toEqual(budget);
    expect(state.isLoadingTokenBudget).toBe(false);
    expect(state.error).toBeNull();
  });

  it("sets the error, resets loading and rethrows on failure", async () => {
    mockTokenBudget.mockRejectedValueOnce(new Error("Budget fetch failed"));

    await expect(
      useProjectsStore.getState().fetchTokenBudget(PROJECT_ID),
    ).rejects.toThrow("Budget fetch failed");

    const state = useProjectsStore.getState();
    expect(state.tokenBudget).toBeNull();
    expect(state.isLoadingTokenBudget).toBe(false);
    expect(state.error).toBe("Budget fetch failed");
  });
});
