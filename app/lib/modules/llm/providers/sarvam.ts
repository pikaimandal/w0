import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';

export default class SarvamProvider extends BaseProvider {
  name = 'Sarvam';
  getApiKeyLink = 'https://platform.sarvam.ai/api-keys';
  labelForGetApiKey = 'Sarvam AI';
  icon = '/icons/Sarvam.svg';

  config = {
    baseUrlKey: 'SARVAM_API_BASE_URL',
    apiTokenKey: 'SARVAM_API_KEY',
    baseUrl: 'https://api.sarvam.ai/v1',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'sarvam-m',
      label: 'Sarvam-M (24B)',
      provider: this.name,
      maxTokenAllowed: 8192,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'SARVAM_API_BASE_URL',
      defaultApiTokenKey: 'SARVAM_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      return this.staticModels;
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch Sarvam models, falling back to static models');
        return this.staticModels;
      }

      const res = (await response.json()) as any;

      if (res.data && Array.isArray(res.data)) {
        return res.data.map((model: any) => ({
          name: model.id,
          label: `${model.id} (Sarvam)`,
          provider: this.name,
          maxTokenAllowed: model.id === 'sarvam-m' ? 8192 : 4096,
        }));
      }
    } catch (error) {
      console.warn('Error fetching Sarvam models:', error);
    }

    return this.staticModels;
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'SARVAM_API_BASE_URL',
      defaultApiTokenKey: 'SARVAM_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
} 