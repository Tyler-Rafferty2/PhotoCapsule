"use client";

import { useEffect, useState } from "react";

export default function VerifyPage() {
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    // Get token from URL query string
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("No token provided.");
      return;
    }

    // Call backend API to verify token
    fetch(`https://photocapsule.onrender.com/verify?token=${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("Your email has been verified! 🎉");
        } else {
          setStatus("Invalid or expired token.");
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
      });
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Email Verification</h1>
      <p>{status}</p>
    </div>
  );
}
