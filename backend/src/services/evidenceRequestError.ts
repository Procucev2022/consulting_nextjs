/**
 * Error raised by evidence request handling. The router maps it to a JSON response with the
 * HTTP status and error category it carries.
 */

export class EvidenceRequestError extends Error {
  public readonly status: number;
  public readonly category: string;
  public readonly details: readonly unknown[] | undefined;

  constructor(status: number, category: string, message: string, details?: readonly unknown[]) {
    super(message);
    this.name = 'EvidenceRequestError';
    this.status = status;
    this.category = category;
    this.details = details;
  }
}
