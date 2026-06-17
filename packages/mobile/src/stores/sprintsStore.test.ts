/**
 * sprintsStore — CRUD / showArchived fetch filter / realtime reconciliation
 * / local mutators. The `sprintsApi` and `websocket` services are mocked so the
 * store logic is exercised in isolation (node env, no network/Reverb).
 */

import type { Sprint } from "@/types";

// ── Mock AsyncStorage (node env has no window.localStorage) ───────────────────
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

// ── Mock the API service ──────────────────────────────────────────────────────
// Self-contained factory (jest hoists jest.mock above the imports, so the factory
// cannot close over module-scope consts — they would be in the TDZ at run time).
jest.mock("@/services/api", () => ({
  sprintsApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    start: jest.fn(),
    complete: jest.fn(),
    getBurndown: jest.fn(),
  },
}));

const mockSprintsApi = (
  jest.requireMock("@/services/api") as {
    sprintsApi: Record<string, jest.Mock>;
  }
).sprintsApi;

// ── Mock the websocket event bus ──────────────────────────────────────────────
// Self-contained factory (no out-of-scope refs): the bus lives inside the mock
// and is retrieved via jest.requireMock so the test can emit events into it.
type BusCb = (payload: unknown) => void;
jest.mock("@/services/websocket", () => {
  const registry = new Map<string, Set<BusCb>>();
  return {
    __registry: registry,
    websocket: {
      on: jest.fn((event: string, cb: BusCb) => {
        if (!registry.has(event)) registry.set(event, new Set());
        registry.get(event)!.add(cb);
        return () => registry.get(event)?.delete(cb);
      }),
    },
  };
});

const mockBus = (
  jest.requireMock("@/services/websocket") as {
    __registry: Map<string, Set<BusCb>>;
  }
).__registry;
function emitBus(event: string, payload: unknown): void {
  mockBus.get(event)?.forEach((cb) => cb(payload));
}

import { useSprintsStore } from "./sprintsStore";

const makeSprint = (overrides: Partial<Sprint> = {}): Sprint => ({
  id: "s1",
  project_id: "p1",
  name: "Sprint",
  goal: null,
  status: "planning",
  start_date: null,
  end_date: null,
  velocity: null,
  capacity: null,
  sort_order: 0,
  tasks_count: 0,
  completed_tasks_count: 0,
  total_story_points: 0,
  completed_story_points: 0,
  progress_percentage: 0,
  remaining_days: null,
  is_overdue: false,
  created_at: "2026-06-17T00:00:00Z",
  updated_at: "2026-06-17T00:00:00Z",
  ...overrides,
});

const reset = (): void =>
  useSprintsStore.setState({
    sprints: [],
    activeSprint: null,
    burndownData: [],
    showArchived: false,
    isLoading: false,
    error: null,
  });

beforeEach(() => {
  reset();
  mockBus.clear();
  jest.clearAllMocks();
});

describe("showArchived toggle", () => {
  it("sets and toggles the flag", () => {
    const s = useSprintsStore.getState();
    expect(s.showArchived).toBe(false);
    s.setShowArchived(true);
    expect(useSprintsStore.getState().showArchived).toBe(true);
    s.toggleShowArchived();
    expect(useSprintsStore.getState().showArchived).toBe(false);
  });
});

describe("fetchSprints", () => {
  it("passes archived:false by default and replaces only this project's sprints", async () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "x", project_id: "p2" })],
    });
    mockSprintsApi.list.mockResolvedValue({
      data: [makeSprint({ id: "s1", status: "active" })],
    });

    await useSprintsStore.getState().fetchSprints("p1");

    expect(mockSprintsApi.list).toHaveBeenCalledWith("p1", { archived: false });
    const { sprints, activeSprint } = useSprintsStore.getState();
    expect(sprints.map((s) => s.id).sort()).toEqual(["s1", "x"]);
    expect(activeSprint?.id).toBe("s1");
  });

  it("passes archived:true when showArchived is on (reveal filter)", async () => {
    useSprintsStore.setState({ showArchived: true });
    mockSprintsApi.list.mockResolvedValue({ data: [] });

    await useSprintsStore.getState().fetchSprints("p1");

    expect(mockSprintsApi.list).toHaveBeenCalledWith("p1", { archived: true });
  });
});

describe("CRUD actions", () => {
  it("createSprint appends and re-sorts by sort_order", async () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "a", sort_order: 1 })],
    });
    mockSprintsApi.create.mockResolvedValue({
      data: makeSprint({ id: "b", sort_order: 0 }),
    });

    const created = await useSprintsStore.getState().createSprint("p1", {
      name: "B",
    });

    expect(created.id).toBe("b");
    expect(useSprintsStore.getState().sprints.map((s) => s.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("startSprint promotes to activeSprint", async () => {
    useSprintsStore.setState({ sprints: [makeSprint({ id: "s1" })] });
    mockSprintsApi.start.mockResolvedValue({
      data: makeSprint({ id: "s1", status: "active" }),
    });

    await useSprintsStore.getState().startSprint("s1");

    expect(useSprintsStore.getState().activeSprint?.id).toBe("s1");
  });

  it("completeSprint clears activeSprint when it was the active one", async () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "s1", status: "active" })],
      activeSprint: makeSprint({ id: "s1", status: "active" }),
    });
    mockSprintsApi.complete.mockResolvedValue({
      data: makeSprint({ id: "s1", status: "completed" }),
    });

    await useSprintsStore.getState().completeSprint("s1");

    expect(useSprintsStore.getState().activeSprint).toBeNull();
    expect(useSprintsStore.getState().getSprintById("s1")!.status).toBe(
      "completed",
    );
  });

  it("deleteSprint removes the sprint and clears activeSprint", async () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "s1", status: "active" })],
      activeSprint: makeSprint({ id: "s1", status: "active" }),
    });
    mockSprintsApi.delete.mockResolvedValue({ data: null });

    await useSprintsStore.getState().deleteSprint("s1");

    expect(useSprintsStore.getState().sprints).toHaveLength(0);
    expect(useSprintsStore.getState().activeSprint).toBeNull();
  });
});

describe("local mutators", () => {
  it("applySprintUpdate patches in place and syncs activeSprint", () => {
    useSprintsStore.setState({
      sprints: [
        makeSprint({ id: "s1", status: "active", progress_percentage: 0 }),
      ],
      activeSprint: makeSprint({ id: "s1", status: "active" }),
    });
    useSprintsStore
      .getState()
      .applySprintUpdate("s1", { progress_percentage: 40 });

    expect(
      useSprintsStore.getState().getSprintById("s1")!.progress_percentage,
    ).toBe(40);
    expect(useSprintsStore.getState().activeSprint!.progress_percentage).toBe(
      40,
    );
  });

  it("addSprintLocal de-dupes, re-sorts and promotes an active sprint", () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "a", sort_order: 2 })],
    });
    useSprintsStore
      .getState()
      .addSprintLocal(makeSprint({ id: "b", sort_order: 1, status: "active" }));

    const { sprints, activeSprint } = useSprintsStore.getState();
    expect(sprints.map((s) => s.id)).toEqual(["b", "a"]); // 1 before 2
    expect(activeSprint?.id).toBe("b");
  });

  it("reconcileActiveSprint promotes on active and clears otherwise", () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "s1", status: "active" })],
    });
    useSprintsStore.getState().reconcileActiveSprint("s1", "active");
    expect(useSprintsStore.getState().activeSprint?.id).toBe("s1");

    useSprintsStore.getState().reconcileActiveSprint("s1", "completed");
    expect(useSprintsStore.getState().activeSprint).toBeNull();
  });
});

describe("realtime subscribeRealtime", () => {
  it("patches status/progress on `sprint:updated` and reconciles activeSprint", () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "s1", status: "planning" })],
    });
    const teardown = useSprintsStore.getState().subscribeRealtime("p1");

    emitBus("sprint:updated", {
      sprint_id: "s1",
      action: "started",
      name: "Sprint",
      status: "active",
      progress_percentage: 10,
      remaining_days: 5,
      timestamp: "2026-06-17T00:00:00Z",
    });

    const sprint = useSprintsStore.getState().getSprintById("s1")!;
    expect(sprint.status).toBe("active");
    expect(sprint.progress_percentage).toBe(10);
    expect(useSprintsStore.getState().activeSprint?.id).toBe("s1");

    teardown();
  });

  it("clears activeSprint on a `completed` action without a status field", () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "s1", status: "active" })],
      activeSprint: makeSprint({ id: "s1", status: "active" }),
    });
    const teardown = useSprintsStore.getState().subscribeRealtime("p1");

    // SprintCompleted shape: velocity/story-points, no status field.
    emitBus("sprint:updated", {
      sprint_id: "s1",
      action: "completed",
      velocity: 8,
      completed_story_points: 8,
      total_story_points: 10,
      timestamp: "2026-06-17T00:00:00Z",
    });

    expect(useSprintsStore.getState().activeSprint).toBeNull();
    expect(useSprintsStore.getState().getSprintById("s1")!.velocity).toBe(8);
    teardown();
  });

  it("stops reconciling after teardown", () => {
    useSprintsStore.setState({
      sprints: [makeSprint({ id: "s1", status: "planning" })],
    });
    const teardown = useSprintsStore.getState().subscribeRealtime("p1");
    teardown();

    emitBus("sprint:updated", {
      sprint_id: "s1",
      action: "started",
      status: "active",
      timestamp: "2026-06-17T00:00:00Z",
    });

    expect(useSprintsStore.getState().getSprintById("s1")!.status).toBe(
      "planning",
    );
    expect(useSprintsStore.getState().activeSprint).toBeNull();
  });
});
