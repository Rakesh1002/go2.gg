/**
 * Go2 SDK Error
 */

export class Go2Error extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "Go2Error";
    this.status = status;
    this.code = code;
  }
}
