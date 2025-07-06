"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import Link from "next/link";

function LinkToGallery() {
  return (
    <div className="text-center">
      <Link href="/vaults" className="text-blue-500 hover:underline">
        View vaults
      </Link>
    </div>
  );
}

export default function UploadPage() {
  return (
    <>
      <Navbar />
      <div className="p-8 max-w-md mx-auto space-y-4">
        <LinkToGallery />
      </div>
    </>
  );
}
