document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card collapsed";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsSection = `<div class="participants-section collapsed">
              <div class="participants-header">
                <p><strong>Participants:</strong></p>
                <button type="button" class="participants-toggle" aria-expanded="false" aria-label="Toggle participants list">▾</button>
              </div>
              <div class="participants-body">
                ${details.participants.length
                  ? `<ul class="participants-list">
                      ${details.participants
                        .map(
                          (participant) =>
                            `<li class="participant-item">
                              <span class="participant-email">${participant}</span>
                              <button type="button" class="participant-remove" data-activity="${name}" data-email="${participant}" aria-label="Remove participant">×</button>
                            </li>`
                        )
                        .join("")}
                    </ul>`
                  : `<p class="participants-empty">No participants yet</p>`}
              </div>
            </div>`;

        const detailsSection = `
          <div class="activity-details">
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            ${participantsSection}
          </div>`;

        activityCard.innerHTML = `
          <div class="activity-card-header">
            <div>
              <h4>${name}</h4>
              <p>${details.description}</p>
            </div>
            <button type="button" class="activity-toggle" aria-expanded="false" aria-label="Toggle activity details">▾</button>
          </div>
          ${detailsSection}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const cardToggle = event.target.closest(".activity-toggle");
    if (cardToggle) {
      const card = cardToggle.closest(".activity-card");
      const expanded = cardToggle.getAttribute("aria-expanded") === "true";
      cardToggle.setAttribute("aria-expanded", String(!expanded));
      card.classList.toggle("collapsed", expanded);
      return;
    }

    const toggleButton = event.target.closest(".participants-toggle");
    if (toggleButton) {
      const section = toggleButton.closest(".participants-section");
      const expanded = toggleButton.getAttribute("aria-expanded") === "true";
      toggleButton.setAttribute("aria-expanded", String(!expanded));
      section.classList.toggle("collapsed", expanded);
      return;
    }

    const button = event.target.closest(".participant-remove");
    if (!button) return;

    const email = button.dataset.email;
    const activity = button.dataset.activity;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to remove participant.";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
