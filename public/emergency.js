document.addEventListener("DOMContentLoaded", () => {
    const sectionHeaders = document.querySelectorAll(".section-header");
    const searchInput = document.getElementById("areaSearchInput");

    let allContacts = [];

    sectionHeaders.forEach((header) => {
        header.addEventListener("click", () => {
            const body = header.nextElementSibling;
            body.style.display =
                body.style.display === "none" ? "block" : "none";
        });
    });

    // fetch allcontacts
    async function fetchContacts() {
        try {
            const res = await fetch("/api/emergency");
            const data = await res.json();
            allContacts = data.contacts;
            renderContacts(allContacts);
        } catch (err) {
            console.error("Error fetching emergency contacts:", err);
        }
    }

    function renderContacts(contacts) {
        const categories = {
            Police: document.getElementById("policeList"),
            Hospital: document.getElementById("hospitalList"),
            "Fire Service": document.getElementById("fireList"),
            Volunteers: document.getElementById("volunteerList"),
        };

        Object.values(categories).forEach((list) => (list.innerHTML = ""));

        contacts.forEach((contact) => {
            const card = document.createElement("div");
            card.className = "contact-card";
            card.innerHTML = `
        <strong>${contact.name}</strong>
        <span>${contact.main_area}, ${contact.city}</span>
        <span>${contact.full_address}</span>
        <span>Phone: ${contact.phone || "N/A"}</span>
        <span>Fax: ${contact.fax || "N/A"}</span>
      `;
            categories[contact.category]?.appendChild(card);
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();
            const filtered = allContacts.filter(
                (c) =>
                    c.main_area.toLowerCase().includes(query) ||
                    c.city.toLowerCase().includes(query)
            );
            renderContacts(filtered);
        });
    }

    fetchContacts();
});
