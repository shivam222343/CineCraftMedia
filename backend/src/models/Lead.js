import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    projectType: {
      type: String,
      enum: ['Feature Film', 'Commercial', 'Music Video', 'Equipment Rental', 'Studio Space', 'Post-Production', 'Other'],
      default: 'Commercial',
    },
    budget: {
      type: String,
      default: 'Undisclosed',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      default: 'Website Contact Form',
    },
    status: {
      type: String,
      enum: ['New', 'In Contact', 'Proposal Sent', 'Converted', 'Closed'],
      default: 'New',
      index: true,
    },
    notes: [
      {
        author: {
          type: String,
          default: 'Admin',
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    invoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
      },
    ],
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ name: 'text', email: 'text', company: 'text', message: 'text' });

export const Lead = mongoose.model('Lead', leadSchema);
