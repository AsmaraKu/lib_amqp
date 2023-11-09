/**
 * Check a singular AMQP connection URL.
 *
 * @param url AMQP connection URL
 * @returns true if valid
 */
const isSingularAmqpUrlValid = (url: Readonly<string>) => {
  try {
    const parsedUrl = new URL(url);
    const isProtocolAmqp = parsedUrl.protocol === 'amqp:';

    // NOTE(fauh45): could add more test here, for now seems like sufficient

    return isProtocolAmqp;
  } catch (error) {
    // NOTE(fauh45): need to catch invalid URL, as invalid URL will throw TypeError
    return false;
  }
};

/**
 * AMQP connection URL checker.
 *
 * It will do basic validation of the AMQP connection URL.
 *
 * @param url AMQP connection URL
 * @returns true if valid
 */
export const isAmqpUrlValid = (url: Readonly<string | string[]>): boolean => {
  if (typeof url === 'string') return isSingularAmqpUrlValid(url);

  // NOTE(fauh45): Check every one of the function, returns false if there's even one that's not valid
  return url.every((u) => isSingularAmqpUrlValid(u));
};
