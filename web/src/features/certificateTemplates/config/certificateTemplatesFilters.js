// Declarative filter-bar config for the certificate-templates list (the config/
// folder is the contract — no inline filterConfig in the page).
//
// buildCertificateTemplatesFilters({ txt }) returns:
//   - search: debounced name search → filters.search
export function buildCertificateTemplatesFilters({ txt }) {
  return [{ type: "search", key: "search", label: txt.name }];
}
