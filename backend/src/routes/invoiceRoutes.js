import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  downloadInvoicePDF,
} from '../controllers/invoiceController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protected Invoicing routes
router.post('/admin/invoices', requireAuth, requireAdmin, createInvoice);
router.get('/admin/invoices', requireAuth, requireAdmin, getInvoices);
router.get('/admin/invoices/:id', requireAuth, requireAdmin, getInvoiceById);
router.patch('/admin/invoices/:id/status', requireAuth, requireAdmin, updateInvoiceStatus);
router.get('/admin/invoices/:id/pdf', requireAuth, requireAdmin, downloadInvoicePDF);

export default router;
