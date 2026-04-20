import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useGoogleOAuth } from "@react-oauth/google";
import API from "../api";

/**
 * ExtensionAuth — a dedicated page opened by the Chrome extension.
 *
 * Flow:
 *  1. Extension opens this page with ?ext_id=<extensionId>
 *  2. User signs in with Google (same stable OAuth as the website)
 *  3. On success, this page calls chrome.runtime.sendMessage(extId, tokens)
 *  4. Extension receives tokens, stores them, closes this tab
 */
export default function ExtensionAuth() {
  const [searchParams] = useSearchParams();
  const extId = searchParams.get("ext_id");

  const { scriptLoadedSuccessfully } = useGoogleOAuth();
  const googleBtnRef = useRef(null);

  const [status, setStatus] = useState("idle"); // idle | loading | success | error | no_ext
  const [errorMsg, setErrorMsg] = useState("");


  useEffect(() => {
    if (!extId) setStatus("no_ext");
  }, [extId]);


  useEffect(() => {
    if (
      status === "no_ext" ||
      !scriptLoadedSuccessfully ||
      !window.google?.accounts?.id ||
      !googleBtnRef.current
    )
      return;

    const renderBtn = () => {
      const width = googleBtnRef.current?.offsetWidth;
      if (!width) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "rectangular",
        text: "signin_with",
        width: Math.min(width, 360),
      });
    };

    renderBtn();
    const observer = new ResizeObserver(() => renderBtn());
    observer.observe(googleBtnRef.current);
    return () => observer.disconnect();
  }, [scriptLoadedSuccessfully, status]);

  async function handleGoogleCredential(response) {
    setStatus("loading");
    setErrorMsg("");

    try {

      const { data } = await API.post("/google-login", {
        token: response.credential,
      });


      const payload = {
        type: "extensionAuthSuccess",
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        name: data.name,
      };

      if (window.chrome?.runtime?.sendMessage) {
        window.chrome.runtime.sendMessage(extId, payload, (reply) => {
          if (window.chrome.runtime.lastError) {
            // Extension didn't receive — still show success so user knows it worked
            console.warn("Could not message extension:", window.chrome.runtime.lastError.message);
          }
        });
      }

      setStatus("success");

      // Try to close the tab automatically (works in some browsers)
      setTimeout(() => window.close(), 1500);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          "Sign-in failed. Make sure you have a CodeRecall account."
      );
      setStatus("error");
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div
        style={{ maxWidth: 420 }}
        className="w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6"
      >

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-1">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">CodeRecall Extension</h1>
          <p className="text-gray-400 text-sm">
            Sign in to link your extension with your account
          </p>
        </div>


        {status === "no_ext" && (
          <div className="text-center text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 w-full">
            ⚠️ This page was opened without a valid extension ID.
            <br />
            Please use the <strong>Continue with Google</strong> button inside the extension.
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-green-400 font-semibold text-lg">Signed in successfully!</p>
            <p className="text-gray-400 text-sm">
              You can close this tab and click the <strong className="text-white">CodeRecall extension icon</strong> in your toolbar to get started.
            </p>
          </div>
        )}

        {status !== "no_ext" && status !== "success" && (
          <>

            <div ref={googleBtnRef} className="w-full flex justify-center" />

            {status === "loading" && (
              <p className="text-gray-400 text-sm animate-pulse">Signing in…</p>
            )}

            {status === "error" && errorMsg && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 w-full text-center">
                {errorMsg}
              </div>
            )}

            <p className="text-gray-600 text-xs text-center">
              You'll be redirected back to the extension after sign-in.
              <br />This tab will close automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
