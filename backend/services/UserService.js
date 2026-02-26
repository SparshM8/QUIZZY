const { User } = require('../models');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const bcrypt = require('bcryptjs');

class UserService {
  // Create a new user
  static async createUser(userData) {
    try {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      const user = await User.create({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        role: userData.role || 'student'
      });

      return this.sanitizeUser(user);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    return user;
  }

  // Find user by ID
  static async findById(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  // Find user for authentication (includes password)
  static async findForAuth(email) {
    const user = await User.findOne({ where: { email: email.toLowerCase(), isActive: true } });
    return user;
  }

  // Update user
  static async updateUser(id, updateData) {
    try {
      const user = await this.findById(id);
      
      // Don't allow email change if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: updateData.email.toLowerCase() } });
        if (existingUser) {
          throw new ConflictError('Email already in use');
        }
      }

      await user.update(updateData);
      return this.sanitizeUser(user);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(user, candidatePassword) {
    return await bcrypt.compare(candidatePassword, user.password);
  }

  // Increment login attempts
  static async incLoginAttempts(userId) {
    const user = await this.findById(userId);
    user.loginAttempts += 1;

    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }

    await user.save();
    return user;
  }

  // Reset login attempts
  static async resetLoginAttempts(userId) {
    const user = await this.findById(userId);
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  // Check if account is locked
  static isLocked(user) {
    return user.lockUntil && user.lockUntil > new Date();
  }

  // Get all users (admin)
  static async getAllUsers(options = {}) {
    const { limit = 10, offset = 0, role } = options;
    const where = {};
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      attributes: { exclude: ['password'] }
    });

    return { total: count, data: rows };
  }

  // Sanitize user (remove sensitive data)
  static sanitizeUser(user) {
    if (!user) return null;
    const userData = user.toJSON();
    delete userData.password;
    return userData;
  }
}

module.exports = UserService;
