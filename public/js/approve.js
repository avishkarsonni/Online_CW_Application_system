function toggle(){
    var blur = document.getElementById('blur');
    blur.classList.toggle('active');
    var popup = document.getElementById('popup');
    popup.classList.toggle('active');

    // Get the proof string
    var proofString = "{{srnorequest.proof}}";

    // Extract the filename from the proof string
    var filename = proofString.substring(proofString.lastIndexOf('/') + 1);

    // Construct the iframe source URL with the extracted filename
    var iframeSrc = "/uploads/" + filename;

    // Set the iframe source
    document.getElementById('pdfViewer').src = iframeSrc;
}
  