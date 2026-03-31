const fs = require('fs');
const path = require('path');

const navbarHTML_loggedIn = `
    <!-- Unified Top Navbar -->
    <nav class="navbar">
        <div class="nav-brand">
            <h2>AI Interview Platform</h2>
        </div>
        <div class="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/resume">Upload Resume</a>
            <a href="/interview">Start Interview</a>
            <a href="/results">Results</a>
            <a href="/coding">Practice</a>
            <a href="/top-questions">Top Questions</a>
            <a href="/mock-test-home">Mock Test</a>
            <a href="/profile">Profile</a>
            <a href="/reviews">Reviews</a>
        </div>
        <div class="nav-actions">
            <a href="/logout" class="logout-btn">Logout</a>
        </div>
    </nav>
`;

const navbarHTML_public = `
    <!-- Unified Top Navbar -->
    <nav class="navbar">
        <div class="nav-brand">
            <h2 style="color: var(--primary); margin: 0; font-size: 20px;">AI Interview Platform</h2>
        </div>
        <div class="nav-actions" style="display: flex; gap: 12px; align-items: center;">
            <a href="/index.html" style="color: var(--text-muted); text-decoration: none; font-weight: 500; font-size: 14px;">Login</a>
            <a href="/register.html" style="background: var(--primary); color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Sign Up</a>
        </div>
    </nav>
`;

function patchFile(filepath, navHTML) {
    let content = fs.readFileSync(filepath, 'utf8');

    if (content.includes('<!-- Unified Top Navbar -->') || content.includes('<nav class="navbar">')) {
        if (content.includes('<div class="navbar">')) {
             content = content.replace(/<div class="navbar">[\s\S]*?<\/div>/, navHTML);
        } else {
             return;
        }
    } else if (content.includes('<div class="navbar">')) {
         content = content.replace(/<div class="navbar">[\s\S]*?<\/div>/, navHTML);
    } else {
        content = content.replace(/<body>/, '<body>\n' + navHTML);
    }

    if (filepath.includes('views') && !content.includes('class="app-container"') && !filepath.includes('video-call')) {
         if (content.includes('<div class="content">')) {
             content = content.replace(/<div class="content">/, '<div class="app-container">\n        <main class="main-content">');
             // remove the last closing div from original content and append correct closers
             content = content.replace(/<\/div>\s*<\/body>/, '</main>\n    </div>\n</body>');
         } else {
             // naive wrap
             content = content.replace(/<\/nav>\s*/, '</nav>\n    <div class="app-container">\n        <main class="main-content">\n');
             content = content.replace(/<\/body>/, '        </main>\n    </div>\n</body>');
         }
    }

    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Patched " + filepath);
}

const viewsToPatch = [
    'views/results.html',
    'views/resume.html',
    'views/reviews.html',
    'views/top-questions.html'
];
viewsToPatch.forEach(f => {
    try { patchFile(path.join(__dirname, f), navbarHTML_loggedIn); } catch(e){}
});

try { patchFile(path.join(__dirname, 'public/index.html'), navbarHTML_public); } catch(e){}
try { patchFile(path.join(__dirname, 'public/register.html'), navbarHTML_public); } catch(e){}
