const containerSchema = {
  containerId: {
    type: 'text',
    required: true,
    unique: true
  },
  type: {
    type: 'text',
    required: true,
    enum: ['20ft', '40ft', '45ft']
  },
  status: {
    type: 'text',
    enum: ['available', 'booked', 'in-transit', 'delivered'],
    default: 'available'
  },
  location: {
    type: 'geography(point)',
    required: true
  },
  owner: {
    type: 'uuid',
    required: true
  },
  price: {
    type: 'numeric',
    required: true
  }
};

export default containerSchema;