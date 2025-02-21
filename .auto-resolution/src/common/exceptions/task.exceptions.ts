import { HttpException, HttpStatus } from '@nestjs/common';

export class TaskNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Task with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class CategoryNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Category with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class WeekPlanNotFoundException extends HttpException {
  constructor(id: string) {
    super(`WeekPlan with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InvalidDateException extends HttpException {
  constructor() {
    super('Invalid date format provided', HttpStatus.BAD_REQUEST);
  }
}
