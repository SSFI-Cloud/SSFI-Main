import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/event.service';

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await eventService.getAllEvents(req.query, req.user);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    }
    const result = await eventService.createEvent(req.body, userId);
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id;
    let result;

    if (!isNaN(Number(idParam))) {
      result = await eventService.getEventById(Number(idParam));
    } else {
      result = await eventService.getEventByCode(idParam);
    }

    if (!result) {
      return res.status(404).json({ status: 'fail', message: 'Event not found' });
    }
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const updateEventStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // status: PUBLISHED, REJECTED, etc.
    const result = await eventService.updateEventStatus(Number(id), status, remarks);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const getMyEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    }
    const result = await eventService.getUserEvents(userId, req.query);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query.upcoming = 'true';
    const result = await eventService.getAllEvents(req.query, req.user);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    }

    const result = await eventService.updateEvent(Number(id), req.body, userId, userRole);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
