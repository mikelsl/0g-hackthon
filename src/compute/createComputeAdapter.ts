import type { ComputeAdapter } from './ComputeAdapter.js';
import { LlmComputeAdapter } from './LlmComputeAdapter.js';
import { MockComputeAdapter } from './MockComputeAdapter.js';

class SpeechLlmDecisionMockAdapter implements ComputeAdapter {
  constructor(
    private readonly speech: ComputeAdapter,
    private readonly decisions: ComputeAdapter,
    private readonly fallback: ComputeAdapter
  ) {}

  async generateSpeech(...args: Parameters<ComputeAdapter['generateSpeech']>) {
    try {
      return await this.speech.generateSpeech(...args);
    } catch (err) {
      console.warn(`[compute] LLM speech failed; falling back to mock speech: ${err instanceof Error ? err.message : String(err)}`);
      return this.fallback.generateSpeech(...args);
    }
  }

  chooseVote(...args: Parameters<ComputeAdapter['chooseVote']>) {
    return this.decisions.chooseVote(...args);
  }

  chooseNightKill(...args: Parameters<ComputeAdapter['chooseNightKill']>) {
    return this.decisions.chooseNightKill(...args);
  }

  chooseSeerCheck(...args: Parameters<ComputeAdapter['chooseSeerCheck']>) {
    return this.decisions.chooseSeerCheck(...args);
  }
}

export function createComputeAdapter(): ComputeAdapter {
  const backend = (process.env.COMPUTE_BACKEND ?? '').trim().toLowerCase();
  const legacyUseLlm = process.env.USE_LLM === '1';
  const mock = new MockComputeAdapter();

  if (backend === 'mock' || (!backend && !legacyUseLlm)) return mock;

  if (backend === 'llm' || legacyUseLlm) return new LlmComputeAdapter();

  if (backend === '0g' || backend === '0g-router' || backend === '0g-direct' || backend === '0g-speech' || backend === 'llm-speech') {
    let llm: LlmComputeAdapter;
    try {
      llm = new LlmComputeAdapter({ providerPreset: backend.startsWith('0g') && backend !== '0g-direct' ? '0g-router-testnet' : undefined });
    } catch (err) {
      console.warn(`[compute] ${backend} requested but LLM is not configured; using mock compute: ${err instanceof Error ? err.message : String(err)}`);
      return mock;
    }
    return new SpeechLlmDecisionMockAdapter(llm, mock, mock);
  }

  throw new Error(`Unsupported COMPUTE_BACKEND: ${backend}`);
}
