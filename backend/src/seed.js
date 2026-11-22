import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { SiteSettings } from './models/SiteSettings.js';
import { Lead } from './models/Lead.js';
import { Invoice } from './models/Invoice.js';
import { User } from './models/User.js';

dotenv.config();

const seedDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinecraft_media';

  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    console.log('[Seeder] Cleaning existing sample collections...');
    await Promise.all([
      SiteSettings.deleteMany({}),
      Lead.deleteMany({}),
      Invoice.deleteMany({}),
      User.deleteMany({}),
    ]);

    // 1. Seed Admin User
    console.log('[Seeder] Creating Initial Admin...');
    const admin = await User.create({
      email: 'admin@cinecraftmedia.com',
      name: 'Creative Director',
      role: 'superadmin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    // 2. Seed Default Site Settings (matching CineCraft Media brand)
    console.log('[Seeder] Creating Default Site Settings...');
    await SiteSettings.create({
      theme: {
        fontFamilyPrimary: 'Syne, sans-serif',
        fontFamilySecondary: 'Inter, sans-serif',
        fontFamilyDisplay: 'Syne, sans-serif',
        colorPrimary: '#ff5121', // LxL Electric Orange
        colorSecondary: '#670b22', // Burgundy
        colorAccentBlue: '#055dff', // Electric Royal Blue
        colorBackground: '#0a0a0c',
        colorSurface: '#121216',
        colorText: '#ffffff',
        colorTextMuted: '#8f9099',
        borderStyle: 'rounded-md',
      },
      sections: {
        hero: {
          headline: 'WE CRAFT VISIONARY CINEMATIC EXPERIENCES',
          eyebrow: 'CineCraft Media & Studios',
          subheadline: 'Next-generation film production, cutting-edge equipment rental, and post-production mastery.',
          ctaText: 'Explore Projects',
          ctaLink: '#featured-projects',
          secondaryCtaText: 'Rent Equipment',
          secondaryCtaLink: '/equipments',
        },
        about: {
          eyebrow: 'Why CineCraft',
          title: 'Where Visionary Stories Meet Relentless Craftsmanship',
          description: 'From high-octane commercial productions to award-winning cinematic features, we empower creators with state-of-the-art camera systems, precision optics, and bespoke soundstages.',
          bulletPoints: [
            { title: 'Global Cinema Cameras', description: 'ARRI Alexa 35, Sony Venice 2, RED V-Raptor XL packages.' },
            { title: 'Bespoke Optics', description: 'Cooke Anamorphic, Master Primes, and vintage rehoused lenses.' },
            { title: 'Virtual Production Stages', description: 'State-of-the-art LED volumes and acoustically isolated stages.' },
          ],
        },
        services: {
          title: 'Production Verticals',
          subtitle: 'End-to-end cinematic solutions tailored for high-profile productions.',
        },
        studios: {
          title: 'Cinecraft Studios',
          subtitle: 'Acoustically treated soundstages, virtual production volume, and full grip packages.',
          ctaText: 'Book Studio Space',
        },
        footer: {
          tagline: 'Pioneering Cinematic Excellence Worldwide.',
          contactEmail: 'contact@cinecraftmedia.com',
          contactPhone: '+1 (555) 019-2834',
          address: '742 Evergreen Studio Complex, Los Angeles, CA 90028',
          copyrightText: '© 2026 CineCraft Media. All rights reserved.',
          socialLinks: [
            { platform: 'Instagram', url: 'https://instagram.com' },
            { platform: 'Vimeo', url: 'https://vimeo.com' },
            { platform: 'LinkedIn', url: 'https://linkedin.com' },
          ],
        },
      },
      assets: [
        {
          section: 'hero',
          key: 'hero_background',
          url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80',
          altText: 'CineCraft Cinema Camera Rig',
          aspectRatio: '16:9',
          storageType: 'external',
        },
      ],
      updatedBy: admin._id,
    });

    // 3. Seed Sample Client Leads
    console.log('[Seeder] Creating Initial Client Leads...');
    const lead1 = await Lead.create({
      name: 'Elena Rostova',
      email: 'elena@vanguardpictures.com',
      phone: '+1 (310) 849-2041',
      company: 'Vanguard Pictures',
      projectType: 'Feature Film',
      budget: '$250,000+',
      message: 'Seeking a 4-week equipment rental package: ARRI Alexa 35, Cooke Anamorphic /i Full Frame Plus lenses, and lighting grip truck for an upcoming sci-fi feature.',
      source: 'Website Contact Form',
      status: 'In Contact',
      notes: [
        { author: 'Director', text: 'Spoke on call regarding shoot schedule starting late November.' },
      ],
    });

    const lead2 = await Lead.create({
      name: 'Marcus Sterling',
      email: 'm.sterling@apexautomotive.tv',
      phone: '+1 (415) 902-1144',
      company: 'Apex Automotive Brand',
      projectType: 'Commercial',
      budget: '$85,000',
      message: 'Need high-speed Phantom Flex4K and motion control rig for national television commercial commercial spot.',
      source: 'Website Contact Form',
      status: 'Proposal Sent',
      notes: [
        { author: 'Admin', text: 'Sent custom invoice for initial 50% deposit.' },
      ],
    });

    const lead3 = await Lead.create({
      name: 'Amara Chen',
      email: 'amara@solstice-sound.io',
      phone: '+44 20 7946 0912',
      company: 'Solstice Records London',
      projectType: 'Music Video',
      budget: '$45,000',
      message: 'Looking to book CineCraft Stage A for 3 full production days with LED backdrop volume.',
      source: 'Website Contact Form',
      status: 'Converted',
    });

    // 4. Seed Invoices
    console.log('[Seeder] Creating Sample Invoices...');
    const invoice1 = await Invoice.create({
      invoiceNumber: 'CCM-2026-0101',
      leadId: lead2._id,
      clientName: lead2.name,
      clientEmail: lead2.email,
      clientCompany: lead2.company,
      clientAddress: '100 Financial Center, San Francisco, CA',
      currency: 'USD',
      items: [
        { description: 'Phantom Flex4K High-Speed Camera Package (3 Days)', quantity: 3, unitPrice: 4500, amount: 13500 },
        { description: 'Motion Control Bolt Rig with Technician Operator', quantity: 3, unitPrice: 3800, amount: 11400 },
        { description: 'High-Speed Lighting Package & Crew', quantity: 1, unitPrice: 7500, amount: 7500 },
      ],
      subtotal: 32400,
      taxPercentage: 8.5,
      taxAmount: 2754,
      discountPercentage: 5,
      discountAmount: 1620,
      totalAmount: 33534,
      status: 'Sent',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Initial 50% retainer due on confirmation. Balance due upon wrap.',
    });

    lead2.invoices.push(invoice1._id);
    await lead2.save();

    await Invoice.create({
      invoiceNumber: 'CCM-2026-0102',
      leadId: lead3._id,
      clientName: lead3.name,
      clientEmail: lead3.email,
      clientCompany: lead3.company,
      clientAddress: '14 Soho Square, London W1D 3QG, UK',
      currency: 'USD',
      items: [
        { description: 'Stage A Soundstage Rental (3 Days)', quantity: 3, unitPrice: 6000, amount: 18000 },
        { description: 'Virtual LED Volume Operation & Unreal Engine Tech', quantity: 3, unitPrice: 3500, amount: 10500 },
      ],
      subtotal: 28500,
      taxPercentage: 0,
      taxAmount: 0,
      discountPercentage: 0,
      discountAmount: 0,
      totalAmount: 28500,
      status: 'Paid',
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Paid in full via international wire transfer.',
    });

    console.log('[Seeder] Database seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]', error);
    process.exit(1);
  }
};

seedDatabase();
