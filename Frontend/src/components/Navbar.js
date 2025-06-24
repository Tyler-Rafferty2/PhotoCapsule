import Link from 'next/link';
export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <Link href="/">📸 PhotoVault</Link>
        </h1>
        <div className="space-x-4">
          <Link href="/login" className="hover:underline text-sm">
            Log In
          </Link>
          <Link href="/register" className="hover:underline text-sm">
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
