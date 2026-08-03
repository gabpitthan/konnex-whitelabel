import { externalRestrictedJsonClient } from "../../libs/httpClients";

interface WebhookClient {
  post: (
    url: string,
    payload: unknown,
    config: { headers: { "Content-Type": string } }
  ) => Promise<unknown>;
}

const DispatchIntegrationWebhookService = async (
  url: string,
  payload: unknown,
  client: WebhookClient = externalRestrictedJsonClient
): Promise<void> => {
  await client.post(url, payload, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export default DispatchIntegrationWebhookService;
