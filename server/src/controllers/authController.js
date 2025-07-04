import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db/dbClient.js";
import {
  signInOtpValidation,
  signInValidation,
} from "../types/signinValidation.js";
import {
  signUpOtpValidation,
  signupValidation,
} from "../types/signupValidation.js";
import { sendOtp } from "../utils/sendOtp.js";
import { sendWelcome_Email } from "../utils/EmailTemplates/sendemail.js";
import { Role } from "@prisma/client";
import { uploadOnImageKit } from "../config/imagekit.js";

export const register = async (req, res) => {
  try {
    let { email, phoneNumber, name, goals, heardAboutUs, socialMedia, role } =
      req.body;
      console.log("req.body", req.body);
   
      let userImage = null;
  
    if (role === "User") {
      if (!heardAboutUs) heardAboutUs = "";
      if (!goals) goals = [];
      if (!socialMedia) socialMedia = "";
    }

    signupValidation.parse({
      email,
      phone: phoneNumber,
      name,
      role,
      goals,
      heardAboutUs,
      socialMedia,

     
    });

    const existingUserByEmail = await prisma.User.findFirst({
      where: {
        email: email,
        verified: true,
      },
    });

    const unverifieduserbyEmail = await prisma.User.findFirst({
      where: {
        email: email,
        verified: false,
      },
    })


    if(unverifieduserbyEmail){
      return res.status(400).json({
        success : false,
        message: "A user with this email already exists" });
    }

    const unverifieduserbyPhone = await prisma.User.findFirst({
      where: {
        phone: phoneNumber,
        verified: false,
      },
    })

    if(unverifieduserbyPhone){
      return res.status(400).json({
        success : false,
        message: "A user with this phone number already exists" });
    }

    console.log("existingUserByEmail", existingUserByEmail);
    if (existingUserByEmail) {
      return res
        .status(400)
        .json({success : false , message: "A user with this email already exists." });
    }
    console.log("existingUserByEmail", existingUserByEmail);

    
    const existingUserByPhone = await prisma.User.findFirst({
      where: {
        phone: phoneNumber,
        verified: true,
      },
    });

    if (existingUserByPhone) {
      return res
        .status(400)
        .json({ 
          success : false,
          message: "A user with this phone number already exists." });
    }

    const newUser = await prisma.User.upsert({
      where: {
        email: email,
        phone: phoneNumber,
      },
    update: {
  email,
  phone: phoneNumber,
  name,
  role,
  verified: false,
  goals,
  heardAboutUs,
  socialMedia,
  userImage,
},

      create: {
        email,
        phone: phoneNumber,
        name,
        role: role,
        verified: false,
        goals,
        heardAboutUs,
        socialMedia,
      userImage,

        wallet: {
          create: {},
        },
      },
    });

    if (!newUser) {
      return res.status(500).json({success  : false , message: "Internal server error" });
    }

    await sendOtp(phoneNumber);
    res.status(201).json({
      message: "OTP sent to phone number",
    });
    // })
  } catch (error) {
    console.error("Error registering user", error);
    res.status(500).json({success : false, message: "Internal server Error." });
  }
};

export const verifyOtpForRegister = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    console.log("req.body", req.body);
    signUpOtpValidation.parse({
      phone: phoneNumber,
      otp,
    });

    const otpStored = await prisma.Otp.findFirst({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    if (!otpStored) {
      return res.status(404).json({ message: "No otp found" });
    }
    const otpValid = await bcrypt.compare(otp, otpStored.phoneCodeHash);
    if (!otpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (otpValid) {
      console.log("otp validate", otpValid);
    }

    const updatedUser = await prisma.User.update({
      where: {
        phone: phoneNumber,
      },
      data: {
        verified: true,
      },

      select : {
        
    id: true,
    role: true,
    email: true,
    name: true,
  },
    
    });

    if (!updatedUser) {
      return res.status(500).json({ message: "Internal server error" });
    }

    const token = jwt.sign(
      {
        id: updatedUser.id,
        role: updatedUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "13d" }
    );
  
    sendWelcome_Email(updatedUser?.email,updatedUser?.name);
    res.status(200).json({
      message: "User verified successfully",
      success: true,
      token,
    });

    const deletedOtp = await prisma.Otp.delete({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    console.log("Deleted OTP:", deletedOtp);
  } catch (error) {
    console.error("Error verifying otp for register", error);

    res.status(500).json({ message: "Internal Server Error." });
  }
};

export async function signIn(req, res) {
  try {
    const { email, phoneNumber } = req.body;
    
    console.log(email, phoneNumber);
    signInValidation.parse({
      email,
      phoneNumber,
    });

    const userExist = await prisma.User.findFirst({
      where: {
        OR: [{ email }, { phone: phoneNumber }],
      role : "Creator"

      },

    });
    

    if (!userExist) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exists.",
      });
    }

    await sendOtp(phoneNumber);
    return res.status(200).json({
      success: true,
      message: "OTP sent to phone number",
    });
  } catch (error) {
    console.error("Error in checking user for signIn.", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
}

// new for only user

export const userlogin = async(req,res) =>{
  try {
    const { email, phoneNumber } = req.body;
     

     signInValidation.parse({
       email,
       phoneNumber
     })
  
    const userExist = await prisma.User.findFirst({
       where : {
        OR : [
          {email : email},
          {phone : phoneNumber}
        ],

        role : "User"
       }
    })

    if(!userExist){
      return res.status(404).json({success : false, message: "User not found." });
    }

    await sendOtp(phoneNumber);
    return res.status(200).json({
      success: true,
      message: "OTP sent to phone number",
    });
  } catch (error) {
     res.status(500).json({success  : false, message: "Internal Server Error." });
  }
}

export async function verifyOtpForLogin(req, res) {
  try {
    const { email, phoneNumber, otp } = req.body;

    signInOtpValidation.parse({
      email,
      phoneNumber,
      otp,
    });

    const otpStored = await prisma.Otp.findFirst({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    if (!otpStored) {
      return res.status(404).json({ message: "No otp found" });
    }
    const otpValid = await bcrypt.compare(otp, otpStored.phoneCodeHash);
    if (!otpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (otpValid) {
      console.log("otp validate");
    }
    // const userId = Object.keys(otpStorage).find(id => {
    //     if(otpStorage[id].otp === otp.toString() && otpStorage[id].phone === phoneNumber) return id;
    // });
    // if(!userId) return res.status(400).json({ message: "Invalid OTP" });

    // delete otpStorage[userId];

    const updatedUser = await prisma.User.update({
      where: {
        phone: phoneNumber,
        email: email,
      },
      data: {
        verified: true,
      },
    });

    if (!updatedUser) {
      return res.status(500).json({ message: "Internal server error" });
    }

    const token = jwt.sign(
      {
        id: updatedUser.id,
        role: updatedUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "13d" }
    );

    const deletedOtp = await prisma.Otp.delete({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    console.log("Deleted OTP:", deletedOtp);

    return res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Error in verifying otp.", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
}

// Admin Login Functionality
export const adminLogin = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate input using zod or your validation schema
    signInValidation.parse({
      phoneNumber,
    });

    const userExist = await prisma.user.findFirst({
      where: {
        phone: phoneNumber,
        role: {
          in: ["Admin", "SuperAdmin"],
        },
      },
    });

    if (!userExist) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist or doesn't have the required role.",
      });
    }

    // Simulate sending OTP based on the role
    const otpType =
      userExist.role === "Admin" ? "ADMIN_OTP" : "SUPER_ADMIN_OTP";

    return res.status(200).json({
      success: true,
      message: `OTP sent to the registered phone number for ${userExist.role}.`,
    });
  } catch (error) {
    console.error("Error in admin login process.", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const verifyAdminOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    signInOtpValidation.parse({
      phoneNumber,
      otp,
    });

    // Fetch the user by phone number
    const user = await prisma.user.findFirst({
      where: {
        phone: phoneNumber,
        role: {
          in: ["Admin", "SuperAdmin"], // Ensure the role matches
        },
      },
    });

    // If user doesn't exist, return 404
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist or doesn't have the required role.",
      });
    }

    // Check OTP based on the role
    const expectedOtp =
      user.role === "Admin"
        ? process.env.ADMIN_OTP
        : process.env.SUPER_ADMIN_OTP;

    if (otp !== expectedOtp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // Update user to set verified as true
    const updateAdmintoVerified = await prisma.user.update({
      where: {
        phone: phoneNumber,
      },
      data: {
        verified: true,
      },
    });

    if (!updateAdmintoVerified) {
      return res.status(500).json({ message: "Internal server error" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: updateAdmintoVerified.id,
        role: updateAdmintoVerified.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    // Set the token as a cookie
    res.cookie("authToken", token, {
      httpOnly: process.env.NODE_ENV === "production" ? true : false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // Helps prevent CSRF attacks
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verification successful.",
      token: token,
    });
  } catch (error) {
    console.error("Error in verifying admin OTP.", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
