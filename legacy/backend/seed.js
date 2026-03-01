const { sequelize, User, Exam, Certificate, Notification } = require('./models');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MySQL...');
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    await sequelize.sync({ force: true });
    console.log('✅ Database schema synced');

    const admin = await User.create({
      name: 'System Super Admin',
      email: 'admin@quizzy.com',
      password: 'admin123',
      role: 'super_admin'
    });
    console.log('✅ Created super admin user');

    await User.create({
      name: 'Platform Admin',
      email: 'ops@quizzy.com',
      password: 'admin123',
      role: 'admin'
    });

    await User.create({
      name: 'Program Manager',
      email: 'manager@quizzy.com',
      password: 'manager123',
      role: 'manager'
    });
    console.log('✅ Created admin and manager users');

    const students = await Promise.all([
      User.create({
        name: 'John Doe',
        email: 'john@student.com',
        password: 'student123',
        role: 'student'
      }),
      User.create({
        name: 'Jane Smith',
        email: 'jane@student.com',
        password: 'student123',
        role: 'student'
      }),
      User.create({
        name: 'Mike Johnson',
        email: 'mike@student.com',
        password: 'student123',
        role: 'student'
      }),
      User.create({
        name: 'Sarah Wilson',
        email: 'sarah@student.com',
        password: 'student123',
        role: 'student'
      })
    ]);
    console.log('✅ Created sample students');

    const exams = await Promise.all([
      Exam.create({
        title: 'Mathematics Fundamentals',
        description: 'Basic mathematics concepts including algebra, geometry, and calculus',
        subject: 'Mathematics',
        duration: 60,
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
        createdById: admin.id,
        analytics: {
          enrolledStudents: students.map((student) => student.id),
          totalParticipants: students.length
        }
      }),
      Exam.create({
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
        createdById: admin.id,
        analytics: {
          enrolledStudents: students.slice(0, 2).map((student) => student.id),
          totalParticipants: 2
        }
      }),
      Exam.create({
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
        createdById: admin.id,
        analytics: {
          enrolledStudents: [],
          totalParticipants: 0
        }
      })
    ]);
    console.log('✅ Created sample exams');

    const certificates = await Promise.all([
      Certificate.create({
        certificateId: `CERT-${Date.now()}-001`,
        studentId: students[0].id,
        examId: exams[0].id,
        score: 85,
        grade: 'A',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        issuedById: admin.id,
        certificateUrl: `https://secureexam.com/certificates/CERT-${Date.now()}-001`,
        qrCode: `https://example.com/qr/CERT-${Date.now()}-001`,
        verificationCode: `VER-${Date.now()}-001`
      }),
      Certificate.create({
        certificateId: `CERT-${Date.now()}-002`,
        studentId: students[1].id,
        examId: exams[0].id,
        score: 92,
        grade: 'A+',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        issuedById: admin.id,
        certificateUrl: `https://secureexam.com/certificates/CERT-${Date.now()}-002`,
        qrCode: `https://example.com/qr/CERT-${Date.now()}-002`,
        verificationCode: `VER-${Date.now()}-002`
      })
    ]);
    console.log('✅ Created sample certificates');

    await Promise.all([
      Notification.create({
        title: 'Welcome to Quizzy!',
        message: 'Your account has been created successfully. You can now take exams and earn certificates.',
        recipientId: students[0].id,
        type: 'info',
        priority: 'medium',
        senderId: admin.id
      }),
      Notification.create({
        title: 'New Exam Available',
        message: 'Mathematics Fundamentals exam is now available. Duration: 60 minutes.',
        recipientId: students[0].id,
        type: 'exam',
        priority: 'high',
        senderId: admin.id,
        relatedExamId: exams[0].id
      }),
      Notification.create({
        title: 'Certificate Earned!',
        message: 'Congratulations! You have earned a certificate for Mathematics Fundamentals.',
        recipientId: students[0].id,
        type: 'certificate',
        priority: 'high',
        senderId: admin.id,
        relatedCertificateId: certificates[0].id
      })
    ]);
    console.log('✅ Created sample notifications');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Super Admin: admin@quizzy.com / admin123');
    console.log('Admin: ops@quizzy.com / admin123');
    console.log('Manager: manager@quizzy.com / manager123');
    console.log('Students: [name]@student.com / student123');
    console.log('  - john@student.com');
    console.log('  - jane@student.com');
    console.log('  - mike@student.com');
    console.log('  - sarah@student.com');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.log('\n🔧 Setup Instructions:');
    console.log('1. Install MySQL locally or use a managed instance');
    console.log('2. Update DB_* settings in backend .env file');
    console.log('3. Run this script again: node seed.js');
  } finally {
    try {
      await sequelize.close();
      console.log('✅ Database connection closed');
    } catch (closeError) {
      console.log('⚠️  Could not close database connection:', closeError.message);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };