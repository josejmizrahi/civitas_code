export const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Admin Plataforma',
  admin: 'Administrador',
  tesorero: 'Tesorero',
  comite_vigilancia: 'Comité de Vigilancia',
  miembro: 'Miembro',
  observador: 'Observador',
}

export const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'success'> = {
  platform_admin: 'default',
  admin: 'default',
  tesorero: 'success',
  comite_vigilancia: 'secondary',
  miembro: 'secondary',
  observador: 'outline',
}

export const STANDING_LABELS: Record<string, string> = {
  good_standing: 'Al corriente',
  grace_period: 'Período de gracia',
  delinquent: 'Moroso',
  moroso: 'Moroso',
}

export const STANDING_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  good_standing: 'success',
  grace_period: 'warning',
  delinquent: 'destructive',
  moroso: 'destructive',
}
