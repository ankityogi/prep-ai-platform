async function loadProfile() {
    console.log("Loading profile...");

    const res = await fetch("/api/profile", {
        credentials: "include"
    });

    const user = await res.json();

    console.log("User data:", user);
    document.getElementById("displayName").innerText = user.name;
    document.getElementById("displayEmail").innerText = user.email;
    
    document.getElementById("viewBio").innerText = user.bio || "Not added";
    document.getElementById("viewSkills").innerText = user.skills || "Not added";
    document.getElementById("viewCollege").innerText = user.college || "Not added";
    document.getElementById("viewYear").innerText = user.year || "Not added";

    document.getElementById("bio").value = user.bio || "";
    document.getElementById("skills").value = user.skills || "";
    document.getElementById("college").value = user.college || "";
    document.getElementById("year").value = user.year || "";

    if (user.profilePhoto) {
        document.getElementById("profileImage").src = user.profilePhoto;
    } else {
        document.getElementById("profileImage").src = "https://via.placeholder.com/100";
    }

    if (user.introVideo) {
        document.getElementById("introVideoPlayer").src = user.introVideo;
        document.getElementById("introVideoPlayer").style.display = "block";
        if (document.getElementById("videoContainer")) document.getElementById("videoContainer").style.display = "block";
    } else {
        document.getElementById("introVideoPlayer").style.display = "none";
        if (document.getElementById("videoContainer")) document.getElementById("videoContainer").style.display = "none";
    }

    if (user.resumeUrl) {
        document.getElementById("resumeUploadSection").style.display = "none";
        document.getElementById("resumeSuccessSection").style.display = "block";
    } else {
        document.getElementById("resumeUploadSection").style.display = "block";
        document.getElementById("resumeSuccessSection").style.display = "none";
    }


    calculateProfileProgress(user);
    loadPerformance();

}

function enableEdit() {
    document.getElementById("viewSection").style.display = "none";
    document.getElementById("editSection").style.display = "block";
}

function cancelEdit() {
    document.getElementById("editSection").style.display = "none";
    document.getElementById("viewSection").style.display = "block";
}

function calculateProfileProgress(user) {

    let totalFields = 5;
    let filled = 0;

    if (user.bio) filled++;
    if (user.skills) filled++;
    if (user.college) filled++;
    if (user.year) filled++;
    if (user.profilePhoto) filled++;   // for future use

    let percent = Math.round((filled / totalFields) * 100);

    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressPercent").innerText = percent + "%";
}

window.addEventListener("DOMContentLoaded", function () {

    const photoInput = document.getElementById("photoInput");

    if (photoInput) {
        photoInput.addEventListener("change", async function () {

            const file = this.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("photo", file);

            const res = await fetch("/api/profile/photo", {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await res.json();

            if (data.photo) {
                document.getElementById("profileImage").src = data.photo;
            }

            loadProfile(); // refresh progress
        });
    }

    const videoInput = document.getElementById("videoInput");

    if (videoInput) {
        videoInput.addEventListener("change", async function () {

            const file = this.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("video", file);

            const res = await fetch("/api/profile/video", {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await res.json();

            if (data.video) {
                document.getElementById("introVideoPlayer").src = data.video;
            }

            loadProfile();
        });
    }

    const resumeForm = document.getElementById("resumeForm");
    if (resumeForm) {
        resumeForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const fileInput = document.getElementById("resumeFileInput");
            if (!fileInput.files[0]) return;

            const submitBtn = document.getElementById("resumeUploadBtn");
            const loadingText = document.getElementById("resumeStatus");

            submitBtn.disabled = true;
            submitBtn.innerText = "Parsing...";
            loadingText.style.display = "block";

            const formData = new FormData();
            formData.append("resume", fileInput.files[0]);

            try {
                const res = await fetch("/api/resume-upload", {
                    method: "POST",
                    credentials: "include",
                    body: formData
                });

                const data = await res.json();
                
                if (res.ok) {
                    alert("Resume Successfully Parsed! Profile Data auto-filled.");
                    loadProfile(); // Refresh screen live
                } else {
                    alert(data.error || "Failed to parse resume.");
                }
            } catch (err) {
                console.error("Resume Upload Error", err);
                alert("Server error uploading resume.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "Upload & Parse";
                loadingText.style.display = "none";
                resumeForm.reset();
            }
        });
    }

});


async function saveProfile() {

    const data = {
        bio: document.getElementById("bio").value,
        skills: document.getElementById("skills").value,
        college: document.getElementById("college").value,
        year: document.getElementById("year").value
    };

    const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(data)
    });

    const result = await res.json();

    alert(result.message);

    cancelEdit();
    loadProfile();
}


async function loadPerformance(){

    const res = await fetch("/api/performance-summary", {
        credentials: "include"
    });

    const data = await res.json();

    document.getElementById("totalTests").innerText = data.totalTests;
    document.getElementById("averageScore").innerText = data.averageScore;
    document.getElementById("bestScore").innerText = data.bestScore;
    document.getElementById("lastScore").innerText = data.lastScore;
}


window.onload = loadProfile;

function showResumeUpload() {
    document.getElementById("resumeUploadSection").style.display = "block";
    document.getElementById("resumeSuccessSection").style.display = "none";
}
