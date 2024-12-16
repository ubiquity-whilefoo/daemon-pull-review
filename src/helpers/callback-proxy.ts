import { PullReviewer } from "../handlers/pull-reviewer";
import { Context, SupportedEvents } from "../types";
import { CallbackResult, ProxyCallbacks } from "../types/proxy";

/**
 * The `callbacks` object defines an array of callback functions for each supported event type.
 *
 * Since multiple callbacks might need to be executed for a single event, we store each
 * callback in an array. This design allows for extensibility and flexibility, enabling
 * us to add more callbacks for a particular event without modifying the core logic.
 */
const callbacks = {
  "pull_request.opened": [(context: Context) => new PullReviewer(context).performPullPrecheck()],
  "pull_request.ready_for_review": [(context: Context) => new PullReviewer(context).performPullPrecheck()],
} as ProxyCallbacks;

export async function callCallbacks(context: Context, eventName: SupportedEvents): Promise<CallbackResult> {
  if (!callbacks[eventName]) {
    context.logger.info(`No callbacks found for event ${eventName}`);
    return { status: 204, reason: "skipped" };
  }

  return (await Promise.all(callbacks[eventName].map((callback) => handleCallback(callback, context))))[0];
}

/**
 * Why do we need this wrapper function?
 *
 * By using a generic `Function` type for the callback parameter, we bypass strict type
 * checking temporarily. This allows us to pass a standard `Context` object, which we know
 * contains the correct event and payload types, to the callback safely.
 *
 * We can trust that the `ProxyCallbacks` type has already ensured that each callback function
 * matches the expected event and payload types, so this function provides a safe and
 * flexible way to handle callbacks without introducing type or logic errors.
 *
 * In this updated version, the callbacks are arrow functions that instantiate the PullReviewer
 * class and call its methods, rather than standalone functions.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function handleCallback(callback: Function, context: Context) {
  return callback(context);
}
