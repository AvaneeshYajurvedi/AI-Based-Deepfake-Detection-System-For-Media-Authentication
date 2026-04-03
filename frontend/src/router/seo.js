import { getPageConfig, getPathForPage } from "./routes";

function setMetaTag({ name, property, content }) {
  if (typeof document === "undefined") return;

  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  if (name) {
    element.setAttribute("name", name);
    element.removeAttribute("property");
  }

  if (property) {
    element.setAttribute("property", property);
    element.removeAttribute("name");
  }

  element.setAttribute("content", content);
}

function setCanonicalTag(href) {
  if (typeof document === "undefined") return;

  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

export function updateSeoForPage(page) {
  if (typeof document === "undefined") return;

  const config = getPageConfig(page);
  const { seo } = config;

  document.title = seo.title;
  setMetaTag({ name: "description", content: seo.description });
  setMetaTag({ name: "robots", content: seo.robots });
  setMetaTag({ property: "og:title", content: seo.title });
  setMetaTag({ property: "og:description", content: seo.description });
  setMetaTag({ property: "og:type", content: seo.ogType || "website" });
  setMetaTag({ name: "twitter:card", content: "summary_large_image" });
  setMetaTag({ name: "twitter:title", content: seo.title });
  setMetaTag({ name: "twitter:description", content: seo.description });
  setCanonicalTag(`${window.location.origin}${getPathForPage(page)}`);

  const existingSchema = document.head.querySelector('script[data-deepshield-schema="true"]');
  if (existingSchema) {
    existingSchema.remove();
  }

  if (seo.schema) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-deepshield-schema", "true");
    script.textContent = JSON.stringify(seo.schema);
    document.head.appendChild(script);
  }
}
