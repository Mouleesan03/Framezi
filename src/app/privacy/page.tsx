import { Logo, Footer, PrivacyBadge } from "@/components/Brand";
export const metadata = { title: "Privacy Policy | Framezi" };
export default function Page() {
  return (
    <>
      <header className="site-header">
        <Logo />
      </header>
      <main className="legal">
        <span className="eyebrow">YOUR MEMORIES. YOUR CONTROL.</span>
        <h1 style={{ marginTop: 15 }}>Privacy policy</h1>
        <p>Last updated: September 2026</p>
        <PrivacyBadge />
        <h2>What we store</h2>
        <p>
          Framezi, an Infonits product, helps campaign organizers offer
          personalised event photo frames. When you register, we may store:
        </p>
        <ul>
          <li>Your name and email address, as required by the campaign.</li>
          <li>The campaign you participate in and your registration time.</li>
          <li>
            Your participation consent and separate optional marketing choice.
          </li>
          <li>Generation, download, frame selection, and sharing activity.</li>
        </ul>
        <h2>What we do not store</h2>
        <p>
          We do not store your uploaded photographs, cropped photographs,
          generated framed images, face detection data, or biometric
          information. Images are processed locally on your device using your
          web browser. Photos are held in browser memory, not in browser storage
          or a server database.
        </p>
        <h2>How your information is used</h2>
        <p>
          Campaign organizers use registration information to administer their
          event and understand participation. Administrators can view and export
          registration metadata. Version 1 does not send automated emails.
          Marketing consent is optional, unchecked by default, and separate from
          participation consent.
        </p>
        <h2>Sharing your frame</h2>
        <p>
          Downloading saves a file to your device. If you choose your device’s
          Share menu, the selected app receives the file you explicitly share.
          Facebook sharing opens the campaign link; Framezi does not
          automatically upload your image to Facebook.
        </p>
        <h2>Service providers and security</h2>
        <p>
          Supabase provides authentication and database services, and the
          deployment provider serves the application. Hosting providers may
          process network information, such as IP addresses, for delivery and
          security. Framezi’s rate limiter stores short-lived keyed hashes
          rather than raw IP addresses. Administrator-uploaded branding and
          frame artwork may be publicly hosted.
        </p>
        <h2>Retention and your choices</h2>
        <p>
          Campaign organizers determine how long registration records are
          needed. Contact your campaign organizer or Infonits through its
          published contact channels to ask about access, correction, deletion,
          or withdrawal of consent. Deleting a campaign in Framezi removes its
          participant records and event history. Downloaded exports and provider
          backups may have separate retention periods.
        </p>
        <h2>Cookies and device storage</h2>
        <p>
          Secure session cookies support administrator sign-in and validate
          participation events. We do not store photographs in cookies,
          localStorage, sessionStorage, or service worker caches. This
          application does not include advertising or third-party tracking
          scripts.
        </p>
        <h2>Demo mode</h2>
        <p>
          When the application is not connected to Supabase, the demo clearly
          indicates that registration details are not saved. Demo photo
          processing remains entirely on your device.
        </p>
        <h2>Questions</h2>
        <p>
          Contact the organization named on your campaign page for
          campaign-specific privacy requests, or contact Infonits through its
          official website. This notice should be reviewed by the operator
          before launching a live campaign.
        </p>
      </main>
      <Footer />
    </>
  );
}
