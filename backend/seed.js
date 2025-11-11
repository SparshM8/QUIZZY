const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Exam = require('./models/Exam');
const Certificate = require('./models/Certificate');
const Notification = require('./models/Notification');
require('dotenv').config();

// Helper function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureexam', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Certificate.deleteMany({});
    await Notification.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create admin user
    // NOTE: Use plaintext here so Mongoose pre-save middleware hashes the password once.
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@quizzy.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Created admin user');

    // Create sample students
    const studentPassword = await hashPassword('student123');
    const students = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john@student.com',
        password: studentPassword,
        role: 'student',
        isActive: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@student.com',
        password: studentPassword,
        role: 'student',
        isActive: true
      },
      {
        name: 'Mike Johnson',
        email: 'mike@student.com',
        password: studentPassword,
        role: 'student',
        isActive: true
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@student.com',
        password: studentPassword,
        role: 'student',
        isActive: true
      }
    ]);
    console.log('✅ Created sample students');

    // Create sample exams
    const exams = await Exam.insertMany([
      {
        title: 'Mathematics Fundamentals',
        description: 'Basic mathematics concepts including algebra, geometry, and calculus',
        subject: 'Mathematics',
        duration: 60, // 60 minutes
        totalQuestions: 20,
        passingScore: 70,
        status: 'active',
        questions: [
          {
            text: 'What is the derivative of x²?',
            options: ['2x', 'x', '2', 'x²'],
            correctAnswer: 0,
            difficulty: 'Medium',
            points: 5,
            explanation: 'The derivative of x² is 2x using the power rule.'
          },
          {
            text: 'Solve for x: 2x + 5 = 15',
            options: ['5', '10', '7.5', '20'],
            correctAnswer: 0,
            difficulty: 'Easy',
            points: 3,
            explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5.'
          },
          {
            text: 'What is the value of π (pi) approximately?',
            options: ['3.14', '2.71', '1.61', '4.20'],
            correctAnswer: 0,
            difficulty: 'Easy',
            points: 2,
            explanation: 'π is approximately 3.14159...'
          },
          {
            text: 'What is the integral of 2x dx?',
            options: ['x²', '2x²', 'x² + C', '2x² + C'],
            correctAnswer: 0,
            difficulty: 'Medium',
            points: 5,
            explanation: 'The integral of 2x is x² + C.'
          },
          {
            text: 'What is the Pythagorean theorem?',
            options: ['a² + b² = c²', 'a² - b² = c²', 'a² × b² = c²', 'a² ÷ b² = c²'],
            correctAnswer: 0,
            difficulty: 'Easy',
            points: 3,
            explanation: 'In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.'
          }
        ],
        createdBy: admin._id,
        participants: students.map(s => s._id)
      },
      {
        title: 'Physics Mechanics',
        description: 'Newtonian mechanics, forces, motion, and energy',
        subject: 'Physics',
        duration: 90,
        totalQuestions: 25,
        passingScore: 75,
        status: 'active',
        questions: [
          {
            text: 'What is Newton\'s First Law of Motion?',
            options: ['An object at rest stays at rest', 'Force equals mass times acceleration', 'For every action there is an equal reaction', 'Energy cannot be created or destroyed'],
            correctAnswer: 0,
            difficulty: 'Easy',
            points: 4,
            explanation: 'Newton\'s First Law states that an object at rest stays at rest, and an object in motion stays in motion unless acted upon by an unbalanced force.'
          },
          {
            text: 'What is the SI unit of force?',
            options: ['Watt', 'Joule', 'Newton', 'Pascal'],
            correctAnswer: 2,
            difficulty: 'Easy',
            points: 3,
            explanation: 'The SI unit of force is Newton (N).'
          },
          {
            text: 'What is the acceleration due to gravity on Earth?',
            options: ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '12 m/s²'],
            correctAnswer: 0,
            difficulty: 'Medium',
            points: 5,
            explanation: 'The acceleration due to gravity on Earth is approximately 9.8 m/s².'
          }
        ],
        createdBy: admin._id,
        participants: students.slice(0, 2).map(s => s._id) // First 2 students
      },
      {
        title: 'Chemistry Basics',
        description: 'Fundamental concepts in chemistry including atoms, molecules, and reactions',
        subject: 'Chemistry',
        duration: 45,
        totalQuestions: 15,
        passingScore: 65,
        status: 'scheduled',
        questions: [
          {
            text: 'What is the atomic number of Carbon?',
            options: ['6', '12', '14', '16'],
            correctAnswer: 0,
            difficulty: 'Easy',
            points: 2,
            explanation: 'Carbon has atomic number 6.'
          },
          {
            text: 'What is the chemical formula for water?',
            options: ['H2O', 'CO2', 'O2', 'H2O2'],
            correctAnswer: 0,
            difficulty: 'Easy',
            points: 2,
            explanation: 'Water has the chemical formula H2O.'
          }
        ],
        createdBy: admin._id,
        participants: []
      }
    ]);
    console.log('✅ Created sample exams');

    // Create sample certificates
    const certificates = await Certificate.insertMany([
      {
        certificateId: `CERT-${Date.now()}-001`,
        student: students[0]._id,
        exam: exams[0]._id,
        score: 85,
        grade: 'A',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        issuedBy: admin._id,
        certificateUrl: `https://secureexam.com/certificates/CERT-${Date.now()}-001`,
        verificationCode: `VER-${Date.now()}-001`
      },
      {
        certificateId: `CERT-${Date.now()}-002`,
        student: students[1]._id,
        exam: exams[0]._id,
        score: 92,
        grade: 'A+',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        issuedBy: admin._id,
        certificateUrl: `https://secureexam.com/certificates/CERT-${Date.now()}-002`,
        verificationCode: `VER-${Date.now()}-002`
      }
    ]);
    console.log('✅ Created sample certificates');

    // Create sample notifications
    const notifications = await Notification.insertMany([
      {
        title: 'Welcome to Quizzy!',
        message: 'Your account has been created successfully. You can now take exams and earn certificates.',
        recipient: students[0]._id,
        type: 'info',
        priority: 'medium',
        sender: admin._id
      },
      {
        title: 'New Exam Available',
        message: 'Mathematics Fundamentals exam is now available. Duration: 60 minutes.',
        recipient: students[0]._id,
        type: 'exam',
        priority: 'high',
        sender: admin._id,
        relatedExam: exams[0]._id
      },
      {
        title: 'Certificate Earned!',
        message: 'Congratulations! You have earned a certificate for Mathematics Fundamentals.',
        recipient: students[0]._id,
        type: 'certificate',
        priority: 'high',
        sender: admin._id,
        relatedCertificate: certificates[0]._id
      }
    ]);
    console.log('✅ Created sample notifications');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Admin: admin@secureexam.com / admin123');
    console.log('Students: [name]@student.com / student123');
    console.log('  - john@student.com');
    console.log('  - jane@student.com');
    console.log('  - mike@student.com');
    console.log('  - sarah@student.com');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.log('\n🔧 Setup Instructions:');
    console.log('1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.log('   OR');
    console.log('2. Use MongoDB Atlas (free cloud): https://www.mongodb.com/atlas');
    console.log('3. Update MONGODB_URI in .env file with your connection string');
    console.log('4. Run this script again: node seed.js');
  } finally {
    try {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    } catch (closeError) {
      console.log('⚠️  Could not close database connection:', closeError.message);
    }
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };