const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Resume Upload (Memory Storage - parsed instantly on backend without hitting disk)
const resumeStorage = multer.memoryStorage();

const pdfFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed!"), false);
    }
};
const upload = multer({ storage: resumeStorage, fileFilter: pdfFilter });

// Profile Photo Upload (Local Disk Storage)
const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/profile");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const uploadPhoto = multer({ storage: photoStorage });

// Video Upload
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/videos");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const videoFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new Error("Only video files are allowed!"), false);
    }
};

const uploadVideo = multer({ 
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = {
    upload,
    uploadPhoto,
    uploadVideo
};
