import { Logo, Footer } from "@/components/Brand";
export const metadata = { title: "Terms | Framezi" };
export default function Page() {
  return (
    <>
      <header className="site-header">
        <Logo />
      </header>
      <main className="legal">
        <h1>Terms of use</h1>
        <p>Last updated: September 2026</p>
        <h2>Using Framezi</h2>
        <p>
          Framezi is an Infonits product for creating personalised event photo
          frames. Use the service lawfully and follow the campaign organizer’s
          participation rules. Provide accurate registration details and upload
          only photographs you have permission to use.
        </p>
        <h2>Your photographs</h2>
        <p>
          Your photographs are processed in your browser. You retain your rights
          in your photographs. You control whether to download or share a
          generated image and are responsible for obtaining any necessary
          permission from the people depicted.
        </p>
        <h2>Campaign content</h2>
        <p>
          Campaign organizers are responsible for their artwork, branding, event
          information, registration practices, and permissions. A sample
          campaign does not imply endorsement by the organization named. The
          University of Jaffna demo uses placeholder designs and no official
          university logo.
        </p>
        <p>
          Creator accounts may publish campaign frames and thumbnails. You must
          own or have permission to publish every uploaded design, logo, image,
          and message.
        </p>
        <h2>Availability</h2>
        <p>
          Features such as sharing, image decoding, and face centring depend on
          your browser. Campaigns may be changed, ended, or removed by their
          organizer. Keep your downloaded files if you wish to retain them;
          Framezi does not keep a server copy of your images.
        </p>
        <h2>Responsible use</h2>
        <p>
          Do not submit abusive or unlawful content, impersonate another person,
          attempt to access private records, or manipulate participation counts.
          Organizers should collect only the information they need and protect
          exported participant lists.
        </p>
        <h2>Privacy and questions</h2>
        <p>
          Read the Privacy Policy before participating. Contact the campaign
          organizer about event-specific questions or Infonits through its
          published contact channels for questions about Framezi. Applicable
          consumer rights are not excluded by these terms.
        </p>
      </main>
      <Footer />
    </>
  );
}
