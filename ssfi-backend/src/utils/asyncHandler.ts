import { Response, NextFunction } from 'express';

type AsyncFunction = (req: any, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps async route handlers to catch errors and pass to next()
 */
export const asyncHandler = (fn: AsyncFunction) => {
    return (req: any, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
