import fs from 'fs';
import { Invoice } from '../models/Invoice.js';
import { Lead } from '../models/Lead.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { getIsMongoConnected } from '../config/db.js';

const memoryInvoices = [
  {
    _id: '67c134000000000000000020',
    invoiceNumber: 'CCM-2026-0101',
    clientName: 'Marcus Sterling',
    clientEmail: 'm.sterling@apexautomotive.tv',
    clientCompany: 'Apex Automotive Brand',
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
    dueDate: new Date(Date.now() + 14 * 86400000),
    issueDate: new Date(),
    notes: 'Initial 50% retainer due on confirmation. Balance due upon wrap.',
    createdAt: new Date(),
  },
];

const calculateTotals = (items, taxPercentage = 0, discountPercentage = 0) => {
  const processedItems = (items || []).map((item) => ({
    description: item.description || 'Service Line Item',
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
  }));

  const subtotal = processedItems.reduce((acc, item) => acc + item.amount, 0);
  const discountAmount = Number(((subtotal * (Number(discountPercentage) || 0)) / 100).toFixed(2));
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(((taxableBase * (Number(taxPercentage) || 0)) / 100).toFixed(2));
  const totalAmount = Number((taxableBase + taxAmount).toFixed(2));

  return { items: processedItems, subtotal, discountAmount, taxAmount, totalAmount };
};

// POST /api/admin/invoices
export const createInvoice = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      clientCompany,
      clientAddress,
      currency = 'USD',
      items = [],
      taxPercentage = 0,
      discountPercentage = 0,
      dueDate,
      notes,
      leadId,
      status = 'Draft',
    } = req.body;

    if (!clientName || !clientEmail || !dueDate) {
      return res.status(400).json({ success: false, message: 'Client name, email, and due date are required.' });
    }

    const { items: processedItems, subtotal, discountAmount, taxAmount, totalAmount } = calculateTotals(
      items,
      taxPercentage,
      discountPercentage
    );

    const datePrefix = new Date().getFullYear();
    const count = memoryInvoices.length + 101;
    const invoiceNumber = `CCM-${datePrefix}-${String(count).padStart(4, '0')}`;

    if (getIsMongoConnected()) {
      const invoice = await Invoice.create({
        invoiceNumber,
        leadId: leadId || null,
        clientName,
        clientEmail,
        clientCompany: clientCompany || '',
        clientAddress: clientAddress || '',
        currency,
        items: processedItems,
        subtotal,
        taxPercentage: Number(taxPercentage) || 0,
        taxAmount,
        discountPercentage: Number(discountPercentage) || 0,
        discountAmount,
        totalAmount,
        status,
        dueDate: new Date(dueDate),
        notes: notes || 'Payment due within specified due date.',
      });

      if (leadId) {
        try {
          await Lead.findByIdAndUpdate(leadId, { $addToSet: { invoices: invoice._id }, status: 'Proposal Sent' });
        } catch {}
      }

      generateInvoicePDF(invoice).catch(() => {});
      return res.status(201).json({ success: true, message: 'Invoice generated successfully.', invoice });
    }

    // Failover
    const memInv = {
      _id: `inv-${Date.now()}`,
      invoiceNumber,
      clientName,
      clientEmail,
      clientCompany: clientCompany || '',
      clientAddress: clientAddress || '',
      currency,
      items: processedItems,
      subtotal,
      taxPercentage: Number(taxPercentage) || 0,
      taxAmount,
      discountPercentage: Number(discountPercentage) || 0,
      discountAmount,
      totalAmount,
      status,
      dueDate: new Date(dueDate),
      notes: notes || 'Payment terms: net 14 days.',
      createdAt: new Date(),
    };
    memoryInvoices.unshift(memInv);
    generateInvoicePDF(memInv).catch(() => {});

    return res.status(201).json({ success: true, message: 'Invoice generated successfully (failover store).', invoice: memInv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/invoices
export const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', sortBy = 'createdAt', order = 'desc' } = req.query;

    if (getIsMongoConnected()) {
      const query = {};
      if (status && status !== 'All') query.status = status;
      if (search) {
        query.$or = [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
          { clientEmail: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const sortOrder = order === 'asc' ? 1 : -1;

      const [invoices, total] = await Promise.all([
        Invoice.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(parseInt(limit, 10))
          .populate('leadId', 'name email company projectType'),
        Invoice.countDocuments(query),
      ]);

      return res.json({
        success: true,
        data: invoices,
        pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) || 1 },
      });
    }

    let filtered = [...memoryInvoices];
    if (status && status !== 'All') filtered = filtered.filter((i) => i.status === status);
    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          i.clientName.toLowerCase().includes(search.toLowerCase()) ||
          i.clientEmail.toLowerCase().includes(search.toLowerCase())
      );
    }

    return res.json({
      success: true,
      data: filtered,
      pagination: { page: 1, limit: 10, total: filtered.length, totalPages: 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    if (getIsMongoConnected()) {
      const invoice = await Invoice.findById(req.params.id).populate('leadId');
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
      return res.json({ success: true, invoice });
    }

    const invoice = memoryInvoices.find((i) => i._id === req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    return res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/invoices/:id/status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    if (getIsMongoConnected()) {
      const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
      return res.json({ success: true, message: `Invoice status changed to ${status}`, invoice });
    }

    const invoice = memoryInvoices.find((i) => i._id === req.params.id);
    if (invoice) {
      invoice.status = status;
      return res.json({ success: true, message: `Invoice status changed to ${status}`, invoice });
    }
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/invoices/:id/pdf
export const downloadInvoicePDF = async (req, res) => {
  try {
    let invoice = null;
    if (getIsMongoConnected()) {
      invoice = await Invoice.findById(req.params.id);
    } else {
      invoice = memoryInvoices.find((i) => i._id === req.params.id);
    }

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const pdfPath = await generateInvoicePDF(invoice);

    if (fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
      return fs.createReadStream(pdfPath).pipe(res);
    }
    return res.status(500).json({ success: false, message: 'Failed to generate PDF document.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
