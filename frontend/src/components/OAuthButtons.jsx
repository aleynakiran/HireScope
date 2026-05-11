import { apiBaseURL } from "../api/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#ffffff" />
      <path d="M12 4a8 8 0 0 1 5.5 2.2l-2.2 2.1A4.9 4.9 0 0 0 12 7.1 5 5 0 0 0 7.3 10.5L4.7 8.6A8 8 0 0 1 12 4Z" fill="#EA4335" />
      <path d="M20 12.2c0 .6-.1 1.1-.2 1.6H12v-3.1h7.5c.3.5.5 1 .5 1.5Z" fill="#4285F4" />
      <path d="M7.2 13.5A5 5 0 0 0 12 17a4.9 4.9 0 0 0 3.3-1.2l2.3 2.2A8 8 0 0 1 4.7 15.4l2.5-1.9Z" fill="#34A853" />
      <path d="M4.7 8.6 7.3 10.5A5 5 0 0 0 7.2 13.5l-2.5 1.9A8 8 0 0 1 4 12c0-1.2.2-2.3.7-3.4Z" fill="#FBBC05" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#111827" />
      <path
        d="M12 6.2a5.9 5.9 0 0 0-1.9 11.5c.3.1.4-.1.4-.3v-1.2c-1.7.4-2-.7-2-.7-.3-.8-.7-1-1-1.1-.8-.5.1-.5.1-.5.9.1 1.4 1 1.4 1 .8 1.3 2 1 2.5.8.1-.6.3-1 .6-1.2-1.4-.2-3-.7-3-3.3 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2 0 2.6-1.6 3.1-3 3.3.3.2.6.7.6 1.5v2.2c0 .2.1.4.4.3A5.9 5.9 0 0 0 12 6.2Z"
        fill="#ffffff"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="4.5" fill="#0A66C2" />
      <circle cx="7.3" cy="8" r="1.4" fill="#ffffff" />
      <rect x="5.9" y="10.1" width="2.8" height="7.2" rx="1" fill="#ffffff" />
      <path d="M11 10.1h2.7v1c.5-.7 1.3-1.2 2.5-1.2 2.1 0 3.3 1.4 3.3 3.9v3.5h-2.8V14c0-1-.4-1.8-1.4-1.8s-1.5.8-1.5 1.8v3.3H11v-7.2Z" fill="#ffffff" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#5865F2" />
      <path
        d="M16.8 8.4a8.6 8.6 0 0 0-2.2-.7l-.3.5a8 8 0 0 0-2.3-.3 8 8 0 0 0-2.3.3l-.3-.5c-.8.1-1.5.4-2.2.7-1.4 2.1-1.8 4.2-1.6 6.2.9.7 1.8 1.2 2.8 1.5l.6-1a5.6 5.6 0 0 1-1-.5l.2-.2c1.9.9 4 .9 5.9 0l.2.2c-.3.2-.7.4-1 .5l.6 1c1-.3 1.9-.8 2.8-1.5.3-2.3-.5-4.4-1.6-6.2ZM9.7 13.4c-.6 0-1-.5-1-1.2s.5-1.2 1-1.2c.6 0 1 .5 1 1.2s-.4 1.2-1 1.2Zm4.6 0c-.6 0-1-.5-1-1.2s.5-1.2 1-1.2 1 .5 1 1.2-.4 1.2-1 1.2Z"
        fill="#ffffff"
      />
    </svg>
  );
}

const providers = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "github", label: "GitHub", Icon: GitHubIcon },
  { id: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { id: "discord", label: "Discord", Icon: DiscordIcon },
];

export default function OAuthButtons() {
  return (
    <div className="oauth-row">
      {providers.map(({ id, label, Icon }) => (
        <a key={id} className="oauth-btn" data-testid={`${id}-login-btn`} href={`${apiBaseURL}/oauth/${id}`}>
          <span className="oauth-btn-icon" aria-hidden="true">
            <Icon />
          </span>
          <span className="oauth-btn-label">Continue with {label}</span>
        </a>
      ))}
    </div>
  );
}
