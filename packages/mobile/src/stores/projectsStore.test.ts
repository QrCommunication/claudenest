/**
 * projectsStore — showArchived toggle + fetchTasks honoring it. The `api`,
 * `websocket` and `orchestratorStore` modules are mocked so the store logic is
 * exercised in isolation (node env, no network/Reverb). Tasks live in
 * projectsStore (there is no separate mobile tasksStore), so the task lists AND
 * the counts derived from the `tasks` array both follow this single flag.
 */

import type { SharedTask } from "@/types";

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
// Self-contained factory (jest hoists jest.mock above the imports). projectsStore
// imports projectsApi/tasksApi/locksApi — stub them all; only tasksApi.list is
// asserted here.
jest.mock("@/services/api", () => ({
  projectsApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  tasksApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    claim: jest.fn(),
    release: jest.fn(),
    get: jest.fn(),
    complete: jest.fn(),
  },
  locksApi: {
    list: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    forceDelete: jest.fn(),
  },
}));

const mockTasksApi = (
  jest.requireMock("@/services/api") as {
    tasksApi: Record<string, jest.Mock>;
  }
).tasksApi;

// ── Mock the websocket service (subscribeToProject wiring) ────────────────────
jest.mock("@/services/websocket", () => ({
  websocket: {
    on: jest.fn(() => () => undefined),
    subscribeToProject: jest.fn(),
    unsubscribeFromProject: jest.fn(),
  },
}));

// ── Mock the orchestratorStore (transitive import via subscribeToProject) ─────
jest.mock("./orchestratorStore", () => ({
  useOrchestratorStore: { getState: jest.fn(() => ({})) },
}));

import { useProjectsStore } from "./projectsStore";

const makeTask = (overrides: Partial<SharedTask> = {}): SharedTask =>
  ({
    id: "t1",
    projectId: "p1",
    title: "Task",
    status: "pending",
    priority: "medium",
    ...overrides,
  }) as SharedTask;

const reset = (): void =>
  useProjectsStore.setState({
    tasks: [],
    showArchived: false,
    error: null,
  });

beforeEach(() => {
  reset();
  jest.clearAllMocks();
});

describe("showArchived toggle", () => {
  it("sets and toggles the flag", () => {
    const s = useProjectsStore.getState();
    expect(s.showArchived).toBe(false);
    s.setShowArchived(true);
    expect(useProjectsStore.getState().showArchived).toBe(true);
    s.toggleShowArchived();
    expect(useProjectsStore.getState().showArchived).toBe(false);
  });
});

describe("fetchTasks honors showArchived", () => {
  it("passes archived:false by default and replaces only this project's tasks", async () => {
    useProjectsStore.setState({
      tasks: [makeTask({ id: "x", projectId: "p2" })],
    });
    mockTasksApi.list.mockResolvedValue({
      data: [makeTask({ id: "t1", projectId: "p1" })],
    });

    await useProjectsStore.getState().fetchTasks("p1");

    expect(mockTasksApi.list).toHaveBeenCalledWith("p1", { archived: false });
    const tasks = useProjectsStore.getState().tasks;
    expect(tasks.map((t) => t.id).sort()).toEqual(["t1", "x"]);
  });

  it("passes archived:true when showArchived is on (reveal filter)", async () => {
    useProjectsStore.setState({ showArchived: true });
    mockTasksApi.list.mockResolvedValue({ data: [] });

    await useProjectsStore.getState().fetchTasks("p1");

    expect(mockTasksApi.list).toHaveBeenCalledWith("p1", { archived: true });
  });

  it("toggling showArchived then refetching changes the revealed set (counts follow the list)", async () => {
    // Hidden (default): only the non-archived task.
    mockTasksApi.list.mockResolvedValueOnce({
      data: [makeTask({ id: "a", projectId: "p1", status: "pending" })],
    });
    await useProjectsStore.getState().fetchTasks("p1");
    expect(useProjectsStore.getState().getProjectTasks("p1")).toHaveLength(1);

    // Revealed: the archived-epic task now appears, so list-derived counts grow.
    useProjectsStore.getState().setShowArchived(true);
    mockTasksApi.list.mockResolvedValueOnce({
      data: [
        makeTask({ id: "a", projectId: "p1", status: "pending" }),
        makeTask({ id: "b", projectId: "p1", status: "done" }),
      ],
    });
    await useProjectsStore.getState().fetchTasks("p1");

    const tasks = useProjectsStore.getState().getProjectTasks("p1");
    expect(tasks).toHaveLength(2);
    expect(tasks.filter((t) => t.status !== "done")).toHaveLength(1);
  });
});
