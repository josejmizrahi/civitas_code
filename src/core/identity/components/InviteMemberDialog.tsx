import { useState } from 'react'
import { useInviteMember } from '../hooks/useMembers'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { Copy, Mail } from 'lucide-react'
import { useRoles } from '@/core/identity/hooks/useRoles'
import { useI18n } from '@/shared/hooks/useI18n'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const inviteMember = useInviteMember()
  const { data: roles } = useRoles()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('miembro')
  const [error, setError] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const emailTrimmed = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailTrimmed) {
      setError(t('invite.emailRequired'))
      return
    }
    if (!emailRegex.test(emailTrimmed)) {
      setError(t('invite.emailInvalid'))
      return
    }
    try {
      const result = await inviteMember.mutateAsync({ email: emailTrimmed, role })
      setCreatedToken(result.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('invite.errorGeneric'))
    }
  }

  const handleCopyLink = async () => {
    if (createdToken) {
      const inviteLink = `${window.location.origin}/invite/${createdToken}`
      await navigator.clipboard.writeText(inviteLink)
    }
  }

  const handleClose = () => {
    setCreatedToken(null)
    setEmail('')
    setRole('miembro')
    setError('')
    onOpenChange(false)
  }

  const inviteLink = createdToken ? `${window.location.origin}/invite/${createdToken}` : ''

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose}>
        {createdToken ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('invite.sent')}</DialogTitle>
              <DialogDescription>
                {t('invite.sentDescription')} <strong>{email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
                <Mail className="h-5 w-5" />
                <span className="font-medium">{t('invite.emailSent')}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-link">{t('invite.linkLabel')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="invite-link"
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title={t('invite.copyLink')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                {t('invite.close')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('invite.title')}</DialogTitle>
              <DialogDescription>
                {t('invite.description')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="invite-email">{t('invite.emailLabel')}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="miembro@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">{t('invite.roleLabel')}</Label>
                  <Select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    {(roles ?? []).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t('invite.cancel')}
                </Button>
                <Button type="submit" disabled={inviteMember.isPending}>
                  {inviteMember.isPending ? t('invite.sending') : t('invite.send')}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
