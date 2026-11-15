/** Magnet runs on private AI (GarageAI): no public cloud model sees the chat. */
export function usesPrivateAI(config: { active_integration?: string } | undefined): boolean {
  return config?.active_integration === 'garageai';
}
