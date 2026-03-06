const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['apartment', 'house', 'villa', 'commercial', 'land'],
    required: [true, 'Property type is required']
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'rented', 'under-contract'],
    default: 'available'
  },
  price: {
    type: Number,
    required: [true, 'Property price is required'],
    min: 0
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'USA',
      trim: true
    }
  },
  features: {
    bedrooms: {
      type: Number,
      min: 0
    },
    bathrooms: {
      type: Number,
      min: 0
    },
    area: {
      type: Number,
      required: [true, 'Property area is required'],
      min: 0
    },
    parking: {
      type: Number,
      min: 0,
      default: 0
    },
    yearBuilt: {
      type: Number,
      min: 1800
    }
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  listedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better search performance
propertySchema.index({ title: 'text', description: 'text' });
propertySchema.index({ type: 1, status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ 'address.city': 'text' });

module.exports = mongoose.model('Property', propertySchema);
