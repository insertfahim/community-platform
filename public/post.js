document.getElementById("needBtn").addEventListener("click", () => {
  document.getElementById("type").value = "request";
  document.getElementById("needBtn").classList.add("active");
  document.getElementById("offerBtn").classList.remove("active");
});

document.getElementById("offerBtn").addEventListener("click", () => {
  document.getElementById("type").value = "offer";
  document.getElementById("offerBtn").classList.add("active");
  document.getElementById("needBtn").classList.remove("active");
});


document.querySelectorAll(".categories button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".categories button").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("category").value = btn.dataset.value;
  });
});


document.querySelectorAll(".priority-buttons button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".priority-buttons button").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("priority").value = btn.dataset.value;
  });
});

// Form submit
document.getElementById("postForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    type: document.getElementById("type").value,
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value,
    priority: document.getElementById("priority").value,
    location: document.getElementById("location").value,
    contact_info: document.getElementById("contact_info").value
  };

  console.log("📤 Submitting form:", formData);
  console.log("🌍 Hostname:", window.location.hostname);

  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    console.log("📡 Status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Server error:", errorText);
      throw new Error(`Error ${res.status}: ${errorText}`);
    }

    const result = await res.json();
    console.log("✅ Response:", result);
    alert("Post submitted successfully!");

    // Reset form
    document.getElementById("postForm").reset();
    document.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
    document.getElementById("type").value = "request";
    document.getElementById("needBtn").classList.add("active");
    document.getElementById("offerBtn").classList.remove("active");

  } catch (err) {
    console.error("Error:", err);
    alert("❌ Submit error: " + err.message);
  }
});
