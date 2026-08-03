import DispatchIntegrationWebhookService from "../DispatchIntegrationWebhookService";

describe("DispatchIntegrationWebhookService", () => {
  it("posts the payload through the provided hardened client", async () => {
    const post = jest.fn().mockResolvedValue({ status: 204 });
    const payload = { message: { conversation: "test-only" } };

    await DispatchIntegrationWebhookService(
      "https://example.test/webhook",
      payload,
      { post } as any
    );

    expect(post).toHaveBeenCalledWith(
      "https://example.test/webhook",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
  });

  it("propagates asynchronous delivery failures", async () => {
    const failure = new Error("delivery failed");
    const post = jest.fn().mockRejectedValue(failure);

    await expect(
      DispatchIntegrationWebhookService(
        "https://example.test/webhook",
        {},
        { post } as any
      )
    ).rejects.toBe(failure);
  });

  it("blocks a private destination before opening a connection", async () => {
    await expect(
      DispatchIntegrationWebhookService("http://127.0.0.1/admin", {})
    ).rejects.toMatchObject({ code: "ERR_SSRF_BLOCKED" });
  });
});
