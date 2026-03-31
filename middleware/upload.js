const multer = require("multer");

// Resume Upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const pdfFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed!"), false);
    }
};
const upload = multer({ storage, fileFilter: pdfFilter });

// Profile Photo Upload
const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/profile");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};
const uploadPhoto = multer({ storage: photoStorage, fileFilter: imageFilter });

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
