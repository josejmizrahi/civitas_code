import { useState } from 'react'
import { useInviteMember } from '../hooks/useMembers'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { CheckCircle, Copy } from 'lucide-react'
import type { Role } from '@/shared/types'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const inviteMember = useInviteMember()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('miembro')
  const [error, setError] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const result = await inviteMember.mutateAsync({ email, role })
      setCreatedToken(result.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar invitación')
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
              <DialogTitle>Invitación creada</DialogTitle>
              <DialogDescription>
                La invitación ha sido creada exitosamente. Comparte el enlace con el miembro.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Invitación creada</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-link">Enlace de invitación</Label>
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
                    title="Copiar enlace"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invitar Miembro</DialogTitle>
              <DialogDescription>
                Envía una invitación por correo electrónico para unirse a la comunidad.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Correo electrónico</Label>
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
                  <Label htmlFor="invite-role">Rol</Label>
                  <Select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                  >
                    <option value="miembro">Miembro</option>
                    <option value="tesorero">Tesorero</option>
                    <option value="observador">Observador</option>
                    <option value="admin">Administrador</option>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviteMember.isPending}>
                  {inviteMember.isPending ? 'Enviando...' : 'Enviar Invitación'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
