import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/driver-login")({
  component: DriverLogin,
});

function DriverLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [driverName, setDriverName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up logic
        const email = `driver_${phone}@pbtw.com`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          toast.error(signUpError.message);
          setLoading(false);
          return;
        }

        // Create driver profile
        const { error: profileError } = await supabase.from("drivers").insert({
          user_id: data.user?.id,
          name: driverName,
          phone,
          status: "active",
        });

        if (profileError) {
          toast.error("Failed to create driver profile");
          setLoading(false);
          return;
        }

        toast.success("Registration successful! Please log in.");
        setIsSignUp(false);
        setDriverName("");
      } else {
        // Login logic
        const email = `driver_${phone}@pbtw.com`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error("Invalid phone or password");
          setLoading(false);
          return;
        }

        toast.success("Login successful!");
        navigate({ to: "/driver" });
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? "Become a Driver" : "Driver Login"}
            </h1>
            <p className="text-gray-600">PAPPU BHAI TANKER WALE</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Driver Name (Sign Up) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Raj Kumar"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required={isSignUp}
                />
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isSignUp ? "Registering..." : "Logging in..."}
                </>
              ) : (
                isSignUp ? "Register" : "Login"
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Login */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              {isSignUp ? "Already a driver?" : "New to PBTW?"}{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPhone("");
                  setPassword("");
                  setDriverName("");
                }}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                {isSignUp ? "Login" : "Register"}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Demo: 9876543210 / password123
          </p>
        </div>
      </div>
    </div>
  );
}
