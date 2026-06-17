/**
 * epicsStore — archives / showArchived / decompose / archive-unarchive / reorder
 * / realtime reconciliation. The `mockEpicsApi` and `mockWebsocket` services are mocked
 * so the store logic is exercised in isolation (node env, no network/Reverb).
 */

import type { Epic } from "@/types";

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
  epicsApi: {
    list: jest.fn(),
    listArchived: jest.fn(),
    create: jest.fn(),
    decompose: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reorder: jest.fn(),
    archive: jest.fn(),
    unarchive: jest.fn(),
  },
}));

const mockEpicsApi = (
  jest.requireMock("@/services/api") as {
    epicsApi: Record<string, jest.Mock>;
  }
).epicsApi;

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

import { useEpicsStore } from "./epicsStore";

const makeEpic = (overrides: Partial<Epic> = {}): Epic => ({
  id: "e1",
  project_id: "p1",
  title: "Epic",
  description: null,
  color: "#a855f7",
  icon: null,
  status: "open",
  priority: "medium",
  sort_order: 0,
  tasks_count: 0,
  completed_tasks_count: 0,
  remaining_tasks_count: 0,
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
  created_at: "2026-06-17T00:00:00Z",
  updated_at: "2026-06-17T00:00:00Z",
  ...overrides,
});

const reset = (): void =>
  useEpicsStore.setState({
    epics: [],
    archivedEpics: [],
    showArchived: false,
    isLoading: false,
    isDecomposing: false,
    isArchiving: false,
    error: null,
  });

beforeEach(() => {
  reset();
  mockBus.clear();
  jest.clearAllMocks();
});

describe("showArchived toggle", () => {
  it("sets and toggles the flag", () => {
    const s = useEpicsStore.getState();
    expect(s.showArchived).toBe(false);
    s.setShowArchived(true);
    expect(useEpicsStore.getState().showArchived).toBe(true);
    s.toggleShowArchived();
    expect(useEpicsStore.getState().showArchived).toBe(false);
  });
});

describe("local mutators", () => {
  it("archiveEpicLocal moves an epic from active to archived", () => {
    useEpicsStore.setState({ epics: [makeEpic({ id: "e1" })] });
    useEpicsStore
      .getState()
      .archiveEpicLocal("e1", makeEpic({ id: "e1", is_archived: true }));

    const { epics, archivedEpics } = useEpicsStore.getState();
    expect(epics).toHaveLength(0);
    expect(archivedEpics.map((e) => e.id)).toEqual(["e1"]);
    expect(archivedEpics[0]!.is_archived).toBe(true);
  });

  it("archiveEpicLocal without a row reuses the active entry (broadcast path)", () => {
    useEpicsStore.setState({ epics: [makeEpic({ id: "e1", title: "Keep" })] });
    useEpicsStore.getState().archiveEpicLocal("e1");

    const { epics, archivedEpics } = useEpicsStore.getState();
    expect(epics).toHaveLength(0);
    expect(archivedEpics[0]!.title).toBe("Keep");
  });

  it("unarchiveEpicLocal moves back to active and re-sorts by sort_order", () => {
    useEpicsStore.setState({
      epics: [makeEpic({ id: "a", sort_order: 2 })],
      archivedEpics: [makeEpic({ id: "b", sort_order: 1, is_archived: true })],
    });
    useEpicsStore.getState().unarchiveEpicLocal("b");

    const { epics, archivedEpics } = useEpicsStore.getState();
    expect(archivedEpics).toHaveLength(0);
    expect(epics.map((e) => e.id)).toEqual(["b", "a"]); // sorted: 1 before 2
  });

  it("applyEpicUpdate patches the epic in place in either list", () => {
    useEpicsStore.setState({
      epics: [makeEpic({ id: "e1", status: "open" })],
      archivedEpics: [makeEpic({ id: "e2", progress_percentage: 0 })],
    });
    useEpicsStore.getState().applyEpicUpdate("e1", { status: "in_progress" });
    useEpicsStore.getState().applyEpicUpdate("e2", { progress_percentage: 50 });

    expect(useEpicsStore.getState().getEpicById("e1")!.status).toBe(
      "in_progress",
    );
    expect(
      useEpicsStore.getState().getEpicById("e2")!.progress_percentage,
    ).toBe(50);
  });
});

describe("archive / unarchive API actions", () => {
  it("archiveEpic calls the API and moves the epic to the archived flow", async () => {
    useEpicsStore.setState({ epics: [makeEpic({ id: "e1" })] });
    mockEpicsApi.archive.mockResolvedValue({
      data: makeEpic({
        id: "e1",
        is_archived: true,
        archived_at: "2026-06-17",
      }),
    });

    await useEpicsStore.getState().archiveEpic("e1");

    expect(mockEpicsApi.archive).toHaveBeenCalledWith("e1");
    const { epics, archivedEpics, isArchiving } = useEpicsStore.getState();
    expect(epics).toHaveLength(0);
    expect(archivedEpics.map((e) => e.id)).toEqual(["e1"]);
    expect(isArchiving).toBe(false);
  });

  it("unarchiveEpic restores the epic to the active board", async () => {
    useEpicsStore.setState({
      archivedEpics: [makeEpic({ id: "e1", is_archived: true })],
    });
    mockEpicsApi.unarchive.mockResolvedValue({
      data: makeEpic({ id: "e1", is_archived: false }),
    });

    await useEpicsStore.getState().unarchiveEpic("e1");

    expect(mockEpicsApi.unarchive).toHaveBeenCalledWith("e1");
    const { epics, archivedEpics } = useEpicsStore.getState();
    expect(archivedEpics).toHaveLength(0);
    expect(epics.map((e) => e.id)).toEqual(["e1"]);
  });
});

describe("reorderEpic", () => {
  it("posts `position` and re-sorts the active board", async () => {
    useEpicsStore.setState({
      epics: [
        makeEpic({ id: "a", sort_order: 0 }),
        makeEpic({ id: "b", sort_order: 1 }),
      ],
    });
    mockEpicsApi.reorder.mockResolvedValue({
      data: makeEpic({ id: "b", sort_order: -1 }),
    });

    await useEpicsStore.getState().reorderEpic("b", 0);

    // Contract: the backend validates `position`, not `sort_order`.
    expect(mockEpicsApi.reorder).toHaveBeenCalledWith("b", 0);
    expect(useEpicsStore.getState().epics.map((e) => e.id)).toEqual(["b", "a"]);
  });
});

describe("decomposeEpic", () => {
  it("surfaces the running epic immediately", async () => {
    mockEpicsApi.decompose.mockResolvedValue({
      data: {
        epic: makeEpic({ id: "e9", decomposition_status: "running" }),
        session_id: "s1",
        status: "decomposing",
        message: "ok",
      },
    });

    const result = await useEpicsStore
      .getState()
      .decomposeEpic("p1", { title: "T", prd: "P", credential_id: "c1" });

    expect(result.session_id).toBe("s1");
    const { epics, isDecomposing } = useEpicsStore.getState();
    expect(epics.map((e) => e.id)).toContain("e9");
    expect(isDecomposing).toBe(false);
  });
});

describe("realtime subscribeRealtime", () => {
  it("archives in place on `.epic.updated` action=archived and tears down", () => {
    useEpicsStore.setState({ epics: [makeEpic({ id: "e1" })] });
    const teardown = useEpicsStore.getState().subscribeRealtime("p1");

    emitBus("epic:updated", {
      epic_id: "e1",
      action: "archived",
      title: "Epic",
      status: "open",
      progress_percentage: 0,
      timestamp: "2026-06-17T00:00:00Z",
    });

    expect(useEpicsStore.getState().epics).toHaveLength(0);
    expect(useEpicsStore.getState().archivedEpics.map((e) => e.id)).toEqual([
      "e1",
    ]);

    // After teardown the listeners no longer fire.
    teardown();
    useEpicsStore.setState({ epics: [makeEpic({ id: "e2" })] });
    emitBus("epic:updated", {
      epic_id: "e2",
      action: "archived",
      title: "Epic",
      status: "open",
      progress_percentage: 0,
      timestamp: "2026-06-17T00:00:00Z",
    });
    expect(useEpicsStore.getState().epics.map((e) => e.id)).toEqual(["e2"]);
  });

  it("patches decomposition state and maps completed_at → decomposed_at", () => {
    useEpicsStore.setState({
      epics: [makeEpic({ id: "e1", decomposition_status: "running" })],
    });
    mockEpicsApi.list.mockResolvedValue({ data: [] });
    const teardown = useEpicsStore.getState().subscribeRealtime("p1");

    emitBus("epic:decomposition", {
      epic_id: "e1",
      project_id: "p1",
      action: "completed",
      decomposition_status: "completed",
      decomposition_error: null,
      decomposition_completed_at: "2026-06-17T01:00:00Z",
      timestamp: "2026-06-17T01:00:00Z",
    });

    const epic = useEpicsStore.getState().getEpicById("e1")!;
    expect(epic.decomposition_status).toBe("completed");
    expect(epic.decomposed_at).toBe("2026-06-17T01:00:00Z");
    // `completed` triggers a refetch of the project's epics.
    expect(mockEpicsApi.list).toHaveBeenCalledWith("p1");
    teardown();
  });
});
