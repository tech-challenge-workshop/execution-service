import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import {
  InsufficientStockError,
  InvalidPartError,
  InvalidPriceError,
  PartNotFoundError,
} from '../../domain/errors/inventory.errors'

@Catch(InvalidPartError, InvalidPriceError, PartNotFoundError, InsufficientStockError)
export class InventoryExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status = this.statusFor(exception)

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    })
  }

  private statusFor(exception: Error): number {
    if (exception instanceof PartNotFoundError) {
      return HttpStatus.NOT_FOUND
    }
    if (exception instanceof InsufficientStockError) {
      return HttpStatus.CONFLICT
    }
    return HttpStatus.BAD_REQUEST
  }
}
