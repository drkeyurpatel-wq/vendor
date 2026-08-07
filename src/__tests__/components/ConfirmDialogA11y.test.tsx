import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider, useConfirm } from '@/components/ui/ConfirmProvider'

function Harness() {
  const confirm = useConfirm()
  return (
    <>
      <button onClick={() => confirm({ title: 'Delete PO', description: 'Cannot be undone.' })}>
        open
      </button>
      <button>outside</button>
    </>
  )
}

function renderHarness() {
  return render(
    <ConfirmProvider>
      <Harness />
    </ConfirmProvider>
  )
}

describe('ConfirmDialog accessibility', () => {
  it('exposes the dialog role and modal state', async () => {
    const user = userEvent.setup()
    renderHarness()
    await user.click(screen.getByRole('button', { name: 'open' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('labels the dialog with its own title', async () => {
    const user = userEvent.setup()
    renderHarness()
    await user.click(screen.getByRole('button', { name: 'open' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('Delete PO')
  })

  it('describes the dialog with its body text', async () => {
    const user = userEvent.setup()
    renderHarness()
    await user.click(screen.getByRole('button', { name: 'open' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleDescription('Cannot be undone.')
  })

  it('moves focus into the dialog when it opens', async () => {
    const user = userEvent.setup()
    renderHarness()
    await user.click(screen.getByRole('button', { name: 'open' }))

    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))
  })

  // Without a trap, Tab walks out of the dialog and into the page behind it,
  // so a keyboard user can "confirm" a destructive action they cannot see.
  it('keeps Tab inside the dialog', async () => {
    const user = userEvent.setup()
    renderHarness()
    await user.click(screen.getByRole('button', { name: 'open' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))

    for (let i = 0; i < 6; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
  })

  it('keeps Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup()
    renderHarness()
    await user.click(screen.getByRole('button', { name: 'open' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))

    for (let i = 0; i < 6; i++) {
      await user.tab({ shift: true })
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
  })

  it('returns focus to the trigger after closing', async () => {
    const user = userEvent.setup()
    renderHarness()
    const trigger = screen.getByRole('button', { name: 'open' })

    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})
