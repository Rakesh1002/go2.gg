/**
 * Go2 TypeScript SDK
 *
 * Official SDK for the Go2 URL Shortener API.
 *
 * @example
 * ```typescript
 * import { Go2 } from '@go2/sdk';
 *
 * const go2 = new Go2({ apiKey: 'go2_xxx' });
 *
 * const link = await go2.links.create({
 *   destinationUrl: 'https://example.com',
 * });
 *
 * console.log(link.shortUrl);
 * ```
 */

export { Go2 } from "./client.js";
export { Go2Error } from "./error.js";
export * from "./types.js";
