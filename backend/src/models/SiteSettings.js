import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema(
  {
    // Global Theme & Typography Configuration
    theme: {
      fontFamilyPrimary: {
        type: String,
        default: 'Syne, sans-serif',
      },
      fontFamilySecondary: {
        type: String,
        default: 'Inter, sans-serif',
      },
      fontFamilyDisplay: {
        type: String,
        default: 'Syne, sans-serif',
      },
      colorPrimary: {
        type: String,
        default: '#ff5121', // LxL Electric Orange
      },
      colorSecondary: {
        type: String,
        default: '#670b22', // Burgundy
      },
      colorAccentBlue: {
        type: String,
        default: '#055dff', // Electric Royal Blue
      },
      colorBackground: {
        type: String,
        default: '#0a0a0c', // Deep Cinema Dark
      },
      colorSurface: {
        type: String,
        default: '#121216',
      },
      colorText: {
        type: String,
        default: '#ffffff',
      },
      colorTextMuted: {
        type: String,
        default: '#8f9099',
      },
      borderStyle: {
        type: String,
        enum: ['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-full', 'sharp'],
        default: 'rounded-md',
      },
      customCssVars: {
        type: Map,
        of: String,
        default: {},
      },
    },

    // Dynamic Text & Copy by Page / Section
    sections: {
      hero: {
        headline: {
          type: String,
          default: 'WE CRAFT VISIONARY CINEMATIC EXPERIENCES',
        },
        eyebrow: {
          type: String,
          default: 'CineCraft Media & Studios',
        },
        subheadline: {
          type: String,
          default: 'Next-generation film production, cutting-edge equipment rental, and post-production mastery.',
        },
        ctaText: {
          type: String,
          default: 'Explore Projects',
        },
        ctaLink: {
          type: String,
          default: '#featured-projects',
        },
        secondaryCtaText: {
          type: String,
          default: 'Rent Equipment',
        },
        secondaryCtaLink: {
          type: String,
          default: '/equipments',
        },
      },
      about: {
        eyebrow: {
          type: String,
          default: 'Why CineCraft',
        },
        title: {
          type: String,
          default: 'Where Visionary Stories Meet Relentless Craftsmanship',
        },
        description: {
          type: String,
          default: 'From high-octane commercial productions to award-winning cinematic features, we empower creators with state-of-the-art camera systems, precision optics, and bespoke soundstages.',
        },
        bulletPoints: [
          {
            title: String,
            description: String,
          },
        ],
      },
      services: {
        title: {
          type: String,
          default: 'Production Verticals',
        },
        subtitle: {
          type: String,
          default: 'End-to-end cinematic solutions tailored for high-profile productions.',
        },
      },
      studios: {
        title: {
          type: String,
          default: 'Cinecraft Studios',
        },
        subtitle: {
          type: String,
          default: 'Acoustically treated soundstages, virtual production volume, and full grip packages.',
        },
        ctaText: {
          type: String,
          default: 'Book Studio Space',
        },
      },
      footer: {
        tagline: {
          type: String,
          default: 'Pioneering Cinematic Excellence Worldwide.',
        },
        contactEmail: {
          type: String,
          default: 'contact@cinecraftmedia.com',
        },
        contactPhone: {
          type: String,
          default: '+1 (555) 019-2834',
        },
        address: {
          type: String,
          default: '742 Evergreen Studio Complex, Los Angeles, CA 90028',
        },
        copyrightText: {
          type: String,
          default: '© 2026 CineCraft Media. All rights reserved.',
        },
        socialLinks: [
          {
            platform: String,
            url: String,
          },
        ],
      },
    },

    // Dynamic Asset & Image Management
    assets: [
      {
        section: {
          type: String,
          required: true,
        },
        key: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        altText: {
          type: String,
          default: '',
        },
        aspectRatio: {
          type: String,
          default: '16:9',
        },
        storageType: {
          type: String,
          enum: ['local', 'cloudinary', 's3', 'external'],
          default: 'local',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
