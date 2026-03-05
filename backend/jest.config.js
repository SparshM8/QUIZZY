module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageThreshold: {
    global: { branches: 50, functions: 70, lines: 75 }
  }
};

// MongoDB Memory Server config
process.env.MONGOMS_VERSION = "8.0.11";
process.env.MONGOMS_DEBUG = "0";
