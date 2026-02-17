import { describe, it, expect } from 'vitest'
import { hasPermission, ROLE_HIERARCHY } from '../index'
import type { Role } from '../index'

describe('ROLE_HIERARCHY', () => {
  it('admin has highest value', () => {
    expect(ROLE_HIERARCHY.admin).toBe(4)
  })

  it('tesorero is level 3', () => {
    expect(ROLE_HIERARCHY.tesorero).toBe(3)
  })

  it('miembro is level 2', () => {
    expect(ROLE_HIERARCHY.miembro).toBe(2)
  })

  it('observador is level 1', () => {
    expect(ROLE_HIERARCHY.observador).toBe(1)
  })

  it('hierarchy is strictly increasing', () => {
    expect(ROLE_HIERARCHY.observador).toBeLessThan(ROLE_HIERARCHY.miembro)
    expect(ROLE_HIERARCHY.miembro).toBeLessThan(ROLE_HIERARCHY.tesorero)
    expect(ROLE_HIERARCHY.tesorero).toBeLessThan(ROLE_HIERARCHY.admin)
  })
})

describe('hasPermission', () => {
  it('admin has permission for all roles', () => {
    const roles: Role[] = ['admin', 'tesorero', 'miembro', 'observador']
    for (const required of roles) {
      expect(hasPermission('admin', required)).toBe(true)
    }
  })

  it('tesorero has permission for tesorero and below', () => {
    expect(hasPermission('tesorero', 'admin')).toBe(false)
    expect(hasPermission('tesorero', 'tesorero')).toBe(true)
    expect(hasPermission('tesorero', 'miembro')).toBe(true)
    expect(hasPermission('tesorero', 'observador')).toBe(true)
  })

  it('miembro has permission for miembro and observador', () => {
    expect(hasPermission('miembro', 'admin')).toBe(false)
    expect(hasPermission('miembro', 'tesorero')).toBe(false)
    expect(hasPermission('miembro', 'miembro')).toBe(true)
    expect(hasPermission('miembro', 'observador')).toBe(true)
  })

  it('observador only has permission for observador', () => {
    expect(hasPermission('observador', 'admin')).toBe(false)
    expect(hasPermission('observador', 'tesorero')).toBe(false)
    expect(hasPermission('observador', 'miembro')).toBe(false)
    expect(hasPermission('observador', 'observador')).toBe(true)
  })

  it('same role always has permission', () => {
    const roles: Role[] = ['admin', 'tesorero', 'miembro', 'observador']
    for (const role of roles) {
      expect(hasPermission(role, role)).toBe(true)
    }
  })
})
