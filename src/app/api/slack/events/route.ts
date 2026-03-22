import { getReceiver } from "@/lib/bolt/app";

// Single POST endpoint for all Slack events, commands, and interactions.
// The VercelReceiver handles verification and routing internally.
export async function POST(request: Request): Promise<Response> {
  const receiver = getReceiver();
  const handler = receiver.toHandler();
  return handler(request);
}
