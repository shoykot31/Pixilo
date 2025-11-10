const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");
const qualitySlider = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");

let currentImage = null;

qualitySlider.addEventListener("input", () => {
  qualityValue.textContent = qualitySlider.value;
  if (currentImage) compressAndPreview(currentImage);
});

imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      currentImage = img;
      compressAndPreview(img);
    }
    img.src = event.target.result;
  }
  reader.readAsDataURL(file);
});

function compressAndPreview(img) {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // Draw compressed image
  const quality = parseFloat(qualitySlider.value);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  
  const previewImg = new Image();
  previewImg.src = dataUrl;
  previewImg.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewImg, 0, 0);
  }
}

downloadBtn.addEventListener("click", () => {
  if (!currentImage) return alert("Please upload an image first!");

  const link = document.createElement("a");
  link.download = "pixilo_compressed.jpg";
  link.href = canvas.toDataURL("image/jpeg", parseFloat(qualitySlider.value));
  link.click();
});

