"use client";

import { useEffect } from "react";

export function DirectModerationDialogs() {
  useEffect(() => {
    // Function to update the UI to make reason required
    const updateModerationDialogs = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            // Check for warning or ban dialogs by looking for title text instead of class
            const dialogElements = document.querySelectorAll("[role='dialog']");

            // Convert NodeList to Array before iterating
            Array.from(dialogElements).forEach((dialog) => {
              // Find dialogs with titles containing "Warning" or "Ban"
              const title = dialog.querySelector("h2, h3, [role='heading']");
              if (!title) return;

              const titleText = title.textContent || "";
              const isWarningDialog = titleText.includes("Warning");
              const isBanDialog = titleText.includes("Ban");

              if (isWarningDialog || isBanDialog) {
                // Find all labels in the dialog
                const labels = dialog.querySelectorAll("label");

                // Convert NodeList to Array before iterating
                Array.from(labels).forEach((label) => {
                  const labelText = label.textContent || "";

                  // Check if this is a reason label with optional text
                  if (
                    labelText.includes("Reason") &&
                    labelText.includes("optional")
                  ) {
                    // Replace (optional) with required indicator
                    label.innerHTML = label.innerHTML.replace(
                      "(optional)",
                      "<span class='text-red-500'>*</span>"
                    );

                    // Find the associated textarea
                    const textarea = dialog.querySelector("textarea");
                    if (textarea) {
                      textarea.setAttribute("required", "true");

                      // Find the submit button
                      const buttons = dialog.querySelectorAll("button");
                      let submitButton: HTMLButtonElement | null = null;

                      // Convert NodeList to Array before iterating
                      Array.from(buttons).forEach((button) => {
                        const buttonText = button.textContent || "";
                        if (
                          (isWarningDialog &&
                            buttonText.includes("Issue Warning")) ||
                          (isBanDialog && buttonText.includes("Ban"))
                        ) {
                          submitButton = button as HTMLButtonElement;
                        }
                      });

                      if (submitButton) {
                        // Cast submitButton to HTMLButtonElement to ensure addEventListener exists
                        (submitButton as HTMLButtonElement).addEventListener(
                          "click",
                          (e: MouseEvent) => {
                            if (!textarea.value.trim()) {
                              e.preventDefault();
                              e.stopPropagation();

                              // Add error message
                              const errorClass = "reason-error";
                              if (!dialog.querySelector(`.${errorClass}`)) {
                                const errorMessage =
                                  document.createElement("p");
                                errorMessage.className = `text-sm text-red-500 ${errorClass}`;
                                errorMessage.textContent = "Reason is required";

                                // Find parent safely and append error
                                const parent = textarea.parentNode;
                                if (parent) {
                                  parent.appendChild(errorMessage);
                                } else {
                                  // Fallback - append after textarea
                                  textarea.insertAdjacentElement(
                                    "afterend",
                                    errorMessage
                                  );
                                }
                              }
                              return false;
                            }
                          },
                          { capture: true }
                        );
                      }
                    }
                  }
                });
              }
            });
          }
        });
      });

      // Start observing the document for dialog additions
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    };

    updateModerationDialogs();
  }, []);

  return null;
}
