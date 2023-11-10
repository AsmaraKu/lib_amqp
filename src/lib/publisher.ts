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
