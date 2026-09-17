import type { Campaign } from "./types";
import { PRIVACY } from "@/config/brand";
export const demoCampaign: Campaign = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "University of Jaffna 41st General Convocation",
  slug: "uoj-convocation-2026",
  short_code: "uoj41",
  organization_name: "University of Jaffna",
  title: "Create Your Graduation Frame",
  description:
    "A milestone worth framing. Create your personalised University of Jaffna 41st General Convocation frame.",
  logo_url: "",
  cover_url: "/frames/uoj-41st-convocation.png",
  primary_color: "#063b82",
  secondary_color: "#eef3f9",
  accent_color: "#f4c430",
  event_date_text: "06, 07 & 08 October 2026",
  location: "University of Jaffna",
  status: "published",
  start_at: null,
  end_at: null,
  require_name: false,
  require_email: false,
  show_name_on_image: false,
  enable_face_centering: false,
  enable_share: true,
  enable_facebook: true,
  enable_png: true,
  enable_jpg: true,
  allow_duplicate_emails: true,
  allow_after_end: false,
  share_text:
    "I’m joining the University of Jaffna 41st General Convocation 2026. Choose your frame and create yours free with Framezi.",
  privacy_text: PRIVACY,
  cta_text: "Generate My Frame",
  filename_prefix: "Framezi",
  thank_you_text:
    "Congratulations on your graduation and best wishes for your future.",
  name_position: "bottom",
  name_color: "#ffffff",
  name_font: "Arial",
  name_font_size: 70,
  frames: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      name: "41st General Convocation",
      frame_url: "/frames/uoj-41st-convocation.png",
      thumbnail_url: "/frames/uoj-41st-convocation.png",
      sort_order: 0,
      is_active: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      name: "I’m Graduating",
      frame_url: "/frames/uoj-graduating.png",
      thumbnail_url: "/frames/uoj-graduating.png",
      sort_order: 1,
      is_active: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000004",
      name: "Elegant Convocation",
      frame_url: "/frames/uoj-elegant.png",
      thumbnail_url: "/frames/uoj-elegant.png",
      sort_order: 2,
      is_active: true,
    },
  ],
};
export const worldAnimalDayCampaign: Campaign = {
  id: "00000000-0000-4000-8000-000000000101",
  name: "World Animal Day 2026",
  slug: "world-animal-day-2026",
  short_code: "animals26",
  organization_name: "Ministry of Environment",
  title: "Stand Up for Every Animal",
  description:
    "Join World Animal Day 2026 and share a personal frame that celebrates compassion, protection, and coexistence.",
  logo_url: "",
  cover_url: "/frames/world-animal-day-2026.png",
  primary_color: "#116b3a",
  secondary_color: "#f4f7ed",
  accent_color: "#ef7d00",
  event_date_text: "October 4, 2026",
  location: "Worldwide",
  status: "published",
  start_at: null,
  end_at: null,
  require_name: false,
  require_email: false,
  show_name_on_image: false,
  enable_face_centering: false,
  enable_share: true,
  enable_facebook: true,
  enable_png: true,
  enable_jpg: true,
  allow_duplicate_emails: true,
  allow_after_end: false,
  share_text:
    "I’m standing up for animals this World Animal Day, October 4, 2026. Protect. Care. Coexist. Create your frame free with Framezi.",
  privacy_text: PRIVACY,
  cta_text: "Create My Animal Day Frame",
  filename_prefix: "World-Animal-Day-2026",
  thank_you_text:
    "Thank you for adding your voice for animal welfare and a kinder world.",
  name_position: "bottom",
  name_color: "#ffffff",
  name_font: "Arial",
  name_font_size: 70,
  frames: [
    {
      id: "00000000-0000-4000-8000-000000000102",
      name: "Protect · Care · Coexist",
      frame_url: "/frames/world-animal-day-2026.png",
      thumbnail_url: "/frames/world-animal-day-2026.png",
      sort_order: 0,
      is_active: true,
    },
  ],
};

export const demoCampaigns = [demoCampaign, worldAnimalDayCampaign];
export const emptyCampaign: Campaign = {
  ...demoCampaign,
  id: "",
  short_code: undefined,
  name: "",
  slug: "",
  organization_name: "",
  title: "",
  description: "",
  event_date_text: "",
  location: "",
  status: "draft",
  primary_color: "#155eef",
  secondary_color: "#f8fafc",
  accent_color: "#12b76a",
  frames: [],
  share_text: "I created my event frame with Framezi!",
  thank_you_text: "Thank you for celebrating with us!",
};
export function isOpen(c: Campaign) {
  const now = Date.now();
  return (
    c.status === "published" &&
    (!c.start_at || Date.parse(c.start_at) <= now) &&
    (!c.end_at || Date.parse(c.end_at) > now || c.allow_after_end)
  );
}
