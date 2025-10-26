import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
        <p className="mt-2 text-sm text-gray-600">
          Create your account to get started
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}
