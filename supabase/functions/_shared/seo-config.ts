// Shared helper: load SEO module config from the `modules` table
// Allows edge functions to respect the admin's SEO settings.

export interface SEOConfig {
  site_title: string;
  title_template: string;
  site_description: string;
  site_url: string;
  default_og_image: string;
  twitter_handle: string;
  linkedin_url: string;
  google_analytics_id: string;
}

const FALLBACK: SEOConfig = {
  site_title: "Magnus Froste",
  title_template: "%s | Magnus Froste",
  site_description:
    "Innovation Strategist and AI integration expert with 20+ years experience in product development, business growth, and technological advancement.",
  site_url: "https://www.froste.eu",
  default_og_image: "/og-image.png",
  twitter_handle: "",
  linkedin_url: "",
  google_analytics_id: "",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadSEOConfig(supabase: any): Promise<SEOConfig> {
  try {
    const { data } = await supabase
      .from("modules")
      .select("module_config")
      .eq("module_type", "seo")
      .maybeSingle();
    const cfg = (data?.module_config || {}) as Partial<SEOConfig>;
    return { ...FALLBACK, ...cfg };
  } catch (e) {
    console.error("loadSEOConfig failed, using fallback:", e);
    return FALLBACK;
  }
}

export function absoluteUrl(maybeRelative: string, siteUrl: string): string {
  if (!maybeRelative) return siteUrl;
  if (maybeRelative.startsWith("http")) return maybeRelative;
  return `${siteUrl.replace(/\/$/, "")}${maybeRelative.startsWith("/") ? "" : "/"}${maybeRelative}`;
}

export function applyTitleTemplate(
  pageTitle: string | undefined,
  cfg: SEOConfig,
): string {
  if (!pageTitle) return cfg.site_title;
  if (!cfg.title_template.includes("%s")) return pageTitle;
  return cfg.title_template.replace("%s", pageTitle);
}
