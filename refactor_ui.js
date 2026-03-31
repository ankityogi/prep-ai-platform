const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.html'));

const navbarHTML = `
    <!-- Unified Top Navbar -->
    <nav class="navbar">
        <div class="nav-brand">
            <h2>AI Interview Platform</h2>
        </div>
        <div class="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/resume">Upload</a>
            <a href="/interview">Interview</a>
            <a href="/results">Results</a>
            <a href="/coding">Practice</a>
            <a href="/top-questions">Questions</a>
            <a href="/mock-test-home">Mock Test</a>
            <a href="/profile">Profile</a>
            <a href="/reviews">Reviews</a>
        </div>
        <div class="nav-actions">
            <a href="/logout" class="logout-btn">Logout</a>
        </div>
    </nav>
`;

files.forEach(file => {
    let content = fs.readFileSync(path.join(viewsDir, file), 'utf8');

    // Make sure we only replace if there's a topbar or sidebar, indicating it's an app view
    if (content.includes('class="topbar"') || content.includes('class="sidebar"')) {
        // Remove topbar
        content = content.replace(/<div class="topbar">[\s\S]*?<\/div>/, navbarHTML);

        // Remove Top Navbar comment if exists
        content = content.replace(/<!-- Top Navbar -->\s*/, '');

        // Remove Sidebar comment and tag
        content = content.replace(/\s*<!-- Sidebar -->\s*<aside class="sidebar">[\s\S]*?<\/aside>/, '');
        
        // Remove rogue sidebar if comment was missing
        content = content.replace(/\s*<aside class="sidebar">[\s\S]*?<\/aside>/, '');
        content = content.replace(/\s*<div class="sidebar">[\s\S]*?<\/div>/, ''); // just in case

        fs.writeFileSync(path.join(viewsDir, file), content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
