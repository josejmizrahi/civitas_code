import { describe, it, expect } from 'vitest'
import { hasPermission, ROLE_HIERARCHY } from '../index'
import type { Role } from '../index'

const ALL_ROLES: Role[] = ['platform_admin', 'admin', 'comite_vigilancia', 'tesorero', 'miembro', 'observador']

describe('ROLE_HIERARCHY', () => {
  it('platform_admin has highest value', () => {
    expect(ROLE_HIERARCHY.platform_admin).toBe(5)
  })

  it('admin is level 4', () => {
    expect(ROLE_HIERARCHY.admin).toBe(4)
  })

  it('tesorero and comite_vigilancia are level 3', () => {
    expect(ROLE_HIERARCHY.tesorero).toBe(3)
    expect(ROLE_HIERARCHY.comite_vigilancia).toBe(3)
  })

  it('miembro is level 2', () => {
    expect(ROLE_HIERARCHY.miembro).toBe(2)
  })

  it('observador is level 1', () => {
    expect(ROLE_HIERARCHY.observador).toBe(1)
  })

  it('hierarchy is strictly increasing for main chain', () => {
    expect(ROLE_HIERARCHY.observador).toBeLessThan(ROLE_HIERARCHY.miembro)
    expect(ROLE_HIERARCHY.miembro).toBeLessThan(ROLE_HIERARCHY.tesorero)
    expect(ROLE_HIERARCHY.tesorero).toBeLessThanOrEqual(ROLE_HIERARCHY.admin)
    expect(ROLE_HIERARCHY.admin).toBeLessThan(ROLE_HIERARCHY.platform_admin)
  })
})

describe('hasPermission', () => {
  it('platform_admin has permission for all roles', () => {
    for (const required of ALL_ROLES) {
      expect(hasPermission('platform_admin', required)).toBe(true)
    }
  })

  it('admin has permission for admin and below (not platform_admin)', () => {
    expect(hasPermission('admin', 'platform_admin')).toBe(false)
    for (const required of ALL_ROLES.filter(r => r !== 'platform_admin')) {
      expect(hasPermission('admin', required)).toBe(true)
    }
  })

  it('tesorero has permission for tesorero and below', () => {
    expect(hasPermission('tesorero', 'admin')).toBe(false)
    expect(hasPermission('tesorero', 'tesorero')).toBe(true)
    expect(hasPermission('tesorero', 'miembro')).toBe(true)
    expect(hasPermission('tesorero', 'observador')).toBe(true)
  })

  it('comite_vigilancia has permission for comite_vigilancia and below', () => {
    expect(hasPermission('comite_vigilancia', 'admin')).toBe(false)
    expect(hasPermission('comite_vigilancia', 'comite_vigilancia')).toBe(true)
    expect(hasPermission('comite_vigilancia', 'miembro')).toBe(true)
    expect(hasPermission('comite_vigilancia', 'observador')).toBe(true)
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

  it('same role always has permission (all 6 roles)', () => {
    for (const role of ALL_ROLES) {
      expect(hasPermission(role, role)).toBe(true)
    }
  })

  it('covers all 36 role-pair combinations with correct hierarchy', () => {
    for (const userRole of ALL_ROLES) {
      for (const requiredRole of ALL_ROLES) {
        const userLevel = ROLE_HIERARCHY[userRole]
        const requiredLevel = ROLE_HIERARCHY[requiredRole]
        expect(hasPermission(userRole, requiredRole)).toBe(userLevel >= requiredLevel)
      }
    }
  })
})
