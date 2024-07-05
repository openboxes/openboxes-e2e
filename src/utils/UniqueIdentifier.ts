import ShortUniqueId from 'short-unique-id';

type UniqueIdentifierProps = {
  prefix?: string;
  hashLength?: number;
  separator?: string;
};

/**
 * Class representing a unique identifier generator.
 * This class helps generate unique identifiers
 */
class UniqueIdentifier {
  private prefix: string;
  private separator: string;
  private hash: string;

  /**
   * Creates an instance of UniqueIdentifier.
   * @param {UniqueIdentifierProps} [options] - Configuration options for the identifier.
   * @param {string} [options.prefix='E2E'] - The prefix to be used in the identifier.
   * @param {number} [options.hashLength=6] - The length of the hash segment in the identifier.
   * @param {string} [options.separator='-'] - The separator between the prefix, input string, and hash.
   */
  constructor(options?: UniqueIdentifierProps) {
    this.prefix = options?.prefix || 'E2E';
    this.separator = options?.separator || '-';
    const hashLength = options?.hashLength || 6;
    const { randomUUID } = new ShortUniqueId({ length: hashLength });
    this.hash = randomUUID();
  }

  /**
   * Generates a unique string by combining the prefix, a custom string, and a hash.
   * @param {string} str - The string to be included in the generated identifier.
   * @returns {string} The generated unique identifier.
   */
  generateUniqueString(str: string): string {
    return [this.prefix, str, this.hash].filter(Boolean).join(this.separator);
  }
}

export default UniqueIdentifier;
