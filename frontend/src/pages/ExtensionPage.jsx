import { useState } from "react";
import { Download, Globe, CheckCircle, Puzzle, Zap, RefreshCw, Tag, Star, ExternalLink } from "lucide-react";

const GITHUB_RELEASE_URL = "https://github.com/Samarthsaxena04/coderecall-extension/releases/latest/download/CodeRecall-extension.zip";
const GITHUB_REPO_URL = "https://github.com/Samarthsaxena04/coderecall-extension";

const steps = [
  {
    number: "01",
    title: "Download the Extension",
    desc: "Click the button below to download the extension zip file from GitHub.",
    detail: null,
  },
  {
    number: "02",
    title: "Unzip the File",
    desc: "Extract the downloaded zip file to a folder on your computer. Remember where you save it.",
    detail: 'Right-click the .zip → "Extract All" (Windows) or double-click (Mac)',
  },
  {
    number: "03",
    title: "Open Extensions Page",
    desc: 'In Chrome/Edge/Brave, go to your extensions page.',
    detail: 'Type  chrome://extensions  in the address bar and press Enter',
  },
  {
    number: "04",
    title: 'Enable "Developer Mode"',
    desc: 'Toggle on Developer Mode using the switch in the top-right corner of the extensions page.',
    detail: "This allows loading extensions that aren't from the Web Store — it's safe.",
  },
  {
    number: "05",
    title: "Load the Extension",
    desc: 'Click "Load Unpacked" and select the unzipped folder.',
    detail: "Select the browser-extension folder, not a file inside it.",
  },
  {
    number: "06",
    title: "Sign In & You're Done!",
    desc: "Click the CodeRecall icon in your browser toolbar. Sign in with your account and start tracking!",
    detail: null,
  },
];

const features = [
  { icon: Zap, title: "Auto-detect problems", desc: "Title, link, and platform filled automatically when you open any problem page." },
  { icon: Tag, title: "Auto-detect topics", desc: "Tags like Array, DP, Binary Search scraped from the problem page — no typing needed." },
  { icon: RefreshCw, title: "Review without leaving", desc: 'See which questions are due today and mark them done right from the popup.' },
  { icon: Star, title: "Google Sign-In", desc: "Sign in with Google — no password needed. A secure tab opens on the website, completes sign-in, and closes automatically." },
];

const browsers = [
  { name: "Chrome", supported: true },
  { name: "Edge", supported: true },
  { name: "Brave", supported: true },
  { name: "Opera", supported: true },
  { name: "Firefox", supported: false },
  { name: "Safari", supported: false },
];

function ExtensionPage() {
  const [copied, setCopied] = useState(false);

  const copyStoreLink = () => {
    navigator.clipboard.writeText(GITHUB_REPO_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Puzzle size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Browser Extension</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">FREE</span>
            </div>
            <p className="text-gray-400 text-base mb-6 max-w-xl">
              Track DSA questions without ever leaving the problem page. Auto-detects the title, link, platform, and topics — just pick your status and save.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={GITHUB_RELEASE_URL}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition text-sm"
              >
                <Download size={16} />
                Download Extension (.zip)
              </a>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition border border-gray-700 text-sm"
              >
                <ExternalLink size={16} />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>


      <div>
        <h2 className="text-xl font-bold text-white mb-4">What it does</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">{title}</div>
                <div className="text-sm text-gray-400">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>


      <div>
        <h2 className="text-xl font-bold text-white mb-4">How to Install</h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-blue-500/5 flex items-center gap-2">
            <Globe size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Works on any Chromium-based browser — Chrome, Edge, Brave, Opera</span>
          </div>
          <div className="divide-y divide-gray-800">
            {steps.map((step, i) => (
              <div key={step.number} className="p-5 flex gap-5 items-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-400">{step.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white mb-1">{step.title}</div>
                  <div className="text-sm text-gray-400 mb-1">{step.desc}</div>
                  {step.detail && (
                    <div className="text-xs text-gray-500 bg-gray-800 rounded-md px-3 py-1.5 inline-block font-mono mt-1">
                      {step.detail}
                    </div>
                  )}
                </div>
                {i === steps.length - 1 && (
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>


      <div>
        <h2 className="text-xl font-bold text-white mb-4">Browser Compatibility</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {browsers.map(({ name, supported }) => (
            <div
              key={name}
              className={`rounded-xl border p-3 text-center ${
                supported
                  ? "bg-green-900/10 border-green-800/40"
                  : "bg-gray-900 border-gray-800 opacity-50"
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${supported ? "text-white" : "text-gray-500"}`}>
                {name}
              </div>
              <div className={`text-xs ${supported ? "text-green-400" : "text-gray-600"}`}>
                {supported ? "✓ Supported" : "✗ Not supported"}
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="font-semibold text-white mb-3">Frequently Asked Questions</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-gray-300 font-medium mb-1">Is it safe to enable Developer Mode?</p>
            <p className="text-gray-500">Yes. Developer Mode just allows loading extensions from your computer. It doesn't affect your browser security. You can see the full source code on GitHub.</p>
          </div>
          <div>
            <p className="text-gray-300 font-medium mb-1">Will I need to re-install when you update it?</p>
            <p className="text-gray-500">For now, yes — download the new zip and reload it. In the future, the extension may be published to the Chrome Web Store for auto-updates.</p>
          </div>
          <div>
            <p className="text-gray-300 font-medium mb-1">Does it work when I'm not on a problem page?</p>
            <p className="text-gray-500">Yes — you can still open the popup and manually fill in any question. Auto-detection only works on supported platforms.</p>
          </div>
          <div className="border-t border-gray-800 pt-4">
            <p className="text-gray-300 font-medium mb-1">Why does Google Sign-In open a website tab instead of a Google popup?</p>
            <p className="text-gray-500">
              Because this extension is sideloaded (not from the Chrome Web Store), every user's Chrome assigns it a different internal ID — which means a different OAuth redirect URL. Google only allows pre-registered redirect URLs, so a direct popup would fail for everyone except the developer.
            </p>
            <p className="text-gray-500 mt-2">
              To fix this properly, clicking <span className="text-gray-300 font-medium">Continue with Google</span> opens a tab on this website, which has a single stable URL that Google trusts. You sign in there, the tab sends your tokens securely back to the extension, and then closes automatically — usually within a few seconds.
            </p>
            <div className="mt-3 flex items-start gap-2 bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2.5">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">ℹ️</span>
              <p className="text-blue-300 text-xs">
                This is a one-time sign-in. Once done, the extension stays logged in and you won't need to repeat it until you explicitly log out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExtensionPage;
