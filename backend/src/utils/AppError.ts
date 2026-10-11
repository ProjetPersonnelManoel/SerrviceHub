// Erreur métier avec un code HTTP, traitée par errorHandler
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
