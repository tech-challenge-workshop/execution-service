import {
  Execution,
  ExecutionStatus,
} from '../../../../src/modules/executions/domain/execution.entity'
import {
  InvalidExecutionError,
  InvalidExecutionTransitionError,
} from '../../../../src/modules/executions/domain/errors/execution.errors'
import { executionWith } from '../execution.fixtures'

describe('Execution', () => {
  it('starts queued with no diagnostics', () => {
    const execution = Execution.start('wo-1')
    expect(execution.status).toBe(ExecutionStatus.QUEUED)
    expect(execution.diagnostics).toHaveLength(0)
  })

  describe('addDiagnostic', () => {
    it('records a diagnostic and moves from QUEUED to IN_DIAGNOSIS', () => {
      const execution = executionWith()

      execution.addDiagnostic({ description: 'worn pads', details: { padMm: 1.5 } })

      expect(execution.status).toBe(ExecutionStatus.IN_DIAGNOSIS)
      expect(execution.diagnostics[0]).toMatchObject({
        description: 'worn pads',
        details: { padMm: 1.5 },
      })
    })

    it('rejects an empty description', () => {
      expect(() => executionWith().addDiagnostic({ description: '  ' })).toThrow(
        InvalidExecutionError,
      )
    })

    it('rejects a diagnostic on a terminal execution', () => {
      const execution = executionWith({ status: ExecutionStatus.COMPLETED })
      expect(() => execution.addDiagnostic({ description: 'x' })).toThrow(
        InvalidExecutionTransitionError,
      )
    })
  })

  describe('transitions', () => {
    it('goes through diagnosis, repair and completion', () => {
      const execution = executionWith()
      execution.addDiagnostic({ description: 'diag' })
      execution.startRepair()
      expect(execution.status).toBe(ExecutionStatus.IN_REPAIR)
      execution.complete()
      expect(execution.status).toBe(ExecutionStatus.COMPLETED)
    })

    it('rejects starting a repair from a terminal state', () => {
      expect(() => executionWith({ status: ExecutionStatus.COMPLETED }).startRepair()).toThrow(
        InvalidExecutionTransitionError,
      )
    })

    it('rejects completing from QUEUED', () => {
      expect(() => executionWith().complete()).toThrow(InvalidExecutionTransitionError)
    })

    it('fails from an active state but not from a terminal one', () => {
      const active = executionWith({ status: ExecutionStatus.IN_REPAIR })
      active.fail()
      expect(active.status).toBe(ExecutionStatus.FAILED)

      expect(() => executionWith({ status: ExecutionStatus.FAILED }).fail()).toThrow(
        InvalidExecutionTransitionError,
      )
    })
  })
})
