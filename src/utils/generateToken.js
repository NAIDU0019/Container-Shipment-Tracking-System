import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: '7d'
  });
};