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

// --- Configuration ---
const NUM_BRANCHES = 3;
const NUM_USERS = 20;

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

// 1. Generate Fake UserInfo Data
const createFakeUserInfo = () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const gender = faker.helpers.arrayElement(["M", "F", "Other"]);

  return {
    firstName,
    lastName,
    gender,
    dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: "age" }),
    maritalStatus: faker.helpers.arrayElement([
      "Single",
      "Married",
      "Divorced",
      "Widowed",
    ]),
    occupation: faker.person.jobTitle(),
    address: faker.location.streetAddress(),
    phoneNumber: faker.phone.number("###-###-####"),
    email: faker.internet.email({ firstName, lastName }),
    // Simple identification:
    identifications: [
      {
        cardType: "NationalID",
        cardCode: faker.string.uuid().substring(0, 10).toUpperCase(),
      },
    ],
    deleted: false,
  };
};

// 2. Generate Fake User Data
const createFakeUser = async (roleIds, branchIds, userInfoId, index) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = `user_${index}_${faker.string.alphanumeric(4)}`;
  const fullName = `${firstName} ${lastName}`;
  const plainPassword = "password123";

  // --- 🚨 MANUAL HASHING START 🚨 ---
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  // --- 🚨 MANUAL HASHING END 🚨 ---

  // NOTE: password will be hashed by the pre-save hook
  return {
    username,
    fullName,
    password: hashedPassword,
    roleId: faker.helpers.arrayElements(roleIds, { min: 1, max: 2 }), // Assigns 1-2 roles
    branchId: faker.helpers.arrayElement(branchIds),
    userInfoId: userInfoId,
    isActive: true,
  };
};

// --- IMPORT & DESTROY FUNCTIONS ---

const importData = async () => {
  try {
    await connectDB();

    // 0. Destroy existing data
    await destroyData();

    // 1. Create Roles (Independent)
    const rolesData = [
      { name: "Admin", description: "Full system access" },
      { name: "Manager", description: "Branch management" },
      { name: "Staff", description: "Daily operations" },
      { name: "Viewer", description: "Read-only access" },
    ];
    const createdRoles = await Role.insertMany(rolesData);
    const roleIds = createdRoles.map((role) => role._id);
    console.log(`Seeded ${createdRoles.length} Roles.`);

    // 2. Create Branches (Independent)
    const branchData = Array.from({ length: NUM_BRANCHES }, () => ({
      name: `Branch ${faker.location.city()}`,
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      phone: faker.phone.number("###-####"),
      // managerId will be null for now, or link to a user later
      managerId: null,
      isActive: true,
    }));
    const createdBranches = await Branch.insertMany(branchData);
    const branchIds = createdBranches.map((branch) => branch._id);
    console.log(`Seeded ${createdBranches.length} Branches.`);

    // 3. Create UserInfo documents
    const userInfoData = Array.from({ length: NUM_USERS }, createFakeUserInfo);
    const createdUserInfos = await UserInfo.insertMany(userInfoData);
    const userInfoIds = createdUserInfos.map((info) => info._id);
    console.log(`Seeded ${createdUserInfos.length} UserInfo records.`);

    // 4. Create Users (Dependent on Roles, Branches, UserInfo)
    const userDataPromises = userInfoIds.map((infoId, index) =>
      createFakeUser(roleIds, branchIds, infoId, index + 1)
    );

    // Resolve all promises (run all hashing operations)
    const userData = await Promise.all(userDataPromises);

    const createdUsers = await User.insertMany(userData);
    console.log(`Seeded ${createdUsers.length} Users.`);

    console.log("Data Imported Successfully!");
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
