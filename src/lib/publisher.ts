import { z, ZodError } from 'zod';

import { Result } from '../helper/result/result';

import { QueueChannel, Route } from './channel';

export type SafePublishOptions<MsgType extends z.ZodTypeAny> = {
  queue: QueueChannel;
  route: Route;
  schema: MsgType;
  message: z.infer<MsgType>;
  headers?: Record<string, string>;
};

/**
 * Strongly typed & validated publish.
 *
 * With this function you can publish a message to a certain `Route` while making sure the message you're sending is valid. This function will not
 * throw any error, instead it will returns a `Result` object that will either return the value or error depending on the value of
 * `success` returned by it.
 *
 * ### Example
 *
 * ```typescript
 * import z from "zod";
 * import { safePublish } from "@bitbybit-labs/amqp-lib/publisher";
 * import { Route } from "@bitbybit-labs/amqp-lib/publisher";
 *
 * await safePublish({
 *    schema: z.object({ ping: z.string() }),
 *    message: { ping: "yes" },
 *    // instantiated beforehand
 *    queue: queue,
 *    // the function will publish to "ping-exchange" through "pong" route
 *    route: { binding: "pong", exchange: { name: "ping-exchange", type: "fanout" }} as Route,
 *    // custom headers to be added to the message, you can add your metadata here
 *    headers: {'x-bitbybit-request-id': crypto.randomUUID() }
 * })
 *
 * ```
 * @param param0 params needed to publish the message to a Route
 * @returns `Result` of either `ZodError` or normal `Error`
 */
export const safePublish = async <MsgType extends z.ZodTypeAny>({
  schema,
  message,
  queue,
  route,
  headers,
}: Readonly<SafePublishOptions<MsgType>>): Promise<
  Result<undefined, ZodError | Error>
> => {
  const parseResult = schema.safeParse(message);

  if (!parseResult.success) return { success: false, error: parseResult.error };

  try {
    await queue.channel.publish(
      route.exchange.name,
      route.binding,
      Buffer.from(JSON.stringify(parseResult.data)),
      {
        contentType: 'application/json',
        headers: { ...headers },
      }
    );

    return { success: true, result: undefined };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err };
    else return { success: false, error: new Error(`Unknown error: ${err}`) };
  }
};
