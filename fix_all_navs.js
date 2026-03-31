const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.html') && f !== 'video-call.html');

const baseNavbarHTML = `
    <!-- Unified Top Navbar -->
    <nav class="navbar">
        <div class="nav-brand">
            <h2>AI Interview Platform</h2>
        </div>
        <div class="nav-links">
            <a href="/dashboard" id="nav-dashboard">Dashboard</a>
            <a href="/resume" id="nav-resume">Upload Resume</a>
            <a href="/interview" id="nav-interview">Start Interview</a>
            <a href="/results" id="nav-results">Results</a>
            <a href="/coding" id="nav-coding">Practice</a>
            <a href="/top-questions" id="nav-top-questions">Top Questions</a>
            <a href="/mock-test-home" id="nav-mock-test-home">Mock Test</a>
            <a href="/profile" id="nav-profile">Profile</a>
            <a href="/reviews" id="nav-reviews">Reviews</a>
        </div>
        <div class="nav-actions">
            <a href="/logout" class="logout-btn">Logout</a>
        </div>
    </nav>
`;

files.forEach(file => {
    let content = fs.readFileSync(path.join(viewsDir, file), 'utf8');
    
    // Determine the base name without .html
    const basename = file.replace('.html', '');
    let fileNavbar = baseNavbarHTML;
    
    // Map mock-test.html to mock-test-home link
    let activeId = basename;
    if (basename === 'mock-test') activeId = 'mock-test-home';
    
    // Apply active class
    fileNavbar = fileNavbar.replace(`id="nav-${activeId}"`, `id="nav-${activeId}" class="active"`);
    
    // Clean up IDs so they are not left in production HTML (optional but cleaner)
    fileNavbar = fileNavbar.replace(/ id="nav-[^"]+"/g, '');

    // Now replace the existing navbar in the file
    // The previous scripts added `<!-- Unified Top Navbar -->\n    <nav class="navbar">...<\/nav>`
    // We can use a regex to match the whole <nav class="navbar"> block, including possible comments
    const navRegex = /(?:<!-- Unified Top Navbar -->\s*)?<nav class="navbar">[\s\S]*?<\/nav>/;
    
    if (navRegex.test(content)) {
        content = content.replace(navRegex, fileNavbar.trim());
        fs.writeFileSync(path.join(viewsDir, file), content, 'utf8');
        console.log(`Standardized ${file}`);
    } else {
        console.log(`WARNING: No navbar found in ${file}`);
        // force prepend to body just in case
        content = content.replace(/<body>/, '<body>\n    ' + fileNavbar.trim());
        fs.writeFileSync(path.join(viewsDir, file), content, 'utf8');
    }
});
