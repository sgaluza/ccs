import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ImageAnalysisStatusSection } from '@/components/profiles/editor/image-analysis-status-section';
import type { ImageAnalysisStatus } from '@/lib/api-client';

function createStatus(overrides: Partial<ImageAnalysisStatus> = {}): ImageAnalysisStatus {
  return {
    enabled: true,
    supported: true,
    status: 'active',
    backendId: 'gemini',
    backendDisplayName: 'Google Gemini',
    model: 'gemini-2.5-flash',
    resolutionSource: 'cliproxy-bridge',
    reason: null,
    shouldPersistHook: true,
    persistencePath: '/tmp/.ccs/glm.settings.json',
    runtimePath: '/api/provider/gemini',
    usesCurrentTarget: true,
    usesCurrentAuthToken: true,
    hookInstalled: true,
    sharedHookInstalled: true,
    ...overrides,
  };
}

describe('ImageAnalysisStatusSection', () => {
  it('renders active bridge diagnostics near the raw editor footer stack', () => {
    render(<ImageAnalysisStatusSection status={createStatus()} />);

    expect(screen.getByText('Image-analysis backend')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Derived runtime status\. This section is not written into the JSON editor above\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText(/Ready via Google Gemini\./i)).toBeInTheDocument();
    expect(screen.getByText('Google Gemini')).toBeInTheDocument();
    expect(screen.getByTitle(/\/api\/provider\/gemini/)).toBeInTheDocument();
    expect(screen.getByText('gemini-2.5-flash')).toBeInTheDocument();
  });

  it('renders mapped status and the explicit mapping explanation', () => {
    render(
      <ImageAnalysisStatusSection
        status={createStatus({
          status: 'mapped',
          backendId: 'ghcp',
          backendDisplayName: 'GitHub Copilot (OAuth)',
          model: 'claude-haiku-4.5',
          resolutionSource: 'profile-backend',
          reason: 'Using explicit profile mapping.',
        })}
      />
    );

    expect(screen.getByText('Saved mapping')).toBeInTheDocument();
    expect(
      screen.getByText(/Ready via saved GitHub Copilot \(OAuth\) mapping/i)
    ).toBeInTheDocument();
    expect(screen.getByText('GitHub Copilot (OAuth)')).toBeInTheDocument();
    expect(screen.getByText('claude-haiku-4.5')).toBeInTheDocument();
  });
});
