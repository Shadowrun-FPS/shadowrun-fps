/**
 * Updates moderation dialogs to make reason required
 * @param dialogElement The dialog DOM element
 */
export function makeReasonRequired(dialogElement: HTMLElement) {
  if (!dialogElement) return;

  // Find the reason label
  const labels = dialogElement.querySelectorAll("label");

  for (const label of Array.from(labels)) {
    const text = label.textContent || "";
    if (text.includes("Reason") && text.includes("optional")) {
      // Replace optional with required indicator
      label.innerHTML = label.innerHTML.replace(
        "(optional)",
        '<span class="text-red-500">*</span>'
      );

      // Find associated textarea
      const textarea = dialogElement.querySelector("textarea");
      if (textarea) {
        textarea.setAttribute("required", "true");
      }

      break;
    }
  }
}
