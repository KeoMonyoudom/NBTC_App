import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import UserInfo from "../models/user.info.model.js";
import Role from "../models/role.model.js";
import Branch from "../models/branch.model.js";

dotenv.config();
const dbName = process.env.MONGO_DB_NAME || "nbtc";
const mongoURI = process.env.MONGO_URI || "mongodb://nbtc-db:27017";

// Connect to DB (Modify with your actual connection string)
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      dbName: dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// --- Helper for minimal random UserInfo ---
const createMinimalUserInfo = (firstName, lastName) => {
  return {
    firstName,
    lastName,
    gender: faker.helpers.arrayElement(["M", "F"]),
    dateOfBirth: faker.date.birthdate({ min: 25, max: 55, mode: "age" }),
    maritalStatus: faker.helpers.arrayElement(["Single", "Married"]),
    occupation: faker.person.jobTitle(),
    address: faker.location.streetAddress(),
    phoneNumber: faker.phone.number("###-###-####"),
    email: faker.internet.email({
      firstName,
      lastName,
      provider: "nbtc.gov.kh",
    }),
    // Skipping complex identifications for seeding simplicity
    identifications: [],
    deleted: false,
  };
};

const importData = async () => {
  try {
    await connectDB();
    // --- 0. DESTROY DATA ---
    await destroyData();

    // --- 1. CREATE ROLES & MAP IDs ---
    const rolesData = [
      { name: "SystemAdmin", description: "Full system access all" },
      { name: "Admin", description: "Full system access" },
      { name: "Manager", description: "Branch management" },
      { name: "Staff", description: "Daily operations" },
      { name: "Viewer", description: "Read-only access" },
      { name: "User", description: "User registered by mobile" },
    ];
    const createdRoles = await Role.insertMany(rolesData);
    const roleMap = {};
    createdRoles.forEach((role) => {
      roleMap[role.name] = role._id;
    });
    console.log(`Seeded ${createdRoles.length} Roles.`);

    // --- 2. CREATE NBTC BRANCH ---
    const nbtcBranchData = {
      name: "nbtc", // Specific name
      address: faker.location.streetAddress("##"),
      city: faker.location.city(),
      phone: faker.phone.number("###-####"),
      isActive: true,
    };
    const createdBranch = await Branch.create(nbtcBranchData);
    const nbtcBranchId = createdBranch._id;
    console.log(`Seeded Branch: nbtc.`);

    // --- 3. PREPARE COMMON DATA (Password & Users) ---
    const plainPassword = "12345678";
    // --- 🚨 MANUAL HASHING START 🚨 ---
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    // --- 🚨 MANUAL HASHING END 🚨 ---

    const foundationalUsers = [
      {
        username: "SystemAdmin",
        roleName: "SystemAdmin",
        firstName: "Administrator",
        lastName: "System",
      },
      {
        username: "admin",
        roleName: "Admin",
        firstName: "Alice",
        lastName: "Admin",
      },
      {
        username: "manager",
        roleName: "Manager",
        firstName: "Bob",
        lastName: "Manager",
      },
      {
        username: "staff",
        roleName: "Staff",
        firstName: "Charlie",
        lastName: "Staff",
      },
      {
        username: "viewer",
        roleName: "Viewer",
        firstName: "David",
        lastName: "Viewer",
      },
      {
        username: "user",
        roleName: "user",
        firstName: "Guest",
        lastName: "User",
      },
    ];

    // --- 4. CREATE USER INFOS & BUILD USER DATA ---
    const userDocumentsToInsert = [];

    for (const userData of foundationalUsers) {
      // Create UserInfo first
      const userInfoData = createMinimalUserInfo(
        userData.firstName,
        userData.lastName
      );
      const userInfoDoc = await UserInfo.create(userInfoData);

      // Build the final User document
      userDocumentsToInsert.push({
        username: userData.username,
        fullName: `${userData.firstName} ${userData.lastName}`,
        password: hashedPassword,
        roleId: [roleMap[userData.roleName]],
        branchId: nbtcBranchId, // Link to nbtc branch
        userInfoId: userInfoDoc._id, // Link to UserInfo
        isActive: true,
      });
    }

    // --- 5. INSERT USERS ---
    const createdUsers = await User.insertMany(userDocumentsToInsert);
    console.log(
      `Seeded ${createdUsers.length} Foundational Users and linked UserInfo/Branch.`
    );

    console.log("Foundational Data Imported Successfully!");
    process.exit();
  } catch (error) {
    console.error(`Error during data import: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await UserInfo.deleteMany();
    await Role.deleteMany();
    await Branch.deleteMany();
    console.log("Data Destroyed Successfully!");
  } catch (error) {
    console.error(`Error during data destruction: ${error.message}`);
    process.exit(1);
  }
};

// --- Command Line Arguments ---
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
