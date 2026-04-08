const BASE = "http://localhost:5000";

document.getElementById("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msg");

    const data = {
        firstname: document.getElementById("firstname").value,
        lastname:  document.getElementById("lastname").value,
        phone:     document.getElementById("phone").value,
        email:     document.getElementById("email").value,
        start:     document.getElementById("start").value,
        end:       document.getElementById("end").value,
        delivery:  document.getElementById("delivery").checked ? "ใช่" : "ไม่",
    };

    try {
        const res = await fetch(`${BASE}/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
            msg.style.color = "green";
            msg.textContent = "บันทึกสำเร็จ!";
            document.getElementById("form").reset();
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        msg.style.color = "red";
        msg.textContent = "เกิดข้อผิดพลาด: " + err.message;
    }
});

function exportCSV() {
    window.open(`${BASE}/export`, "_blank");
}