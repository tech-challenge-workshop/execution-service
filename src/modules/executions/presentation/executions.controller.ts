import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../../shared/auth/roles.decorator'
import { UserRole } from '../../../shared/auth/jwt-payload'
import { MESSAGE_BUS } from '../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../shared/messaging/message-bus'
import { SagaMessage } from '../../../shared/messaging/saga-messages'
import { AddDiagnosticUseCase } from '../application/use-cases/add-diagnostic.use-case'
import { StartRepairUseCase } from '../application/use-cases/start-repair.use-case'
import { CompleteExecutionUseCase } from '../application/use-cases/complete-execution.use-case'
import { FailExecutionUseCase } from '../application/use-cases/fail-execution.use-case'
import { GetExecutionUseCase } from '../application/use-cases/get-execution.use-case'
import { ListExecutionsUseCase } from '../application/use-cases/list-executions.use-case'
import { AddDiagnosticDto } from './dtos/add-diagnostic.dto'
import { ListExecutionsQuery } from './dtos/list-executions.query'
import { ExecutionExceptionFilter } from './filters/execution-exception.filter'

@ApiTags('executions')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseFilters(ExecutionExceptionFilter)
@Controller('executions')
export class ExecutionsController {
  constructor(
    @Inject(MESSAGE_BUS)
    private readonly bus: MessageBus,
    private readonly addDiagnostic: AddDiagnosticUseCase,
    private readonly startRepair: StartRepairUseCase,
    private readonly completeExecution: CompleteExecutionUseCase,
    private readonly failExecution: FailExecutionUseCase,
    private readonly getExecution: GetExecutionUseCase,
    private readonly listExecutions: ListExecutionsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the execution queue' })
  list(@Query() query: ListExecutionsQuery) {
    return this.listExecutions.execute(query)
  }

  @Get(':workOrderId')
  @ApiOperation({ summary: 'Get an execution with its diagnostics' })
  get(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    return this.getExecution.execute(workOrderId)
  }

  @Post(':workOrderId/diagnostics')
  @ApiOperation({ summary: 'Record a diagnostic finding' })
  diagnose(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Body() dto: AddDiagnosticDto,
  ) {
    return this.addDiagnostic.execute({ workOrderId, ...dto })
  }

  @Post(':workOrderId/start-repair')
  @ApiOperation({ summary: 'Move the execution to the repair stage' })
  repair(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    return this.startRepair.execute(workOrderId)
  }

  @Post(':workOrderId/complete')
  @ApiOperation({ summary: 'Complete the execution, consume parts and notify the saga' })
  async complete(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    const output = await this.completeExecution.execute(workOrderId)
    await this.bus.publish(SagaMessage.ExecutionCompleted, { workOrderId })
    return output
  }

  @Post(':workOrderId/fail')
  @ApiOperation({ summary: 'Fail the execution and notify the saga (triggers compensation)' })
  async fail(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    const output = await this.failExecution.execute(workOrderId)
    await this.bus.publish(SagaMessage.ExecutionFailed, { workOrderId })
    return output
  }
}
