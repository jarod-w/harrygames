import type { Route } from '../app/route'
import type { Player } from '../data/types'
import { isResting } from './curfew'

const PLAY: Route['name'][] = ['hub', 'classroom', 'boss', 'houseCup', 'pensieve', 'shop', 'review']

export function isPlayRoute(route: Route): boolean {
  return PLAY.includes(route.name)
}

/** Where a signed-in wizard should land after the splash tap or a login. */
export function homeRoute(player: Player, now: number): Route {
  if (player.status === 'pending') return { name: 'pending' }
  if (isResting(player.curfew, now)) return { name: 'curfew' }
  if (!player.house) return { name: 'sorting' }
  if (!player.wandChosen) return { name: 'wand' }
  if (!player.cardSeen) return { name: 'card' }
  if (!player.storySeen) return { name: 'story' }
  return { name: 'hub' }
}
