import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    logger.warn('Service worker registration failed')
    return null
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function subscribeToPush(memberId: string): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY) {
    logger.warn('VAPID public key not configured')
    return false
  }

  const registration = await registerServiceWorker()
  if (!registration) return false

  const granted = await requestPushPermission()
  if (!granted) return false

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const sub = subscription.toJSON()

    await (supabase.from('push_subscriptions') as any).upsert(
      {
        member_id: memberId,
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: sub.keys || {},
      },
      { onConflict: 'user_id,endpoint' }
    )

    return true
  } catch {
    logger.warn('Push subscription failed')
    return false
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker?.ready
  if (!registration) return

  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await subscription.unsubscribe()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await (supabase.from('push_subscriptions') as any)
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', subscription.endpoint)
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription
  } catch {
    return false
  }
}
