import { useState } from "react";
import { User, Lock, Phone, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const initialForm = {
  userName: "",
  password: "",
  confirmPassword: "",
  contactNumber: "",
};

const CreateAdmin = () => {
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const resetForm = () => {
    setFormData(initialForm);
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post("/api/admin/create-admin", {
        userName: formData.userName,
        password: formData.password,
        contactNumber: formData.contactNumber,
      });

      toast.success(data.message || "Admin created successfully");
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create admin");
    } finally {
      setSubmitting(false);
    }
  };

  const passwordsMatch =
    formData.confirmPassword && formData.password === formData.confirmPassword;

  const passwordsDontMatch =
    formData.confirmPassword && formData.password !== formData.confirmPassword;

  return (
    <div className="mt-12 flex justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Create Admin
        </h2>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                required
                placeholder="Enter username"
                pattern="[A-Za-z][A-Za-z0-9\\-]*"
                minLength={3}
                maxLength={30}
                title="Only letters, numbers or dash"
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
                minLength={8}
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-11 outline-none transition focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-11 outline-none transition focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {passwordsMatch && (
              <p className="mt-2 text-sm text-green-600">✓ Passwords match</p>
            )}

            {passwordsDontMatch && (
              <p className="mt-2 text-sm text-red-500">
                ✗ Passwords do not match
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                placeholder="Enter contact number"
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-black"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Admin"
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
