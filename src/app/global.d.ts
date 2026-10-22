declare interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => void;
    };
  }
  