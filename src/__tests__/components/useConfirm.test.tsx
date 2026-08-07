import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider, useConfirm } from '@/components/ui/ConfirmProvider'

/**
 * Harness that exercises the promise-based confirm API the way real call
 * sites do: `const ok = await confirm({...})`, then branch on the result.
 */
function Harness({ onResult }: { onResult: (ok: boolean) => void }) {
  const confirm = useConfirm()
  return (
    <button
      onClick={async () => {
        const ok = await confirm({
          title: 'Delete draft PO',
          description: 'This action cannot be undone.',
          confirmLabel: 'Delete',
          confirmVariant: 'danger',
        })
        onResult(ok)
      }}
    >
      trigger
    </button>
  )
}

function renderHarness(onResult: (ok: boolean) => void) {
  return render(
    <ConfirmProvider>
      <Harness onResult={onResult} />
    </ConfirmProvider>
  )
}

describe('useConfirm', () => {
  it('renders nothing until confirm() is called', () => {
    renderHarness(() => {})
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the supplied title and description', async () => {
    const user = userEvent.setup()
    renderHarness(() => {})

    await user.click(screen.getByRole('button', { name: 'trigger' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Delete draft PO')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('resolves true when the confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onResult = jest.fn()
    renderHarness(onResult)

    await user.click(screen.getByRole('button', { name: 'trigger' }))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
  })

  it('resolves false when cancelled', async () => {
    const user = userEvent.setup()
    const onResult = jest.fn()
    renderHarness(onResult)

    await user.click(screen.getByRole('button', { name: 'trigger' }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
  })

  it('resolves false when dismissed with Escape', async () => {
    const user = userEvent.setup()
    const onResult = jest.fn()
    renderHarness(onResult)

    await user.click(screen.getByRole('button', { name: 'trigger' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
  })

  it('closes the dialog after resolving', async () => {
    const user = userEvent.setup()
    renderHarness(() => {})

    await user.click(screen.getByRole('button', { name: 'trigger' }))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('supports sequential confirms from a single handler', async () => {
    const user = userEvent.setup()
    const seen: string[] = []

    function Sequential() {
      const confirm = useConfirm()
      return (
        <button
          onClick={async () => {
            if (!(await confirm({ title: 'First', description: 'step one' }))) return
            seen.push('first')
            if (!(await confirm({ title: 'Second', description: 'step two' }))) return
            seen.push('second')
          }}
        >
          go
        </button>
      )
    }

    render(
      <ConfirmProvider>
        <Sequential />
      </ConfirmProvider>
    )

    await user.click(screen.getByRole('button', { name: 'go' }))
    expect(await screen.findByText('First')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('Second')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(seen).toEqual(['first', 'second']))
  })

  it('halts a sequence when an intermediate step is cancelled', async () => {
    const user = userEvent.setup()
    const seen: string[] = []

    function Sequential() {
      const confirm = useConfirm()
      return (
        <button
          onClick={async () => {
            if (!(await confirm({ title: 'First', description: 'step one' }))) return
            seen.push('first')
            if (!(await confirm({ title: 'Second', description: 'step two' }))) return
            seen.push('second')
          }}
        >
          go
        </button>
      )
    }

    render(
      <ConfirmProvider>
        <Sequential />
      </ConfirmProvider>
    )

    await user.click(screen.getByRole('button', { name: 'go' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))
    expect(await screen.findByText('Second')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(seen).toEqual(['first']))
  })

  it('throws a clear error when used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function Orphan() {
      useConfirm()
      return null
    }
    expect(() => render(<Orphan />)).toThrow(/ConfirmProvider/)
    spy.mockRestore()
  })
})
