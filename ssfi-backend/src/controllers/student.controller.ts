import { Request, Response, NextFunction } from 'express';
import * as studentService from '../services/student.service';

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.getAllStudents(req.query);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.getStudentById(Number(req.params.id));
    if (!result) {
      return res.status(404).json({ status: 'fail', message: 'Student not found' });
    }
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const updateStudentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const result = await studentService.updateStudentStatus(Number(id), status, remarks);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.createStudent(req.body);
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.deleteStudent(Number(req.params.id));
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}
