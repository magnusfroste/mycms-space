import { describe, expect, it } from 'vitest';
import { defaultIntegrations, integrationsMeta } from '../modules';

describe('AI integrations', () => {
  it('offers GarageAI to Magnet with automatic model routing', () => {
    const garageAI = integrationsMeta.find((integration) => integration.type === 'garageai');

    expect(garageAI).toMatchObject({
      category: 'ai',
      available: true,
      name: 'GarageAI',
    });
    expect(defaultIntegrations.garageai).toMatchObject({ model: 'garageai/auto' });
  });

  it('has a default configuration for every available AI provider', () => {
    const availableAIProviders = integrationsMeta.filter(
      (integration) => integration.category === 'ai' && integration.available,
    );

    for (const provider of availableAIProviders) {
      expect(defaultIntegrations[provider.type as keyof typeof defaultIntegrations]).toBeDefined();
    }
  });
});
