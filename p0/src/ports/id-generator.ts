/**
 * Port for UUID v4 generation
 *
 * Injectable port for generating UUID v4 strings.
 * The domain receives UUIDs from this port and does not access global randomness.
 */

export interface UuidV4Generator {
  /**
   * Generates a new UUID v4 string
   * @returns UUID v4 in lowercase format
   */
  generate(): string;
}
