import { Lead } from '../models/Lead.js';
import { getIsMongoConnected } from '../config/db.js';

// In-Memory Lead Store for offline / disconnected DB failover
const memoryLeads = [
  {
    _id: '67c134000000000000000010',
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
      { author: 'Director', text: 'Spoke on call regarding shoot schedule starting late November.', createdAt: new Date() },
    ],
    invoices: [],
    createdAt: new Date(),
  },
];

// POST /api/v1/contact (Public contact form ingestion)
export const createPublicLead = async (req, res) => {
  try {
    const { name, email, phone, company, projectType, budget, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    if (getIsMongoConnected()) {
      const lead = await Lead.create({
        name,
        email,
        phone: phone || '',
        company: company || '',
        projectType: projectType || 'Commercial',
        budget: budget || 'Undisclosed',
        message,
        source: 'Website Contact Form',
        status: 'New',
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your inquiry has been received. Our team will contact you shortly.',
        leadId: lead._id,
      });
    }

    // Failover fallback
    const memLead = {
      _id: `mem-${Date.now()}`,
      name,
      email,
      phone: phone || '',
      company: company || '',
      projectType: projectType || 'Commercial',
      budget: budget || 'Undisclosed',
      message,
      source: 'Website Contact Form',
      status: 'New',
      createdAt: new Date(),
    };
    memoryLeads.unshift(memLead);

    return res.status(201).json({
      success: true,
      message: 'Inquiry received successfully (offline failover store).',
      leadId: memLead._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/leads (Admin Search, Filter & Pagination)
export const getLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', sortBy = 'createdAt', order = 'desc' } = req.query;

    if (getIsMongoConnected()) {
      const query = {};
      if (status && status !== 'All') {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const sortOrder = order === 'asc' ? 1 : -1;

      const [leads, total] = await Promise.all([
        Lead.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(parseInt(limit, 10))
          .populate('invoices', 'invoiceNumber totalAmount status'),
        Lead.countDocuments(query),
      ]);

      return res.json({
        success: true,
        data: leads,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    }

    // Failover
    let filtered = [...memoryLeads];
    if (status && status !== 'All') {
      filtered = filtered.filter((l) => l.status === status);
    }
    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.email.toLowerCase().includes(search.toLowerCase()) ||
          (l.company && l.company.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return res.json({
      success: true,
      data: filtered,
      pagination: {
        page: 1,
        limit: 10,
        total: filtered.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/leads/:id
export const getLeadById = async (req, res) => {
  try {
    if (getIsMongoConnected()) {
      const lead = await Lead.findById(req.params.id).populate('invoices');
      if (!lead) return res.status(404).json({ success: false, message: 'Client lead not found.' });
      return res.json({ success: true, lead });
    }

    const lead = memoryLeads.find((l) => l._id === req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Client lead not found.' });
    return res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/leads/:id/status
export const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['New', 'In Contact', 'Proposal Sent', 'Converted', 'Closed'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    if (getIsMongoConnected()) {
      const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
      return res.json({ success: true, message: `Status updated to ${status}`, lead });
    }

    const lead = memoryLeads.find((l) => l._id === req.params.id);
    if (lead) {
      lead.status = status;
      return res.json({ success: true, message: `Status updated to ${status}`, lead });
    }
    return res.status(404).json({ success: false, message: 'Lead not found.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/leads/:id/notes
export const addLeadNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Note text is required.' });

    if (getIsMongoConnected()) {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

      lead.notes.push({
        author: req.user?.name || 'Admin',
        text,
        createdAt: new Date(),
      });

      await lead.save();
      return res.status(201).json({ success: true, lead });
    }

    const lead = memoryLeads.find((l) => l._id === req.params.id);
    if (lead) {
      if (!lead.notes) lead.notes = [];
      lead.notes.push({
        author: req.user?.name || 'Admin',
        text,
        createdAt: new Date(),
      });
      return res.status(201).json({ success: true, lead });
    }
    return res.status(404).json({ success: false, message: 'Lead not found.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
