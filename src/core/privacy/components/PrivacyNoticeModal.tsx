import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { ScrollText, Shield, FileText, Mail } from 'lucide-react'

interface PrivacyNoticeModalProps {
  open: boolean
  onAccept: () => void
  onClose: () => void
  communityName?: string
}

export function PrivacyNoticeModal({ open, onAccept, onClose, communityName }: PrivacyNoticeModalProps) {
  const responsibleParty = communityName
    ? `Ryve Platform / ${communityName}`
    : 'Ryve Platform'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-2xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ScrollText className="h-5 w-5" />
            Aviso de Privacidad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm leading-relaxed">
          {/* Art. 15 I — Identity of the responsible party */}
          <section>
            <h3 className="flex items-center gap-2 font-semibold text-base mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Identidad del Responsable
            </h3>
            <p>
              <strong>{responsibleParty}</strong> (en adelante, "el Responsable") es el encargado
              del tratamiento de sus datos personales de conformidad con la Ley Federal de
              Protecci&oacute;n de Datos Personales en Posesi&oacute;n de los Particulares (LFPDPPP).
            </p>
          </section>

          {/* Art. 15 II — Personal data collected */}
          <section>
            <h3 className="flex items-center gap-2 font-semibold text-base mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Datos Personales Recabados
            </h3>
            <p className="mb-2">
              Para las finalidades se&ntilde;aladas en el presente aviso de privacidad, se recaban
              los siguientes datos personales:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Nombre completo</li>
              <li>Correo electr&oacute;nico</li>
              <li>Tel&eacute;fono (opcional)</li>
              <li>Informaci&oacute;n de membres&iacute;a en la comunidad</li>
            </ul>
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="font-medium text-amber-800 mb-1">Datos Sensibles</p>
              <p className="text-amber-700">
                Se recaba informaci&oacute;n sobre su situaci&oacute;n financiera dentro de la comunidad
                (estado de pagos y cuotas). Estos datos son considerados sensibles de acuerdo con la LFPDPPP
                y requieren su consentimiento expreso.
              </p>
            </div>
          </section>

          {/* Art. 15 III — Purposes */}
          <section>
            <h3 className="font-semibold text-base mb-2">Finalidades del Tratamiento</h3>
            <p className="mb-2"><strong>Finalidades primarias (necesarias):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Gobernanza comunitaria: votaciones, propuestas y delegaciones</li>
              <li>Gesti&oacute;n financiera: registro de cuotas, pagos y presupuestos</li>
              <li>Comunicaci&oacute;n entre miembros de la comunidad</li>
              <li>Administraci&oacute;n de membres&iacute;as y roles</li>
              <li>Generaci&oacute;n de censos e informes comunitarios</li>
            </ul>
            <p className="mt-3 mb-2"><strong>Finalidades secundarias (opcionales):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Env&iacute;o de notificaciones y comunicaciones de la plataforma</li>
              <li>An&aacute;lisis estad&iacute;stico de uso para mejorar la plataforma</li>
            </ul>
          </section>

          {/* Art. 15 IV — Mechanisms for ARCO rights */}
          <section>
            <h3 className="flex items-center gap-2 font-semibold text-base mb-2">
              <Mail className="h-4 w-4 text-blue-600" />
              Derechos ARCO
            </h3>
            <p>
              Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de
              sus datos personales (derechos ARCO), conforme a los art&iacute;culos 21 a 34 de la LFPDPPP.
            </p>
            <p className="mt-2">
              Para ejercer sus derechos ARCO, puede utilizar el panel de
              "Datos y Privacidad" disponible en su perfil dentro de la plataforma. Las solicitudes
              ser&aacute;n atendidas en un plazo m&aacute;ximo de 20 d&iacute;as h&aacute;biles.
            </p>
          </section>

          {/* Art. 15 V — Procedure for revoking consent */}
          <section>
            <h3 className="font-semibold text-base mb-2">Revocaci&oacute;n del Consentimiento</h3>
            <p>
              Usted puede revocar su consentimiento para el tratamiento de sus datos personales
              en cualquier momento a trav&eacute;s del panel de "Datos y Privacidad" en su perfil,
              o mediante una solicitud ARCO de tipo "Oposici&oacute;n". La revocaci&oacute;n del
              consentimiento puede implicar la imposibilidad de continuar utilizando los servicios
              de la plataforma.
            </p>
          </section>

          {/* Art. 15 VI — Procedure for communicating changes */}
          <section>
            <h3 className="font-semibold text-base mb-2">Cambios al Aviso de Privacidad</h3>
            <p>
              El Responsable se reserva el derecho de efectuar en cualquier momento modificaciones
              al presente aviso de privacidad. Dichas modificaciones ser&aacute;n notificadas a
              trav&eacute;s de la plataforma y requerir&aacute;n nuevamente su consentimiento expreso
              para continuar utilizando los servicios.
            </p>
          </section>

          {/* Art. 15 VII — Use of tracking technologies */}
          <section>
            <h3 className="font-semibold text-base mb-2">Tecnolog&iacute;as de Rastreo</h3>
            <p>
              La plataforma utiliza cookies y almacenamiento local del navegador &uacute;nicamente
              para mantener su sesi&oacute;n activa y preferencias de configuraci&oacute;n.
              No se utilizan cookies de rastreo de terceros ni tecnolog&iacute;as de seguimiento
              con fines publicitarios.
            </p>
          </section>

          {/* Last updated */}
          <div className="border-t pt-3 text-xs text-muted-foreground">
            &Uacute;ltima actualizaci&oacute;n: 17 de febrero de 2025. Versi&oacute;n: 2025-02-17.
          </div>
        </div>

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onAccept}>
            Acepto el Aviso de Privacidad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
