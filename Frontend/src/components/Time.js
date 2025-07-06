import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parse, format } from "date-fns";

export default function Time({ vaultId }) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const parseTime = (val) => {
    let parsedDate;
    const today = new Date();
    const trimmed = val.trim().toLowerCase();

    // "1300", "0930" (24-hour)
    if (/^\d{3,4}$/.test(trimmed)) {
      const hours = parseInt(trimmed.slice(0, -2), 10);
      const minutes = parseInt(trimmed.slice(-2), 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        parsedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      }
    }
    // "1230am", "930pm" (pure numeric with am/pm)
    else if (/^\d{3,4}(am|pm)$/.test(trimmed)) {
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
    }
    // "1:30am", "12:45pm"
    else if (/^\d{1,2}:\d{2}\s*(am|pm)$/.test(trimmed)) {
      parsedDate = parse(trimmed, "h:mm a", today);
    }
    // "1:30", "12:45" — assume AM
    else if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [h, m] = trimmed.split(":").map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        parsedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h === 12 ? 0 : h, m);
      }
    }
    // "1am", "12pm"
    else if (/^\d{1,2}(am|pm)$/.test(trimmed)) {
      parsedDate = parse(trimmed, "ha", today);
    }
    // "1", "12", "23", "0" — assume AM or 24-hour
    else if (/^\d{1,2}$/.test(trimmed)) {
      let h = parseInt(trimmed, 10);
      if (h >= 0 && h <= 23) {
        let assumedHours = h;
        if (h === 0) {
          assumedHours = 0; // midnight
        } else if (h >= 1 && h <= 12) {
          assumedHours = h === 12 ? 0 : h; // 12 → 0 (midnight), otherwise AM
        }
        parsedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), assumedHours, 0);
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
      const token = localStorage.getItem("token");
      if (!token) {
        setStatus("No token found — please sign in.");
        return;
      }

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

      const res = await fetch(`http://localhost:8080/time/set/${vaultId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    } catch (err) {
      console.error("Failed to set time:", err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-sm mx-auto space-y-4">
      <h2 className="text-lg font-bold">Set Vault Release Time</h2>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block mb-1 font-medium">Select Date:</label>
          <DatePicker
            selected={date}
            onChange={(d) => setDate(d)}
            dateFormat="MMMM d, yyyy"
            minDate={new Date()}
            className="border p-2 w-full"
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
            className={`border p-2 w-full ${error ? "border-red-500" : ""}`}
            placeholder="e.g., 1300, 1pm"
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
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Set Time
      </button>

      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
