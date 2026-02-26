const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: [1, 50]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      lowercase: true,
      validate: {
        isEmail: { msg: 'Please enter a valid email' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
        len: [6, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('student', 'admin'),
      defaultValue: 'student'
    },
    avatar: {
      type: DataTypes.STRING(255),
      defaultValue: ''
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        notifications: { email: true, browser: true, examReminders: true },
        theme: 'light'
      }
    }
  }, {
    timestamps: true,
    tableName: 'users',
    indexes: [
      { fields: ['email'] },
      { fields: ['isActive'] }
    ]
  });

  // Hash password before saving
  User.beforeCreate(async (user) => {
    if (user.password) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password') && user.password) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  // Instance method to compare password
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Instance method to increment login attempts
  User.prototype.incLoginAttempts = async function() {
    this.loginAttempts += 1;

    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }

    return this.save();
  };

  // Instance method to reset login attempts
  User.prototype.resetLoginAttempts = async function() {
    this.loginAttempts = 0;
    this.lockUntil = null;
    this.lastLogin = new Date();
    return this.save();
  };

  // Getter for isLocked
  User.prototype.isLocked = function() {
    return this.lockUntil && this.lockUntil > new Date();
  };

  // Static method to find user for auth
  User.findForAuth = function(email) {
    return this.findOne({ where: { email, isActive: true } });
  };

  return User;
};
