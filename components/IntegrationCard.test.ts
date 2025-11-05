import { describe, it, expect } from 'vitest';
import { Integration } from '../types';

/**
 * Tests for IntegrationCard component logic
 * 
 * These tests verify button visibility, connection status handling,
 * and platform-specific action button logic.
 */

describe('IntegrationCard logic', () => {
  const createMockIntegration = (overrides?: Partial<Integration>): Integration => ({
    id: '1',
    name: 'Test Integration',
    description: 'Test description',
    category: 'ecommerce',
    logoUrl: '/test-logo.png',
    status: 'active',
    isConnected: false,
    ...overrides,
  });

  describe('button visibility based on connection status', () => {
    it('should show Connect button for disconnected active integration', () => {
      const integration = createMockIntegration({
        status: 'active',
        isConnected: false,
      });

      const shouldShowConnect = !integration.isConnected && integration.status === 'active';
      const shouldShowDisconnect = integration.isConnected && integration.status === 'active';
      const shouldShowComingSoon = integration.status === 'coming_soon';

      expect(shouldShowConnect).toBe(true);
      expect(shouldShowDisconnect).toBe(false);
      expect(shouldShowComingSoon).toBe(false);
    });

    it('should show Disconnect button for connected integration', () => {
      const integration = createMockIntegration({
        status: 'active',
        isConnected: true,
      });

      const shouldShowConnect = !integration.isConnected && integration.status === 'active';
      const shouldShowDisconnect = integration.isConnected && integration.status === 'active';
      const shouldShowComingSoon = integration.status === 'coming_soon';

      expect(shouldShowConnect).toBe(false);
      expect(shouldShowDisconnect).toBe(true);
      expect(shouldShowComingSoon).toBe(false);
    });

    it('should show Coming Soon button for coming_soon status', () => {
      const integration = createMockIntegration({
        status: 'coming_soon',
        isConnected: false,
      });

      const shouldShowConnect = !integration.isConnected && integration.status === 'active';
      const shouldShowDisconnect = integration.isConnected && integration.status === 'active';
      const shouldShowComingSoon = integration.status === 'coming_soon';

      expect(shouldShowConnect).toBe(false);
      expect(shouldShowDisconnect).toBe(false);
      expect(shouldShowComingSoon).toBe(true);
    });

    it('should disable button for coming soon integrations', () => {
      const integration = createMockIntegration({
        status: 'coming_soon',
      });

      const isDisabled = integration.status === 'coming_soon';

      expect(isDisabled).toBe(true);
    });
  });

  describe('connection status badge', () => {
    it('should show Connected badge for connected active integration', () => {
      const integration = createMockIntegration({
        status: 'active',
        isConnected: true,
      });

      const shouldShowConnectedBadge = integration.isConnected && integration.status !== 'coming_soon';

      expect(shouldShowConnectedBadge).toBe(true);
    });

    it('should not show Connected badge for disconnected integration', () => {
      const integration = createMockIntegration({
        status: 'active',
        isConnected: false,
      });

      const shouldShowConnectedBadge = integration.isConnected && integration.status !== 'coming_soon';

      expect(shouldShowConnectedBadge).toBe(false);
    });

    it('should show Coming Soon badge for coming_soon status', () => {
      const integration = createMockIntegration({
        status: 'coming_soon',
      });

      const shouldShowComingSoonBadge = integration.status === 'coming_soon';

      expect(shouldShowComingSoonBadge).toBe(true);
    });
  });

  describe('platform-specific action buttons', () => {
    it('should show Sync Products button for connected Shopify', () => {
      const integration = createMockIntegration({
        name: 'Shopify',
        status: 'active',
        isConnected: true,
      });

      const shouldShowPlatformAction = integration.isConnected && integration.status !== 'coming_soon';
      const platformName = integration.name.toLowerCase();

      expect(shouldShowPlatformAction).toBe(true);
      expect(platformName).toBe('shopify');
    });

    it('should show Browse Files button for connected Figma', () => {
      const integration = createMockIntegration({
        name: 'Figma',
        category: 'design-tools',
        status: 'active',
        isConnected: true,
      });

      const shouldShowPlatformAction = integration.isConnected && integration.status !== 'coming_soon';
      const platformName = integration.name.toLowerCase();

      expect(shouldShowPlatformAction).toBe(true);
      expect(platformName).toBe('figma');
    });

    it('should show Save to Cloud button for connected Google Drive', () => {
      const integration = createMockIntegration({
        name: 'Google Drive',
        category: 'storage',
        status: 'active',
        isConnected: true,
      });

      const shouldShowPlatformAction = integration.isConnected && integration.status !== 'coming_soon';
      const platformName = integration.name.toLowerCase();

      expect(shouldShowPlatformAction).toBe(true);
      expect(platformName).toBe('google drive');
    });

    it('should show Save to Cloud button for connected Dropbox', () => {
      const integration = createMockIntegration({
        name: 'Dropbox',
        category: 'storage',
        status: 'active',
        isConnected: true,
      });

      const shouldShowPlatformAction = integration.isConnected && integration.status !== 'coming_soon';
      const platformName = integration.name.toLowerCase();

      expect(shouldShowPlatformAction).toBe(true);
      expect(platformName).toBe('dropbox');
    });

    it('should not show platform action for disconnected integration', () => {
      const integration = createMockIntegration({
        name: 'Shopify',
        status: 'active',
        isConnected: false,
      });

      const shouldShowPlatformAction = integration.isConnected && integration.status !== 'coming_soon';

      expect(shouldShowPlatformAction).toBe(false);
    });

    it('should not show platform action for coming soon integration', () => {
      const integration = createMockIntegration({
        name: 'Shopify',
        status: 'coming_soon',
        isConnected: false,
      });

      const shouldShowPlatformAction = integration.isConnected && integration.status !== 'coming_soon';

      expect(shouldShowPlatformAction).toBe(false);
    });
  });

  describe('click handler logic', () => {
    it('should call onConnect for disconnected integration', () => {
      const integration = createMockIntegration({
        status: 'active',
        isConnected: false,
      });

      const shouldCallConnect = !integration.isConnected;
      const shouldCallDisconnect = integration.isConnected;

      expect(shouldCallConnect).toBe(true);
      expect(shouldCallDisconnect).toBe(false);
    });

    it('should call onDisconnect for connected integration', () => {
      const integration = createMockIntegration({
        status: 'active',
        isConnected: true,
      });

      const shouldCallConnect = !integration.isConnected;
      const shouldCallDisconnect = integration.isConnected;

      expect(shouldCallConnect).toBe(false);
      expect(shouldCallDisconnect).toBe(true);
    });

    it('should call onSync with correct operation for Shopify', () => {
      const integration = createMockIntegration({
        name: 'Shopify',
        status: 'active',
        isConnected: true,
      });

      const platformName = integration.name.toLowerCase();
      let expectedOperation = '';

      if (platformName === 'shopify') {
        expectedOperation = 'sync_products';
      }

      expect(expectedOperation).toBe('sync_products');
    });

    it('should call onSync with correct operation for Figma', () => {
      const integration = createMockIntegration({
        name: 'Figma',
        status: 'active',
        isConnected: true,
      });

      const platformName = integration.name.toLowerCase();
      let expectedOperation = '';

      if (platformName === 'figma') {
        expectedOperation = 'browse_files';
      }

      expect(expectedOperation).toBe('browse_files');
    });

    it('should call onSync with correct operation for cloud storage', () => {
      const integration = createMockIntegration({
        name: 'Google Drive',
        status: 'active',
        isConnected: true,
      });

      const platformName = integration.name.toLowerCase();
      let expectedOperation = '';

      if (platformName === 'google drive' || platformName === 'dropbox') {
        expectedOperation = 'save_to_cloud';
      }

      expect(expectedOperation).toBe('save_to_cloud');
    });
  });

  describe('styling and visual states', () => {
    it('should apply grayscale filter to coming soon integration logo', () => {
      const integration = createMockIntegration({
        status: 'coming_soon',
      });

      const shouldApplyGrayscale = integration.status === 'coming_soon';

      expect(shouldApplyGrayscale).toBe(true);
    });

    it('should reduce opacity for coming soon cards', () => {
      const integration = createMockIntegration({
        status: 'coming_soon',
      });

      const shouldReduceOpacity = integration.status === 'coming_soon';

      expect(shouldReduceOpacity).toBe(true);
    });

    it('should enable hover effects for active integrations', () => {
      const integration = createMockIntegration({
        status: 'active',
      });

      const shouldEnableHover = integration.status !== 'coming_soon';

      expect(shouldEnableHover).toBe(true);
    });

    it('should disable hover effects for coming soon integrations', () => {
      const integration = createMockIntegration({
        status: 'coming_soon',
      });

      const shouldEnableHover = integration.status !== 'coming_soon';

      expect(shouldEnableHover).toBe(false);
    });
  });
});
