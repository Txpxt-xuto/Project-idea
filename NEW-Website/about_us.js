function togglePDF() {
  const box = document.getElementById("pdf-box");
  const btn = document.querySelector(".pdf-btn");

  if (box.style.display === "none") {
    box.style.display = "block";
    btn.innerHTML = " ซ่อนรายละเอียด";
  } else {
    box.style.display = "none";
    btn.innerHTML = " ดูรายละเอียดเพิ่มเติม";
  }
}