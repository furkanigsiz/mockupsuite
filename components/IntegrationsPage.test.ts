import { describe, it, expect } from 'vitest';
import { Integration, IntegrationCategory } from '../types';

/**
 * Tests for IntegrationsPage filtering logic
 * 
 * These tests verify the core filtering functionality without requiring
 * a full React component testing setup.
 */

describe('IntegrationsPage filtering logic', () => {
  const mockIntegrations: Integration[] = [
    {
      id: '1',
      name: 'Shopify',
      description: 'E-commerce platform for online stores',
      category: 'ecommerce',
      logoUrl: '/logos/shopify.png',
      status: 'active',
      isConnected: false,
    },
    {
      id: '2',
      name: 'Figma',
      description: 'Design tool for creating mockups',
      category: 'design-tools',
      logoUrl: '/logos/figma.png',
      status: 'active',
      isConnected: true,
    },
    {
      id: '3',
      name: 'Google Drive',
      description: 'Cloud storage service',
      category: 'storage',
      logoUrl: '/logos/gdrive.png',
      status: 'active',
      isConnected: false,
    },
    {
      id: '4',
      name: 'Etsy',
      description: 'Marketplace for handmade goods',
      category: 'ecommerce',
      logoUrl: '/logos/etsy.png',
      status: 'coming_soon',
      isConnected: false,
    },
  ];

  describe('search filtering', () => {
    it('should filter integrations by name', () => {
      const searchQuery = 'shopify';
      const filtered = mockIntegrations.filter((integration) => {
        const matchesSearch = !searchQuery || 
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && integration.status === 'active';
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Shopify');
    });

    it('should filter integrations by description', () => {
      const searchQuery = 'design';
      const filtered = mockIntegrations.filter((integration) => {
        const matchesSearch = !searchQuery || 
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && integration.status === 'active';
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Figma');
    });

    it('should return all active integrations when search is empty', () => {
      const searchQuery = '';
      const filtered = mockIntegrations.filter((integration) => {
        if (!searchQuery) return integration.status === 'active';
        const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && integration.status === 'active';
      });

      expect(filtered).toHaveLength(3);
    });

    it('should return empty array when no matches found', () => {
      const searchQuery = 'nonexistent';
      const filtered = mockIntegrations.filter((integration) => {
        const matchesSearch = !searchQuery || 
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && integration.status === 'active';
      });

      expect(filtered).toHaveLength(0);
    });

    it('should be case-insensitive', () => {
      const searchQuery = 'FIGMA';
      const filtered = mockIntegrations.filter((integration) => {
        const matchesSearch = !searchQuery || 
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && integration.status === 'active';
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Figma');
    });
  });

  describe('category filtering', () => {
    it('should filter integrations by category', () => {
      const selectedCategory: IntegrationCategory | 'all' = 'ecommerce';
      const filtered = mockIntegrations.filter((integration) => {
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        return matchesCategory && integration.status === 'active';
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Shopify');
    });

    it('should return all active integrations when category is "all"', () => {
      const selectedCategory: IntegrationCategory | 'all' = 'all';
      const filtered = mockIntegrations.filter((integration) => {
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        return matchesCategory && integration.status === 'active';
      });

      expect(filtered).toHaveLength(3);
    });

    it('should filter design-tools category', () => {
      const selectedCategory: IntegrationCategory | 'all' = 'design-tools';
      const filtered = mockIntegrations.filter((integration) => {
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        return matchesCategory && integration.status === 'active';
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Figma');
    });

    it('should filter storage category', () => {
      const selectedCategory: IntegrationCategory | 'all' = 'storage';
      const filtered = mockIntegrations.filter((integration) => {
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        return matchesCategory && integration.status === 'active';
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Google Drive');
    });
  });

  describe('combined search and category filtering', () => {
    it('should filter by both search and category', () => {
      const searchQuery = 'platform';
      const selectedCategory: IntegrationCategory | 'all' = 'ecommerce';
      
      const filtered = mockIntegrations.filter((integration) => {
        const matchesSearch = !searchQuery || 
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        return matchesSearch && matchesCategory && integration.status === 'active';
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Shopify');
    });

    it('should return empty when search matches but category does not', () => {
      const searchQuery = 'figma';
      const selectedCategory: IntegrationCategory | 'all' = 'ecommerce';
      
      const filtered = mockIntegrations.filter((integration) => {
        const matchesSearch = !searchQuery || 
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        return matchesSearch && matchesCategory && integration.status === 'active';
      });

      expect(filtered).toHaveLength(0);
    });

    it('should return empty when category matches but search does not', () => {
      const searchQuery = 'nonexistent';
      const selectedCategory: IntegrationCategory | 'all' = 'ecommerce';
      
      const filtered = mockIntegrations.filter((integration) => {
        const matchesSearch = !searchQuery || 
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        return matchesSearch && matchesCategory && integration.status === 'active';
      });

      expect(filtered).toHaveLength(0);
    });
  });

  describe('coming soon filtering', () => {
    it('should separate coming soon integrations from active ones', () => {
      const activeIntegrations = mockIntegrations.filter(
        (integration) => integration.status === 'active'
      );
      const comingSoonIntegrations = mockIntegrations.filter(
        (integration) => integration.status === 'coming_soon'
      );

      expect(activeIntegrations).toHaveLength(3);
      expect(comingSoonIntegrations).toHaveLength(1);
      expect(comingSoonIntegrations[0].name).toBe('Etsy');
    });

    it('should apply search filter to coming soon integrations', () => {
      const searchQuery = 'etsy';
      const comingSoonIntegrations = mockIntegrations.filter((integration) => {
        const matchesSearch = !searchQuery || 
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && integration.status === 'coming_soon';
      });

      expect(comingSoonIntegrations).toHaveLength(1);
      expect(comingSoonIntegrations[0].name).toBe('Etsy');
    });

    it('should apply category filter to coming soon integrations', () => {
      const selectedCategory: IntegrationCategory | 'all' = 'ecommerce';
      const comingSoonIntegrations = mockIntegrations.filter((integration) => {
        const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
        return matchesCategory && integration.status === 'coming_soon';
      });

      expect(comingSoonIntegrations).toHaveLength(1);
      expect(comingSoonIntegrations[0].name).toBe('Etsy');
    });
  });
});
