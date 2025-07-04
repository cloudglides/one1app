/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import {
  faMobileScreenButton,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
// import Photo1 from "../../../assets/1.png";
// import Photo2 from "../../../assets/2.png";
// import Photo3 from "../../../assets/3.png";
// import Photo4 from "../../../assets/4.png";
// import Photo5 from "../../../assets/5.png";
// import Photo6 from "../../../assets/6.png";
import {
  signInUser,
  verifyLoginUser,
} from "../../../services/auth/api.services";
import Lottie from "lottie-react";
import animation from "../../../assets/Animation - 4.json";
import { useAuth } from "../../../context/AuthContext";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [isUsingEmail, setIsUsingEmail] = useState(true);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const { verifyToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const countryCodes = ["+1", "+91", "+44", "+61"];

  // const images = [
  //   "https://d3qp9zvlyuxos1.cloudfront.net/Group+46944GlobalSignin4.png",
  //   "https://d3qp9zvlyuxos1.cloudfront.net/Group+46942GlobalSignin2.png",
  //   "https://d3qp9zvlyuxos1.cloudfront.net/Group+46943GlobalSignin3.png",
  //   "https://d3qp9zvlyuxos1.cloudfront.net/Group+46945GlobalSignin.png",
  //   "https://d3qp9zvlyuxos1.cloudfront.net/Group+46942GlobalSignin2.png",
  // ];
  // const images = [Photo1, Photo2, Photo3, Photo4, Photo5, Photo6];

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  useEffect(() => {
    setIsPhoneNumberValid(phoneNumber.length >= 10);
  }, [phoneNumber]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (currentImageIndex === images.length - 1) {
  //       setIsResetting(true);
  //       setTimeout(() => {
  //         setCurrentImageIndex(0);
  //         setIsResetting(false);
  //       }, 500);
  //     } else {
  //       setCurrentImageIndex((prevIndex) => prevIndex + 1);
  //     }
  //   }, 3000);

  //   return () => clearInterval(interval);
  // }, [currentImageIndex, images.length]);

  // const handleImageChange = (index) => {
  //   setCurrentImageIndex(index);
  // };

  const handleFormSubmit = async () => {
    const userData = isUsingEmail
      ? { email }
      : { phoneNumber: selectedCountryCode + phoneNumber };
    setIsLoading(true);

    try {
      const { data } = await signInUser(userData);
      if (data.success) {
        toast.success(
          isUsingEmail ? "OTP Sent to Email!" : "OTP Sent to Phone Number!"
        );
        setShowOTPInput(true);
      }
    } catch (error) {
      console.error("API call error:", error);
      toast.error("user does not exist.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    setIsOtpLoading(true);

    if (otp.length < 6) {
      toast.error("Please enter a valid OTP.");
      setIsOtpLoading(false);
      return;
    }
    const otpData = {
      otp,
      ...(isUsingEmail
        ? { email }
        : { phoneNumber: selectedCountryCode + phoneNumber }),
    };

    try {
      const { data } = await verifyLoginUser(otpData);
      if (data.success) {
        toast.success("OTP Verified Successfully!");
        localStorage.setItem("AuthToken", data.token);
        await verifyToken();
        navigate("/dashboard");
      } else {
        toast.error("Invalid OTP. Please try again");
      }
    } catch (error) {
      console.error("API call error:", error);
      toast.error("Wrong OTP");
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div
      className=" min-h-screen flex flex-col justify-start bg-gradient-to-br from-orange-500 via-red-500 to-pink-500"
       data-theme="light"
    >
      <div className="flex justify-center items-start min-h-screen pt-8 mt-16">
        <div
          className="shadow-xl flex flex-col lg:flex-row bg-white rounded-[24px] w-full max-w-[1000px] relative"
          style={{ height: "auto" }}
        >
          <div className="relative flex flex-col flex-1 p-6 md:p-12 pb-6 rounded-l-[24px] lg:rounded-l-[24px] w-full">
            <div className="w-full flex flex-col items-center justify-center gap-6 mt-4">
              <div className="flex flex-col items-center justify-center gap-1">
                <h2 className="text-xl md:text-2xl font-bold">Welcome Back!</h2>
                <p className="text-base font-semibold text-gray-500">
                  Sign in to your OneApp account
                </p>
              </div>

              {isUsingEmail ? (
                <div className="flex flex-col gap-1 w-[85%]">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-2.5 text-sm p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="flex gap-2 w-[85%]">
                  {/* Country Code Dropdown */}
                  <select
                    className="p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                  >
                    {countryCodes.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>

                  {/* Phone Number Input */}
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

                      setPhoneNumber(value);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {showOTPInput && (
                <div className="flex flex-col gap-1 w-[85%]">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setOtp(value);
                    }}
                    className="w-full mt-2.5 text-sm p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    className="mt-2 w-[100%] flex justify-center text-sm items-center gap-2 bg-slate-900 text-white py-2 px-4 rounded-full"
                    onClick={handleOTPSubmit}
                    disabled={isOtpLoading}
                  >
                    {isOtpLoading ? "Verifying..." : "Submit OTP"}
                  </button>
                </div>
              )}

              {!showOTPInput && (
                <button
                  className={`w-[85%] flex justify-center text-sm items-center gap-2 ${
                    (isUsingEmail && isEmailValid) ||
                    (!isUsingEmail && isPhoneNumberValid)
                      ? "bg-slate-900 text-white"
                      : "bg-gray-400 text-gray-700"
                  } py-2 px-4 rounded-full`}
                  disabled={
                    (isUsingEmail && !isEmailValid) ||
                    (!isUsingEmail && !isPhoneNumberValid) ||
                    isLoading
                  }
                  onClick={handleFormSubmit}
                >
                  {isLoading
                    ? "Sending..."
                    : isUsingEmail
                    ? "Send OTP to Email"
                    : "Send OTP to Phone"}
                </button>
              )}

              <div className="flex items-center justify-between w-[80%]">
                <hr className="flex-grow border-t border-gray-300" />
                <span className="text-sm text-[#5f5f5f]">OR</span>
                <hr className="flex-grow border-t border-gray-300" />
              </div>

              <button
                className="w-[85%] flex justify-center text-sm items-center gap-2 text-black py-2 px-4 rounded-full border border-slate-900"
                onClick={() => {
                  setIsUsingEmail((prev) => !prev);
                  setShowOTPInput(false);
                }}
              >
                <FontAwesomeIcon
                  icon={isUsingEmail ? faMobileScreenButton : faEnvelope}
                />
                Continue with {isUsingEmail ? "Phone Number" : "Email"}
              </button>
              {/* <button className="w-[85%] flex justify-center text-sm items-center gap-2 text-black py-2 px-4 rounded-full border border-slate-900">
                <FontAwesomeIcon icon={faGoogle} />
                Continue with Google
              </button> */}

              <p className="text-center text-gray-600 font-medium text-sm mt-2">
                Don't have an account?{" "}
                <a href="/signup" className="text-blue-500">
                  Sign up
                </a>
              </p>
            </div>
          </div>

          {/* <div className="hidden lg:flex flex-1 rounded-r-[24px] justify-center items-center bg-slate-900 relative overflow-hidden"> */}
          <div className="flex-1 rounded-r-[24px] bg-white relative overflow-hidden">
            <Lottie
              animationData={animation}
              loop={true}
              autoplay={true}
              className="w-full h-[30em]"
            />
          </div>
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
