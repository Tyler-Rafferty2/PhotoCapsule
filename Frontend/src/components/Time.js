import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parse, format } from "date-fns";
import { authFetch } from "@/utils/authFetch"; // ✅ NEW

export default function Time({ vaultId, setCapsule }) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchReleaseTime = async () => {
      try {
        const res = await authFetch(`http://localhost:8080/time/get/${vaultId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch time: ${text}`);
        }

        const data = await res.json();
        console.log("fetched", data);
        if (data.release_time) {
          const releaseDate = new Date(data.release_time);
          setDate(releaseDate);
          setTime(releaseDate);
          setInputValue(format(releaseDate, "h:mm aa"));
        }
      } catch (err) {
        console.error("Error fetching release time:", err);
      }
    };

    fetchReleaseTime();
  }, [vaultId]);

  const parseTime = (val) => {
    let parsedDate;
    const today = new Date();
    let trimmed = val.trim().toLowerCase();
    trimmed = trimmed.replace(/\s+(am|pm)$/, "$1");
    trimmed = trimmed.replace(/[-.\s]/g, ":");

    if (/^\d{3,4}(am|pm)$/.test(trimmed)) {
      const numPart = trimmed.slice(0, -2);
      const suffix = trimmed.slice(-2);
      let hours, minutes;

      if (numPart.length === 3) {
        hours = parseInt(numPart.slice(0, 1), 10);
        minutes = parseInt(numPart.slice(1, 3), 10);
      } else {
        hours = parseInt(numPart.slice(0, 2), 10);
        minutes = parseInt(numPart.slice(2, 4), 10);
      }

      if (suffix === "pm" && hours !== 12) hours += 12;
      if (suffix === "am" && hours === 12) hours = 0;

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        parsedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      }
    } else if (/^\d{1,2}:\d{1,2}(am|pm)$/.test(trimmed)) {
      parsedDate = parse(trimmed, "h:mma", today);
    } else if (/^\d{1,2}:\d{1,2}$/.test(trimmed)) {
      const [h, m] = trimmed.split(":").map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        parsedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
      }
    } else if (/^\d{1,2}(am|pm)$/.test(trimmed)) {
      parsedDate = parse(trimmed, "ha", today);
    } else if (/^\d{1,2}$/.test(trimmed)) {
      let h = parseInt(trimmed, 10);
      if (h >= 0 && h <= 23) {
        parsedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, 0);
      }
    } else if (/^\d{3}$/.test(trimmed)) {
      let h = parseInt(trimmed.slice(0, 1), 10);
      let m = parseInt(trimmed.slice(1, 3), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        parsedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
      }
    } else if (/^\d{4}$/.test(trimmed)) {
      let h = parseInt(trimmed.slice(0, 2), 10);
      let m = parseInt(trimmed.slice(2, 4), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        parsedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
      }
    }

    return parsedDate && !isNaN(parsedDate) ? parsedDate : null;
  };

  const handleTimeInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setError("");
  };

  const handleTimeBlur = () => {
    if (inputValue.trim() === "") {
      setError("");
      return;
    }

    const parsed = parseTime(inputValue.trim());
    if (!parsed) {
      setError("Invalid time format.");
    } else {
      setTime(parsed);
      setInputValue(format(parsed, "h:mm aa"));
      setError("");
    }
  };

  const setTimeHandler = async () => {
    try {
      const combinedDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        0
      );

      if (combinedDateTime <= new Date()) {
        setStatus("Please select a future date and time.");
        return;
      }

      const isoTime = combinedDateTime.toISOString();

      const res = await authFetch(`http://localhost:8080/time/set/${vaultId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          release_time: isoTime,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to set time: ${text}`);
      }

      setStatus("Time successfully set!");

      try {
        const res = await authFetch(`http://localhost:8080/vault/${vaultId}`, {
        });
        const data = await res.json();
        console.log("Fetched capsules:", data);
        setCapsule(data);
      } catch (error) {
        console.error("Error:", error);
      }
    } catch (err) {
      console.error("Failed to set time:", err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 border rounded-lg max-w-sm mx-auto space-y-4 backdrop-blur-md bg-white/70">
      <h2 className="text-lg font-bold">Set Vault Release Time</h2>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block mb-1 font-medium">Select Date:</label>
          <DatePicker
            selected={date}
            onChange={(d) => setDate(d)}
            dateFormat="MMMM d, yyyy"
            minDate={new Date()}
            className="border p-2 w-full bg-white/80 backdrop-blur"
            renderCustomHeader={({ date, changeYear, changeMonth }) => {
              const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ];
              return (
                <div className="flex justify-between mb-2">
                  <select
                    value={date.getFullYear()}
                    onChange={({ target: { value } }) => changeYear(Number(value))}
                    className="border p-1"
                  >
                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={date.getMonth()}
                    onChange={({ target: { value } }) => changeMonth(Number(value))}
                    className="border p-1"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index} value={index}>{name}</option>
                    ))}
                  </select>
                </div>
              );
            }}
          />
        </div>

        <div className="flex-1">
          <label className="block mb-1 font-medium">Select Time:</label>
          <input
            value={inputValue}
            onChange={handleTimeInputChange}
            onBlur={handleTimeBlur}
            className={`border p-2 w-full bg-white/80 backdrop-blur ${error ? "border-red-500" : ""}`}
          />
          <DatePicker
            selected={time}
            onChange={(t) => {
              setTime(t);
              setInputValue(format(t, "h:mm aa"));
              setError("");
            }}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="h:mm aa"
            customInput={<div />} // hidden input hack
            className="hidden"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>

      <button
        onClick={setTimeHandler}
        className="px-5 py-3 rounded shadow transition-colors duration-200"
        style={{
          background: "var(--accent)",
          color: "#fff",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
      >
        Set Time
      </button>

      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
