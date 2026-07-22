import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import {
  ExecutionNotFoundError,
  InvalidExecutionError,
  InvalidExecutionTransitionError,
} from '../../domain/errors/execution.errors'

@Catch(ExecutionNotFoundError, InvalidExecutionError, InvalidExecutionTransitionError)
export class ExecutionExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status =
      exception instanceof ExecutionNotFoundError ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    })
  }
}
