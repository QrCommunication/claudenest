import {
  handleAttentionNotification,
  useAttentionStore,
} from "./attentionStore";

beforeEach(() => {
  useAttentionStore.setState({ bySession: {} });
});

describe("attentionStore", () => {
  it("marks and clears a session", () => {
    useAttentionStore.getState().markAttention("s1", "warning");
    expect(useAttentionStore.getState().bySession.s1).toBe("warning");

    useAttentionStore.getState().clearAttention("s1");
    expect(useAttentionStore.getState().bySession.s1).toBeUndefined();
  });

  it("is a no-op when clearing an unknown session (same reference)", () => {
    const before = useAttentionStore.getState().bySession;
    useAttentionStore.getState().clearAttention("nope");
    expect(useAttentionStore.getState().bySession).toBe(before);
  });
});

describe("handleAttentionNotification", () => {
  it("ignores informational types (info, success)", () => {
    handleAttentionNotification({
      session_id: "s1",
      notification_type: "info",
    });
    handleAttentionNotification({
      session_id: "s2",
      notification_type: "success",
    });
    expect(useAttentionStore.getState().bySession).toEqual({});
  });

  it("marks attention-worthy types (warning, needs_input, free-form)", () => {
    handleAttentionNotification({
      session_id: "s1",
      notification_type: "warning",
    });
    handleAttentionNotification({
      session_id: "s2",
      notification_type: "needs_input",
    });
    handleAttentionNotification({
      session_id: "s3",
      notification_type: "coordinator_spawned",
    });
    expect(useAttentionStore.getState().bySession).toEqual({
      s1: "warning",
      s2: "needs_input",
      s3: "coordinator_spawned",
    });
  });

  it("defaults a missing type to info (ignored)", () => {
    handleAttentionNotification({ session_id: "s1" });
    expect(useAttentionStore.getState().bySession).toEqual({});
  });

  it("ignores payloads without a session_id", () => {
    handleAttentionNotification({ notification_type: "warning" });
    handleAttentionNotification(null);
    handleAttentionNotification(undefined);
    expect(useAttentionStore.getState().bySession).toEqual({});
  });
});
