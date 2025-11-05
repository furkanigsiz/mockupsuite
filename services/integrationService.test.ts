import { describe, it, expect, beforeEach, vi } from 'vitest';
import { integrationService } from './integrationService';
import { supabase } from './supabaseClient';
import { IntegrationErrorType } from '../types';

// Mock Supabase client
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('IntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getIntegrations', () => {
    it('should fetch integrations with connection status', async () => {
      const mockIntegrations = [
        {
          id: '1',
          name: 'Shopify',
          description: 'E-commerce platform',
          category: 'ecommerce',
          logo_url: '/logos/shopify.png',
          status: 'active',
          oauth_config: {},
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockUserIntegrations = [{ integration_id: '1' }];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockIntegrations,
            error: null,
          }),
          eq: vi.fn().mockReturnThis(),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'integrations') {
          return mockFrom(table);
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockUserIntegrations,
              error: null,
            }),
          }),
        } as any;
      });

      const result = await integrationService.getIntegrations('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].isConnected).toBe(true);
      expect(result[0].name).toBe('Shopify');
    });

    it('should handle API errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.getIntegrations('user-123')
      ).rejects.toMatchObject({
        type: IntegrationErrorType.API_ERROR,
        userMessage: expect.stringContaining('error occurred'),
      });
    });
  });

  describe('connectIntegration', () => {
    it('should generate OAuth URL with state token', async () => {
      const mockIntegration = {
        id: '1',
        name: 'Shopify',
        status: 'active',
        oauth_config: {
          clientId: 'test-client-id',
          redirectUri: 'http://localhost/callback',
          authUrl: 'https://oauth.example.com/authorize',
          scope: 'read_products',
        },
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockIntegration,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await integrationService.connectIntegration('user-123', '1');

      expect(result.authUrl).toContain('https://oauth.example.com/authorize');
      expect(result.authUrl).toContain('client_id=test-client-id');
      expect(result.authUrl).toContain('state=');
      expect(result.state).toBeTruthy();
    });

    it('should reject inactive integrations', async () => {
      const mockIntegration = {
        id: '1',
        name: 'Etsy',
        status: 'coming_soon',
        oauth_config: {},
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockIntegration,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.connectIntegration('user-123', '1')
      ).rejects.toMatchObject({
        type: IntegrationErrorType.CONNECTION_FAILED,
      });
    });
  });

  describe('disconnectIntegration', () => {
    it('should remove user integration', async () => {
      const mockUserIntegration = {
        access_token: 'test-token',
        integration_id: '1',
      };

      const mockDelete = vi.fn().mockResolvedValue({ error: null });

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserIntegration,
                    error: null,
                  }),
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: mockDelete,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { oauth_config: {} },
                error: null,
              }),
            }),
          }),
        } as any;
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await integrationService.disconnectIntegration('user-123', '1');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { access_token: 'test' },
                error: null,
              }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Delete failed' },
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.disconnectIntegration('user-123', '1')
      ).rejects.toMatchObject({
        type: IntegrationErrorType.API_ERROR,
      });
    });
  });

  describe('error handling', () => {
    it('should create proper error objects for each error type', async () => {
      const errorTypes = [
        IntegrationErrorType.CONNECTION_FAILED,
        IntegrationErrorType.OAUTH_ERROR,
        IntegrationErrorType.TOKEN_EXPIRED,
        IntegrationErrorType.API_ERROR,
        IntegrationErrorType.SYNC_FAILED,
        IntegrationErrorType.INVALID_CREDENTIALS,
        IntegrationErrorType.RATE_LIMIT_EXCEEDED,
        IntegrationErrorType.NETWORK_ERROR,
      ];

      // Test that each error type produces a proper error structure
      for (const errorType of errorTypes) {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Test error' },
            }),
          }),
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        try {
          await integrationService.getIntegrations('user-123');
        } catch (error: any) {
          expect(error).toHaveProperty('type');
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('userMessage');
          expect(error).toHaveProperty('retryable');
        }
      }
    });
  });

  describe('Shopify Integration', () => {
    describe('product import', () => {
      it('should import products from Shopify API', async () => {
        const mockShopifyProducts = {
          products: [
            {
              id: 'shopify-123',
              title: 'Test Product',
              body_html: '<p>Product description</p>',
              handle: 'test-product',
              vendor: 'Test Vendor',
              product_type: 'T-Shirt',
              images: [
                {
                  id: 'img-1',
                  product_id: 'shopify-123',
                  position: 1,
                  src: 'https://example.com/image.jpg',
                  width: 800,
                  height: 800,
                },
              ],
              variants: [
                {
                  id: 'var-1',
                  product_id: 'shopify-123',
                  title: 'Small',
                  price: '29.99',
                  sku: 'TEST-SM',
                  inventory_quantity: 10,
                },
              ],
            },
          ],
        };

        // Mock fetch for Shopify API
        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('/admin/api/2024-01/products.json')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockShopifyProducts),
            });
          }
          if (url.includes('example.com/image.jpg')) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        // Mock FileReader for base64 conversion
        global.FileReader = class {
          onloadend: any;
          result: string = 'data:image/jpeg;base64,dGVzdA==';
          readAsDataURL() {
            setTimeout(() => {
              this.onloadend?.();
            }, 0);
          }
        } as any;

        // Mock Supabase for user integration and project creation
        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'test-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Shopify' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'projects') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'project-123',
                      name: 'Test Product',
                      prompt: 'Product description',
                      aspect_ratio: '1:1',
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'import_products',
          { shopDomain: 'test-shop.myshopify.com', userId: 'user-123' }
        );

        expect(result.success).toBe(true);
        expect(result.productsImported).toBe(1);
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].name).toBe('Test Product');
      });

      it('should handle Shopify API errors', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized'),
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'test-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Shopify' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'import_products',
            { shopDomain: 'test-shop.myshopify.com', userId: 'user-123' }
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.API_ERROR,
          platform: 'Shopify',
        });
      });
    });

    describe('mockup publish', () => {
      it('should publish mockup to Shopify product', async () => {
        const mockupUrl = 'https://storage.example.com/mockup.png';

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === mockupUrl) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('/admin/api/2024-01/products/')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  image: {
                    id: 'img-123',
                    src: 'https://cdn.shopify.com/uploaded-mockup.png',
                  },
                }),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        global.FileReader = class {
          onloadend: any;
          result: string = 'data:image/png;base64,bW9ja3Vw';
          readAsDataURL() {
            setTimeout(() => {
              this.onloadend?.();
            }, 0);
          }
        } as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'test-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Shopify' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'publish_mockup',
          {
            shopDomain: 'test-shop.myshopify.com',
            productId: 'product-123',
            mockupUrls: [mockupUrl],
          }
        );

        expect(result.success).toBe(true);
        expect(result.imagesAdded).toBe(1);
        expect(result.productUrl).toContain('test-shop.myshopify.com');
      });

      it('should handle upload failures gracefully', async () => {
        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('mockup.png')) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('/admin/api/2024-01/products/')) {
            return Promise.resolve({
              ok: false,
              status: 422,
              text: () => Promise.resolve('Invalid image'),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        global.FileReader = class {
          onloadend: any;
          result: string = 'data:image/png;base64,bW9ja3Vw';
          readAsDataURL() {
            setTimeout(() => {
              this.onloadend?.();
            }, 0);
          }
        } as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'test-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Shopify' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'publish_mockup',
            {
              shopDomain: 'test-shop.myshopify.com',
              productId: 'product-123',
              mockupUrls: ['https://storage.example.com/mockup.png'],
            }
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.SYNC_FAILED,
          platform: 'Shopify',
        });
      });
    });
  });
});

  describe('Figma Integration', () => {
    describe('browse files', () => {
      it('should fetch user Figma files with thumbnails', async () => {
        const mockFigmaFiles = {
          files: [
            {
              key: 'file-123',
              name: 'Design System',
              thumbnail_url: 'https://figma.com/thumb.png',
              last_modified: '2024-01-15T10:00:00Z',
            },
            {
              key: 'file-456',
              name: 'Product Mockups',
              thumbnail_url: 'https://figma.com/thumb2.png',
              last_modified: '2024-01-16T12:00:00Z',
            },
          ],
        };

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === 'https://api.figma.com/v1/me/files') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockFigmaFiles),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'figma-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Figma' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'browse_files'
        );

        expect(result.success).toBe(true);
        expect(result.files).toHaveLength(2);
        expect(result.files[0].key).toBe('file-123');
        expect(result.files[0].name).toBe('Design System');
        expect(result.files[0].thumbnail_url).toBe('https://figma.com/thumb.png');
      });

      it('should handle Figma API errors when browsing files', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          text: () => Promise.resolve('Forbidden'),
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'figma-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Figma' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'browse_files'
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.API_ERROR,
          platform: 'Figma',
        });
      });
    });

    describe('import design', () => {
      it('should export and import Figma design as UploadedImage', async () => {
        const mockExportResponse = {
          err: null,
          images: {
            'node-123': 'https://figma-export.s3.amazonaws.com/image.png',
          },
        };

        const mockFileResponse = {
          name: 'My Design',
        };

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('https://api.figma.com/v1/images/')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockExportResponse),
            });
          }
          if (url.includes('https://figma-export.s3.amazonaws.com/image.png')) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['design'], { type: 'image/png' })),
            });
          }
          if (url.includes('https://api.figma.com/v1/files/')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockFileResponse),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        global.FileReader = class {
          onloadend: any;
          result: string = 'data:image/png;base64,ZGVzaWdu';
          readAsDataURL() {
            setTimeout(() => {
              this.onloadend?.();
            }, 0);
          }
        } as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'figma-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Figma' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'import_design',
          { fileKey: 'file-123', nodeId: 'node-123' }
        );

        expect(result.success).toBe(true);
        expect(result.uploadedImage).toBeDefined();
        expect(result.uploadedImage.base64).toBe('data:image/png;base64,ZGVzaWdu');
        expect(result.uploadedImage.name).toContain('My Design');
        expect(result.uploadedImage.type).toBe('image/png');
      });

      it('should handle export without nodeId (entire file)', async () => {
        const mockExportResponse = {
          err: null,
          images: {
            'page-1': 'https://figma-export.s3.amazonaws.com/full-file.png',
          },
        };

        const mockFileResponse = {
          name: 'Full Design',
        };

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('https://api.figma.com/v1/images/')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockExportResponse),
            });
          }
          if (url.includes('https://figma-export.s3.amazonaws.com/full-file.png')) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['fulldesign'], { type: 'image/png' })),
            });
          }
          if (url.includes('https://api.figma.com/v1/files/')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockFileResponse),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        global.FileReader = class {
          onloadend: any;
          result: string = 'data:image/png;base64,ZnVsbGRlc2lnbg==';
          readAsDataURL() {
            setTimeout(() => {
              this.onloadend?.();
            }, 0);
          }
        } as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'figma-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Figma' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'import_design',
          { fileKey: 'file-123' }
        );

        expect(result.success).toBe(true);
        expect(result.uploadedImage).toBeDefined();
        expect(result.uploadedImage.name).toContain('Full Design');
      });

      it('should handle Figma export errors', async () => {
        const mockExportResponse = {
          err: 'Invalid file key',
          images: {},
        };

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('https://api.figma.com/v1/images/')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockExportResponse),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'figma-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Figma' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'import_design',
            { fileKey: 'invalid-file' }
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.API_ERROR,
          platform: 'Figma',
        });
      });

      it('should handle missing fileKey parameter', async () => {
        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'figma-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Figma' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'import_design',
            {}
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.API_ERROR,
        });
      });
    });
  });

  describe('Google Drive Integration', () => {
    describe('upload mockups', () => {
      it('should upload mockups to Google Drive', async () => {
        const mockupUrl = 'https://storage.example.com/mockup.png';

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === mockupUrl) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('googleapis.com/upload/drive/v3/files')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  id: 'drive-file-123',
                  name: 'mockup.png',
                  mimeType: 'image/png',
                }),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'drive-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Google Drive' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'upload_mockups',
          { mockupUrls: [mockupUrl], folderId: 'folder-123' }
        );

        expect(result.success).toBe(true);
        expect(result.filesUploaded).toBe(1);
        expect(result.files).toHaveLength(1);
        expect(result.files[0].id).toBe('drive-file-123');
        expect(result.files[0].link).toContain('drive.google.com');
      });

      it('should upload mockups without folder ID', async () => {
        const mockupUrl = 'https://storage.example.com/mockup.png';

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === mockupUrl) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('googleapis.com/upload/drive/v3/files')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  id: 'drive-file-456',
                  name: 'mockup.png',
                  mimeType: 'image/png',
                }),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'drive-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Google Drive' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'upload_mockups',
          { mockupUrls: [mockupUrl] }
        );

        expect(result.success).toBe(true);
        expect(result.filesUploaded).toBe(1);
      });

      it('should handle Google Drive API errors', async () => {
        const mockupUrl = 'https://storage.example.com/mockup.png';

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === mockupUrl) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('googleapis.com/upload/drive/v3/files')) {
            return Promise.resolve({
              ok: false,
              status: 403,
              text: () => Promise.resolve('Insufficient permissions'),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'drive-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Google Drive' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'upload_mockups',
            { mockupUrls: [mockupUrl] }
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.SYNC_FAILED,
          platform: 'Google Drive',
        });
      });

      it('should handle missing mockup URLs', async () => {
        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'drive-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Google Drive' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'upload_mockups',
            {}
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.API_ERROR,
        });
      });
    });
  });

  describe('Dropbox Integration', () => {
    describe('upload mockups', () => {
      it('should upload mockups to Dropbox', async () => {
        const mockupUrl = 'https://storage.example.com/mockup.png';

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === mockupUrl) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('content.dropboxapi.com/2/files/upload')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  id: 'id:dropbox-file-123',
                  name: 'mockup.png',
                  path_display: '/mockups/mockup.png',
                }),
            });
          }
          if (url.includes('api.dropboxapi.com/2/sharing/create_shared_link_with_settings')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  url: 'https://www.dropbox.com/s/abc123/mockup.png',
                }),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'dropbox-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Dropbox' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'upload_mockups',
          { mockupUrls: [mockupUrl], folderPath: '/mockups' }
        );

        expect(result.success).toBe(true);
        expect(result.filesUploaded).toBe(1);
        expect(result.files).toHaveLength(1);
        expect(result.files[0].id).toBe('id:dropbox-file-123');
        expect(result.files[0].link).toContain('dropbox.com');
      });

      it('should upload mockups without folder path', async () => {
        const mockupUrl = 'https://storage.example.com/mockup.png';

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === mockupUrl) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('content.dropboxapi.com/2/files/upload')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  id: 'id:dropbox-file-456',
                  name: 'mockup.png',
                  path_display: '/mockup.png',
                }),
            });
          }
          if (url.includes('api.dropboxapi.com/2/sharing/create_shared_link_with_settings')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  url: 'https://www.dropbox.com/s/xyz789/mockup.png',
                }),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'dropbox-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Dropbox' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'upload_mockups',
          { mockupUrls: [mockupUrl] }
        );

        expect(result.success).toBe(true);
        expect(result.filesUploaded).toBe(1);
      });

      it('should handle Dropbox API errors', async () => {
        const mockupUrl = 'https://storage.example.com/mockup.png';

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === mockupUrl) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('content.dropboxapi.com/2/files/upload')) {
            return Promise.resolve({
              ok: false,
              status: 401,
              text: () => Promise.resolve('Invalid access token'),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'dropbox-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Dropbox' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'upload_mockups',
            { mockupUrls: [mockupUrl] }
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.SYNC_FAILED,
          platform: 'Dropbox',
        });
      });

      it('should handle shared link creation failure gracefully', async () => {
        const mockupUrl = 'https://storage.example.com/mockup.png';

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === mockupUrl) {
            return Promise.resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mockup'], { type: 'image/png' })),
            });
          }
          if (url.includes('content.dropboxapi.com/2/files/upload')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  id: 'id:dropbox-file-789',
                  name: 'mockup.png',
                  path_display: '/mockup.png',
                }),
            });
          }
          if (url.includes('api.dropboxapi.com/2/sharing/create_shared_link_with_settings')) {
            return Promise.resolve({
              ok: false,
              status: 409,
              text: () => Promise.resolve('Shared link already exists'),
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        }) as any;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'dropbox-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Dropbox' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const result = await integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'upload_mockups',
          { mockupUrls: [mockupUrl] }
        );

        // Should still succeed even if shared link creation fails
        expect(result.success).toBe(true);
        expect(result.filesUploaded).toBe(1);
        expect(result.files[0].link).toContain('dropbox.com/home');
      });

      it('should handle missing mockup URLs', async () => {
        const mockFrom = vi.fn().mockImplementation((table: string) => {
          if (table === 'user_integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        access_token: 'dropbox-token',
                        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'integrations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { name: 'Dropbox' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {} as any;
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        await expect(
          integrationService.syncIntegration(
            'user-123',
            'integration-123',
            'upload_mockups',
            {}
          )
        ).rejects.toMatchObject({
          type: IntegrationErrorType.API_ERROR,
        });
      });
    });
  });

  describe('Retry Logic', () => {
    it('should retry network errors with exponential backoff', async () => {
      let attemptCount = 0;
      
      const mockFrom = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockRejectedValue(new TypeError('fetch failed')),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            eq: vi.fn().mockReturnThis(),
          }),
        };
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await integrationService.getIntegrations('user-123');

      expect(attemptCount).toBe(3);
      expect(result).toEqual([]);
    });

    it('should retry rate limit errors', async () => {
      let attemptCount = 0;

      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.resolve({
            ok: false,
            status: 429,
            text: () => Promise.resolve('Rate limit exceeded'),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ products: [] }),
        });
      }) as any;

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      access_token: 'test-token',
                      token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        if (table === 'integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { name: 'Shopify' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'projects') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'project-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {} as any;
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await integrationService.syncIntegration(
        'user-123',
        'integration-123',
        'import_products',
        { shopDomain: 'test-shop.myshopify.com', userId: 'user-123' }
      );

      expect(attemptCount).toBe(2);
      expect(result.success).toBe(true);
    });

    it('should not retry non-retryable errors', async () => {
      let attemptCount = 0;

      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized'),
        });
      }) as any;

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      access_token: 'test-token',
                      token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { name: 'Shopify' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {} as any;
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'import_products',
          { shopDomain: 'test-shop.myshopify.com', userId: 'user-123' }
        )
      ).rejects.toMatchObject({
        type: IntegrationErrorType.INVALID_CREDENTIALS,
      });

      // Should only attempt once for non-retryable errors
      expect(attemptCount).toBe(1);
    });

    it('should stop retrying after max attempts', async () => {
      let attemptCount = 0;

      const mockFrom = vi.fn().mockImplementation(() => {
        attemptCount++;
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new TypeError('fetch failed')),
          }),
        };
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.getIntegrations('user-123')
      ).rejects.toThrow();

      // Should attempt 4 times total (initial + 3 retries)
      expect(attemptCount).toBe(4);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh expired token before sync operation', async () => {
      let refreshCalled = false;

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('token')) {
          refreshCalled = true;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                access_token: 'new-token',
                refresh_token: 'new-refresh-token',
                expires_in: 3600,
              }),
          });
        }
        if (url.includes('/admin/api/2024-01/products.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ products: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as any;

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      access_token: 'expired-token',
                      refresh_token: 'refresh-token',
                      token_expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        if (table === 'integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    name: 'Shopify',
                    oauth_config: {
                      tokenUrl: 'https://oauth.example.com/token',
                      clientId: 'client-id',
                      clientSecret: 'client-secret',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'projects') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'project-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {} as any;
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await integrationService.syncIntegration(
        'user-123',
        'integration-123',
        'import_products',
        { shopDomain: 'test-shop.myshopify.com', userId: 'user-123' }
      );

      expect(refreshCalled).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should throw TOKEN_EXPIRED error when refresh token is missing', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      access_token: 'expired-token',
                      refresh_token: null, // No refresh token
                      token_expires_at: new Date(Date.now() - 1000).toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { name: 'Shopify' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {} as any;
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'import_products',
          { shopDomain: 'test-shop.myshopify.com', userId: 'user-123' }
        )
      ).rejects.toMatchObject({
        type: IntegrationErrorType.TOKEN_EXPIRED,
        userMessage: expect.stringContaining('reconnect'),
      });
    });

    it('should throw TOKEN_EXPIRED error when refresh fails', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('token')) {
          return Promise.resolve({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as any;

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      access_token: 'expired-token',
                      refresh_token: 'invalid-refresh-token',
                      token_expires_at: new Date(Date.now() - 1000).toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    name: 'Shopify',
                    oauth_config: {
                      tokenUrl: 'https://oauth.example.com/token',
                      clientId: 'client-id',
                      clientSecret: 'client-secret',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {} as any;
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'import_products',
          { shopDomain: 'test-shop.myshopify.com', userId: 'user-123' }
        )
      ).rejects.toMatchObject({
        type: IntegrationErrorType.TOKEN_EXPIRED,
      });
    });
  });

  describe('Error Type Mapping', () => {
    it('should map 401/403 errors to INVALID_CREDENTIALS', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      }) as any;

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      access_token: 'test-token',
                      token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { name: 'Figma' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {} as any;
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'browse_files'
        )
      ).rejects.toMatchObject({
        type: IntegrationErrorType.INVALID_CREDENTIALS,
        platform: 'Figma',
      });
    });

    it('should map 429 errors to RATE_LIMIT_EXCEEDED', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Too many requests'),
      }) as any;

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      access_token: 'test-token',
                      token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'integrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { name: 'Shopify' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {} as any;
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.syncIntegration(
          'user-123',
          'integration-123',
          'import_products',
          { shopDomain: 'test-shop.myshopify.com', userId: 'user-123' }
        )
      ).rejects.toMatchObject({
        type: IntegrationErrorType.RATE_LIMIT_EXCEEDED,
        platform: 'Shopify',
        retryable: true,
      });
    });

    it('should map fetch errors to NETWORK_ERROR', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        integrationService.getIntegrations('user-123')
      ).rejects.toMatchObject({
        type: IntegrationErrorType.NETWORK_ERROR,
        retryable: true,
      });
    });
  });

