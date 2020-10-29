import { Request, Response } from 'express';

interface CustomRequest extends Request {
  username: string;
}

export interface Context {
  req: CustomRequest;
  res: Response;
}
