export const RESIDENTIAL_DEFAULTS = {
  communityType: 'residential' as const,
  defaultCategories: [
    { name: 'Cuota de mantenimiento', type: 'income' },
    { name: 'Cuota extraordinaria', type: 'income' },
    { name: 'Mantenimiento general', type: 'expense' },
    { name: 'Agua', type: 'expense' },
    { name: 'Luz áreas comunes', type: 'expense' },
    { name: 'Seguridad', type: 'expense' },
    { name: 'Jardinería', type: 'expense' },
    { name: 'Limpieza', type: 'expense' },
    { name: 'Fondo de reserva', type: 'expense' },
    { name: 'Reparaciones', type: 'expense' },
  ],
  defaultRoles: ['admin', 'tesorero', 'miembro', 'observador'] as const,
  unitAttributes: ['floor', 'tower', 'indiviso_pct', 'area_m2'] as const,
}
