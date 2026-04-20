import { useState, useEffect } from "react";
import API from "../api";


const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London (UK)" },
  { value: "Europe/Paris", label: "Paris (France)" },
  { value: "Europe/Berlin", label: "Berlin (Germany)" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Tokyo (Japan)" },
  { value: "Asia/Shanghai", label: "Shanghai (China)" },
  { value: "Australia/Sydney", label: "Sydney (Australia)" },
];

function SettingsPage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [emailSettings, setEmailSettings] = useState({
    email_notifications_enabled: true,
    email_reminder_time: "09:00",
    timezone: "UTC"
  });
  const [reminderIntervals, setReminderIntervals] = useState({
    reminder_days_done: 12,
    reminder_days_help: 5,
    reminder_days_fail: 3
  });
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [intervalsLoading, setIntervalsLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [intervalsSuccess, setIntervalsSuccess] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [intervalsError, setIntervalsError] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchEmailSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await API.get("/profile");
      setProfile(response.data);
    } catch (err) {
      console.error("Failed to fetch profile");
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const response = await API.get("/profile/settings");
      setEmailSettings({
        email_notifications_enabled: response.data.email_notifications_enabled ?? true,
        email_reminder_time: response.data.email_reminder_time || "09:00",
        timezone: response.data.timezone || "UTC"
      });
      setReminderIntervals({
        reminder_days_done: response.data.reminder_days_done ?? 12,
        reminder_days_help: response.data.reminder_days_help ?? 5,
        reminder_days_fail: response.data.reminder_days_fail ?? 3
      });
    } catch (err) {
      console.error("Failed to fetch email settings");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await API.put("/profile", { name: profile.name, email: profile.email });
      setSuccess(true);
      localStorage.setItem("userName", profile.name);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSettingsSubmit = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");
    setEmailSuccess(false);

    try {
      await API.put("/email-settings", {
        email_notifications_enabled: emailSettings.email_notifications_enabled,
        email_reminder_time: emailSettings.email_notifications_enabled ? emailSettings.email_reminder_time : null,
        timezone: emailSettings.timezone
      });
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      setEmailError(err.response?.data?.detail || "Failed to update email settings");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailSuccess(false);
    setEmailError("");
    try {
      await API.post("/send-test-email");
      setTestEmailSuccess(true);
      setTimeout(() => setTestEmailSuccess(false), 5000);
    } catch (err) {
      setEmailError(err.response?.data?.detail || "Failed to send test email");
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleIntervalsSubmit = async (e) => {
    e.preventDefault();
    setIntervalsLoading(true);
    setIntervalsError("");
    setIntervalsSuccess(false);

    try {
      await API.put("/reminder-intervals", {
        reminder_days_done: Number(reminderIntervals.reminder_days_done),
        reminder_days_help: Number(reminderIntervals.reminder_days_help),
        reminder_days_fail: Number(reminderIntervals.reminder_days_fail)
      });
      setIntervalsSuccess(true);
      setTimeout(() => setIntervalsSuccess(false), 3000);
    } catch (err) {
      setIntervalsError(err.response?.data?.detail || "Failed to update reminder intervals");
    } finally {
      setIntervalsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto m-1">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account preferences</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              readOnly
              className="w-full bg-gray-800 border border-gray-700 text-gray-400 p-3 rounded-lg cursor-not-allowed"
              placeholder="your@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm">* {error}</p>
          )}

          {success && (
            <p className="text-green-400 text-sm"> Profile updated successfully!</p>
          )}

          <div className="pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>


      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Revision Intervals</h3>
        <p className="text-sm text-gray-400 mb-6">
          Customize how many days until a question appears again for revision based on your performance
        </p>
        
        <form onSubmit={handleIntervalsSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <label className="text-sm font-medium text-gray-300">Solved</label>
              </div>
              <input
                type="number"
                min="1"
                max="30"
                value={reminderIntervals.reminder_days_done}
                onChange={(e) => setReminderIntervals({ 
                  ...reminderIntervals, 
                  reminder_days_done: e.target.value 
                })}
                className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <label className="text-sm font-medium text-gray-300">Needed Help</label>
              </div>
              <input
                type="number"
                min="1"
                max="30"
                value={reminderIntervals.reminder_days_help}
                onChange={(e) => setReminderIntervals({ 
                  ...reminderIntervals, 
                  reminder_days_help: e.target.value 
                })}
                className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <label className="text-sm font-medium text-gray-300">Failed</label>
              </div>
              <input
                type="number"
                min="1"
                max="30"
                value={reminderIntervals.reminder_days_fail}
                onChange={(e) => setReminderIntervals({ 
                  ...reminderIntervals, 
                  reminder_days_fail: e.target.value 
                })}
                className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {intervalsError && (
            <p className="text-red-400 text-sm">* {intervalsError}</p>
          )}

          {intervalsSuccess && (
            <p className="text-green-400 text-sm">Revision intervals updated successfully!</p>
          )}

          <div className="pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={intervalsLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {intervalsLoading ? "Saving..." : "Save Intervals"}
            </button>
          </div>
        </form>
      </div>


      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
        <p className="text-sm text-gray-400 mb-6">
          Receive daily email reminders about questions due for revision
        </p>
        
        <form onSubmit={handleEmailSettingsSubmit} className="space-y-5">

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-300">Enable Email Reminders</p>
              <p className="text-xs text-gray-500">Get notified about questions due for revision</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={emailSettings.email_notifications_enabled}
                onChange={(e) => setEmailSettings({ 
                  ...emailSettings, 
                  email_notifications_enabled: e.target.checked 
                })}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>


          {emailSettings.email_notifications_enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Daily Reminder Time
                </label>
                <input
                  type="time"
                  value={emailSettings.email_reminder_time}
                  onChange={(e) => setEmailSettings({ 
                    ...emailSettings, 
                    email_reminder_time: e.target.value 
                  })}
                  className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose when you want to receive your daily revision reminder
                </p>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={emailSettings.timezone}
                  onChange={(e) => setEmailSettings({ 
                    ...emailSettings, 
                    timezone: e.target.value 
                  })}
                  className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Set your timezone for accurate reminder timing
                </p>
              </div>
            </>
          )}

          {emailError && (
            <p className="text-red-400 text-sm">* {emailError}</p>
          )}

          {emailSuccess && (
            <p className="text-green-400 text-sm">Email settings updated successfully!</p>
          )}

          {testEmailSuccess && (
            <p className="text-green-400 text-sm">Test email sent! Check your inbox.</p>
          )}

          <div className="pt-4 border-t border-gray-800 flex gap-3">
            <button
              type="submit"
              disabled={emailLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailLoading ? "Saving..." : "Save Email Settings"}
            </button>

            {import.meta.env.VITE_SHOW_TEST_EMAIL === 'true' && emailSettings.email_notifications_enabled && (
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testEmailLoading}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testEmailLoading ? "Sending..." : "Send Test Email"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;