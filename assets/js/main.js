const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const FORM_ENDPOINT = "PASTE_GOOGLE_APPS_SCRIPT_OR_FORM_ENDPOINT_HERE";

const isPlaceholderEndpoint = (endpoint) =>
  !endpoint ||
  endpoint === "PASTE_GOOGLE_APPS_SCRIPT_OR_FORM_ENDPOINT_HERE" ||
  endpoint.includes("PASTE_");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll("[data-lead-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector('button[type="submit"]');

    if (!form.checkValidity()) {
      form.reportValidity();
      if (status) {
        status.textContent = "Please complete the required fields before submitting.";
      }
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.pageUrl = window.location.href;
    payload.pageTitle = document.title;
    payload.submittedAt = new Date().toISOString();
    payload.source = "IGCSE Lab Website";

    if (status) {
      status.textContent = "Submitting your enquiry...";
      status.classList.remove("is-error");
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText = submitButton.textContent;
      submitButton.textContent = "Submitting...";
    }

    if (isPlaceholderEndpoint(FORM_ENDPOINT)) {
      console.warn(
        "IGCSE Lab form endpoint is not connected. Replace FORM_ENDPOINT in assets/js/main.js before running ads.",
        payload
      );
      try {
        const saved = JSON.parse(localStorage.getItem("igcseLabTestLeads") || "[]");
        saved.push(payload);
        localStorage.setItem("igcseLabTestLeads", JSON.stringify(saved));
      } catch (error) {
        console.warn("Could not store local testing lead.", error);
      }
      if (status) {
        status.textContent =
          "Thank you. Your enquiry has been recorded locally for testing. Please connect the live form endpoint before running ads.";
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.originalText || "Submit";
      }
      return;
    }

    try {
      /*
        Connect FORM_ENDPOINT to one of these static-site-friendly destinations:
        - Google Apps Script Web App: deploy as a public Web App that accepts POST JSON.
        - Formspree: paste the form endpoint URL; enable JSON submissions in the project.
        - Netlify Forms: either keep Netlify's native HTML handling or point to a Netlify Function.
        - Make/Zapier webhook: paste the custom webhook URL and map the JSON fields.
        Do not place secret API keys in frontend code.
      */
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Form submission failed with status ${response.status}`);
      }

      if (status) {
        status.textContent = "Thank you. IGCSE Lab will contact you to arrange a suitable diagnostic time.";
      }
      form.reset();
    } catch (error) {
      console.error("IGCSE Lab form submission error:", error);
      if (status) {
        status.classList.add("is-error");
        status.textContent =
          "Sorry, the form could not be submitted. Please call, Zalo, or email IGCSE Lab directly.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.originalText || "Submit";
      }
    }
  });
});
