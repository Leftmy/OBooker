// Augment Express Request to carry authenticated user payload
declare namespace Express {
  interface Request {
    user?: {
      id: string;
    };
  }
}
